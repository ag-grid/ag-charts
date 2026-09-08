import { EventEmitter, type LogIssue, type LogLevel, type Logger, isArray, isLogLevel, isObject } from 'ag-charts-core';
import type {
    AgChartValidationIssueEvent,
    AgChartValidationSeverity,
    AgChartValidationsOptions,
} from 'ag-charts-types';

import type { EventsHub, EventsHubMap } from '../../core/eventsHub';
import type { ChartRegistry } from '../../module/moduleContext';
import { FailFastError } from '../../util/failFastError';
import { DEFAULT_CONSOLE_ON, DEFAULT_SHOW_OVERLAY_ON, DEFAULT_THROW_ON } from './validationDefaults';

export type ValidationSeverity = LogLevel;
export type ValidationIssue = LogIssue;
export type GroupedValidationIssues = Record<ValidationSeverity, ValidationIssue[]>;
export type ValidationIssueListener = (event: AgChartValidationIssueEvent) => void;

/** The order the overlay renders its severity sections in. */
export const SEVERITY_ORDER: ValidationSeverity[] = ['error', 'warning', 'deprecation'];

const SEVERITY_BIT: Record<ValidationSeverity, number> = { error: 1, warning: 2, deprecation: 4 };

function severityMask(selected: readonly ValidationSeverity[]): number {
    let mask = 0;
    for (const severity of selected) {
        mask |= SEVERITY_BIT[severity];
    }
    return mask;
}

// A stack varies between throws of one error, so identity is severity and message only.
function keyOf(issue: LogIssue): string {
    return `${issue.severity}:${issue.message}`;
}

/** The `validations` subtree of options not yet known to be valid: public keys, unknown values. */
type UnvalidatedValidations = { [K in keyof AgChartValidationsOptions]?: unknown };

export function getValidations(options: unknown): UnvalidatedValidations | undefined {
    if (!isObject(options)) return undefined;
    const { validations } = options as { validations?: unknown };
    return isObject(validations) ? validations : undefined;
}

// Rejected whole on any unrecognised element, matching the strict validator that runs later: honouring
// the recognised half of `['error', 'loud']` would act on a selection the consumer never made.
function severities(value: unknown, fallback: readonly AgChartValidationSeverity[]) {
    return isArray(value) && value.every(isLogLevel) ? value : fallback;
}

/**
 * Drops the trailing `, ignoring.` clause a validation message ends with: under an armed `throwOn` nothing
 * was ignored, the pass aborted. The console record keeps the original wording.
 */
function withoutIgnoredClause(message: string): string {
    return message.replace(/[,;]? ignoring\.$/i, '');
}

/**
 * Listeners mid-dispatch, keyed by identity across every instance: a consumer that re-applies failing
 * options from its own callback re-enters through a *new* options pass and a new provisional instance,
 * so nothing instance-level can see the recursion. Identity is exact in both directions: the re-applying
 * consumer is stopped, while a callback that legitimately builds a further chart still has that chart's
 * own listener called. A closure re-allocated per pass falls to the depth backstop.
 */
const dispatchingListeners = new Set<ValidationIssueListener>();
let dispatchDepth = 0;
const MAX_DISPATCH_DEPTH = 32;

/** The three services a validations pass needs; a chart context supplies them, and so does a provisional set. */
export type ValidationsRuntime = Pick<ChartRegistry, 'logger' | 'eventsHub' | 'validations'>;

/**
 * Options are validated before the chart that will own them exists, so the pass runs against a stand-in
 * set that reports exactly as the chart's would; `Chart.applyOptions()` then adopts what it collected.
 */
export function createProvisionalRuntime(logger: Logger): ValidationsRuntime {
    const eventsHub: EventsHub = new EventEmitter<EventsHubMap>();
    const validations = new ChartValidations({ logger, eventsHub });
    return { logger, eventsHub, validations };
}

/**
 * The single subscriber to `validation:issue`, implementing the four `validations` options as reactions
 * to the one event: `consoleOn` gates the Logger, `showOverlayOn` selects from the collection kept here,
 * `issueRaised` is told once per issue, and `throwOn` throws from inside the logging call.
 */
export class ChartValidations {
    private readonly logger: Logger;
    private readonly eventsHub: EventsHub;
    private readonly cleanup: (() => void)[] = [];

    private readonly collection = new Map<string, LogIssue>();
    private showOverlayMask = 0;
    private throwMask = 0;
    private failFastSuppressed = 0;
    private dismissed = false;

    private listener?: ValidationIssueListener;
    /** Keys already told to `listener`, so a re-raised issue is told once per cycle, as `warnOnce` prints once. */
    private told = new Set<string>();
    private readonly pendingDispatch: LogIssue[] = [];
    private dispatching = false;
    private reportingListenerError = false;

    constructor(ctx: Pick<ChartRegistry, 'logger' | 'eventsHub'> & Partial<Pick<ChartRegistry, 'chartState'>>) {
        this.logger = ctx.logger;
        this.eventsHub = ctx.eventsHub;
        // Every console emission becomes a hub event, so any module can observe them; this is the one subscriber.
        this.cleanup.push(
            this.logger.onIssue((issue) => this.eventsHub.emit('validation:issue', issue)),
            this.eventsHub.on('validation:issue', (issue) => this.onIssue(issue))
        );
        // A theme or preset can supply `validations` too, so the merged result is what applies after a pass.
        if (ctx.chartState) {
            this.cleanup.push(ctx.chartState.observe((get) => this.configure(get('options', 'validations'))));
        }
    }

    destroy() {
        for (const remove of this.cleanup) remove();
        this.cleanup.length = 0;
    }

