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

// Under an armed `throwOn` nothing was ignored, the pass aborted; the console record keeps the wording.
function withoutIgnoredClause(message: string): string {
    return message.replace(/[,;]? ignoring\.$/i, '');
}

// Module-level: a listener that re-applies failing options re-enters through a new options pass and a new
// provisional instance, so only listener identity can see the recursion. A per-pass closure hits the depth cap.
const dispatchingListeners = new Set<ValidationIssueListener>();
let dispatchDepth = 0;
const MAX_DISPATCH_DEPTH = 32;

/** The three services a validations pass needs; a chart context supplies them, and so does a provisional set. */
export type ValidationsRuntime = Pick<ChartRegistry, 'logger' | 'eventsHub' | 'validations'>;

/** For an options pass that runs before the chart owning it exists; `ChartOptions.adopt()` hands over. */
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
    /** Keys already told to `listener`, so a re-raised issue is told once per listener, as `warnOnce` prints once. */
    private readonly told = new Set<string>();
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
     * Accepts an unvalidated `validations` subtree. An unusable value falls back: `consoleOn` to everything,
     * so it cannot silence the warning that reports it, and the other three to nothing.
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
     * Replaces the collection with what a re-validating pass raised. `handledBy` is the instance the pass
     * reported through; what it or this instance already told the same listener is not told again.
     */
    beginCycle(issues: readonly LogIssue[], handledBy: ChartValidations = this) {
        const previous = new Set(this.collection.keys());
        if (handledBy !== this && handledBy.listener === this.listener) {
            for (const key of handledBy.told) this.told.add(key);
        }
        this.collection.clear();
        const fresh: LogIssue[] = [];
        for (const issue of issues) {
            const key = keyOf(issue);
            if (this.collection.has(key)) continue;
            this.collection.set(key, issue);
            if (!this.told.has(key)) fresh.push(issue);
        }
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
            if ((this.showOverlayMask & SEVERITY_BIT[issue.severity]) !== 0) {
                this.eventsHub.emit('validation:change', null);
            }
        }
        if (!this.told.has(key)) this.dispatch([issue]);

        if (this.failFastSuppressed > 0 || (this.throwMask & SEVERITY_BIT[issue.severity]) === 0) return;
        throw new FailFastError(
            `AG Charts - validations.throwOn: ${issue.severity} - ${withoutIgnoredClause(issue.message)}`,
            this,
            { cause: issue.cause }
        );
    }

    // Never gated by severity or dismissal. Issues raised re-entrantly from the listener queue behind it.
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
                    // This chart's own fail-fast throw is owed to the caller; another chart's is the listener's to handle.
                    if (error instanceof FailFastError && error.source === this) throw error;
                    this.reportListenerError(error);
                }
            }
        } finally {
            this.pendingDispatch.length = 0;
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