    /**
     * Applies a `validations` subtree that may not have been validated yet, so every value is coerced and
     * an unusable one falls back: `consoleOn` to everything, since it must not silence the warning that
     * reports it, and the other three to nothing.
     */
    configure(raw: unknown) {
        const options = isObject(raw) ? (raw as UnvalidatedValidations) : undefined;
        this.logger.setEnabledLevels(severities(options?.consoleOn, DEFAULT_CONSOLE_ON));
        this.throwMask = severityMask(severities(options?.throwOn, DEFAULT_THROW_ON));
        this.setShowOverlayOn(severities(options?.showOverlayOn, DEFAULT_SHOW_OVERLAY_ON));
        const candidate = options?.issueRaised;
        const listener = typeof candidate === 'function' ? (candidate as ValidationIssueListener) : undefined;
        if (listener !== this.listener) {
            this.listener = listener;
            this.told.clear();
        }
    }

    /** Selects the severities the overlay shows; compared by content, since callers allocate a fresh array per pass. */
    setShowOverlayOn(selected: readonly ValidationSeverity[]) {
        const mask = severityMask(selected);
        if (this.showOverlayMask === mask) return;
        this.showOverlayMask = mask;
        this.eventsHub.emit('validation:change', null);
    }

    /** Holds fail-fast off for a pass with no caller to throw to (a CSS-variable refresh from a DOM event). */
    suspendFailFast(): () => void {
        this.failFastSuppressed++;
        return () => this.failFastSuppressed--;
    }

    /** The issues currently collected, oldest first. */
    get issues(): LogIssue[] {
        return [...this.collection.values()];
    }

    /**
     * Starts a cycle from the issues a re-validating options pass raised, dropping everything the previous
     * cycle collected. `handledBy` is the instance the pass reported through; when it is another one, what
     * it already told the same listener is not told again. A dismissed overlay stays dismissed while the
     * key set is unchanged.
     */
    beginCycle(issues: readonly LogIssue[], handledBy: ChartValidations = this) {
        const previous = new Set(this.collection.keys());
        const inherited = handledBy !== this && handledBy.listener === this.listener ? handledBy.told : undefined;
        this.collection.clear();
        const told = new Set<string>();
        const fresh: LogIssue[] = [];
        for (const issue of issues) {
            const key = keyOf(issue);
            if (this.collection.has(key)) continue;
            this.collection.set(key, issue);
            if (this.told.has(key) || inherited?.has(key)) {
                told.add(key);
            } else {
                fresh.push(issue);
            }
        }
        this.told = told;
        if (!this.sameKeys(previous)) {
            this.dismissed = false;
            this.eventsHub.emit('validation:change', null);
        }
        this.dispatch(fresh);
    }

    dismiss() {
        if (this.dismissed) return;
        this.dismissed = true;
        this.eventsHub.emit('validation:change', null);
    }

    hasVisibleIssues(): boolean {
        if (this.showOverlayMask === 0 || this.dismissed) return false;
        for (const issue of this.collection.values()) {
            if ((this.showOverlayMask & SEVERITY_BIT[issue.severity]) !== 0) return true;
        }
        return false;
    }

    getVisibleIssues(): GroupedValidationIssues {
        const grouped: GroupedValidationIssues = { error: [], warning: [], deprecation: [] };
        for (const issue of this.collection.values()) {
            if ((this.showOverlayMask & SEVERITY_BIT[issue.severity]) !== 0) {
                grouped[issue.severity].push(issue);
            }
        }
        return grouped;
    }

    private sameKeys(keys: Set<string>) {
        if (keys.size !== this.collection.size) return false;
        for (const key of this.collection.keys()) {
            if (!keys.has(key)) return false;
        }
        return true;
    }

    private onIssue(issue: LogIssue) {
        // A fail-fast throw re-logged by a catch site, or the report of a throwing listener: both already handled.
        if (issue.cause instanceof FailFastError || this.reportingListenerError) return;

        const key = keyOf(issue);
        if (!this.collection.has(key)) {
            this.collection.set(key, issue);
            this.dismissed = false;
            this.eventsHub.emit('validation:change', null);
        }
        if (!this.told.has(key)) this.dispatch([issue]);

        if (this.failFastSuppressed > 0 || (this.throwMask & SEVERITY_BIT[issue.severity]) === 0) return;
        throw new FailFastError(
            `AG Charts - validations.throwOn: ${issue.severity} - ${withoutIgnoredClause(issue.message)}`,
            { cause: issue.cause }
        );
    }

    /**
     * Tells `validations.issueRaised` about newly collected issues, ahead of any severity or dismissal
     * filtering. A listener that synchronously re-applies options re-enters through the issues that pass
     * raises; those queue and are delivered once the callback has returned.
     */
    private dispatch(issues: LogIssue[]) {
        for (const issue of issues) this.told.add(keyOf(issue));
        const listener = this.listener;
        if (listener == null || issues.length === 0) return;
        this.pendingDispatch.push(...issues);
        if (this.dispatching) return;
        if (dispatchingListeners.has(listener) || dispatchDepth >= MAX_DISPATCH_DEPTH) {
            this.pendingDispatch.length = 0;
            return;
        }

        this.dispatching = true;
        dispatchingListeners.add(listener);
        dispatchDepth++;
        try {
            while (this.pendingDispatch.length > 0) {
                const { severity, message } = this.pendingDispatch.shift()!;
                try {
                    listener({ severity, message });
                } catch (error) {
                    this.reportListenerError(error);
                }
            }
        } finally {
            dispatchDepth--;
            dispatchingListeners.delete(listener);
            this.dispatching = false;
        }
    }

    private reportListenerError(error: unknown) {
        this.reportingListenerError = true;
        try {
            this.logger.error('validations.issueRaised threw an error', error);
        } finally {
            this.reportingListenerError = false;
        }
    }
}
