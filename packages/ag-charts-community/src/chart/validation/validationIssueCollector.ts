import type { Logger } from 'ag-charts-core';

import { Listeners } from '../../util/listeners';

export type ValidationSeverity = 'error' | 'warning' | 'deprecation';

export interface ValidationIssue {
    severity: ValidationSeverity;
    message: string;
    code?: string;
}

export type GroupedValidationIssues = Record<ValidationSeverity, ValidationIssue[]>;

/**
 * Minimal write-side for update-time data warnings, implemented by `DataController`: the data pass emits
 * through this without depending on the concrete collector, buffering and de-duplicating its own issues,
 * which the collector then adopts wholesale via {@link ValidationIssueCollector.setDataIssues}.
 */
export interface ValidationSink {
    recordIssue(issue: ValidationIssue): void;
}

/** The order the overlay renders its severity sections in — presentation, not selection. */
export const SEVERITY_ORDER: ValidationSeverity[] = ['error', 'warning', 'deprecation'];

// An internal encoding of the overlay's severity selection as one integer, so it is cheap to store,
// compare and test. Deliberately independent of SEVERITY_ORDER, which means something else.
const SEVERITY_BIT: Record<ValidationSeverity, number> = { error: 1, warning: 2, deprecation: 4 };

function severityMask(severities: readonly ValidationSeverity[]): number {
    let mask = 0;
    for (const severity of severities) {
        mask |= SEVERITY_BIT[severity];
    }
    return mask;
}

export type ValidationIssueListener = (event: { severity: ValidationSeverity; message: string }) => void;

function keyOf(issue: ValidationIssue): string {
    return `${issue.severity}:${issue.message}:${issue.code ?? ''}`;
}

function signatureOf(issues: ValidationIssue[]): string {
    return issues.map(keyOf).join('\n');
}

/**
 * Per-chart-instance sink for validation issues (option misconfiguration and caught runtime errors).
 * The overlay processor subscribes to it and re-evaluates whenever the collection or selection changes.
 */
export class ValidationIssueCollector {
    private issues: ValidationIssue[] = [];
    private dataIssues: ValidationIssue[] = [];
    private callbackIssues: ValidationIssue[] = [];
    private pendingCallbackIssues: ValidationIssue[] = [];
    private runtimeIssues: ValidationIssue[] = [];
    private showOverlayMask = 0;
    private dismissed = false;
    private signature = '';
    private readonly listeners = new Listeners<'change', () => void>();
    private issueListener?: ValidationIssueListener;
    private issueListenerLogger?: Logger;
    private deliveredKeys = new Set<string>();
    private readonly pendingDispatch: ValidationIssue[] = [];
    private dispatching = false;

    addListener(handler: () => void) {
        return this.listeners.addListener('change', handler);
    }

    setIssueListener(listener: ValidationIssueListener | undefined, logger?: Logger) {
        // Delivery is deduplicated per listener: a replacement has been told nothing yet, so the
        // issues already in the collection must be reported to it rather than deduplicated away.
        if (listener !== this.issueListener) {
            this.deliveredKeys.clear();
        }
        this.issueListener = listener;
        this.issueListenerLogger = logger;
    }

    /**
     * Reports issues to the user-supplied listener as they are recorded, ahead of any severity or
     * dismissal filtering, so that delivery cannot depend on the overlay or console settings.
     */
    private dispatchIssues(issues: ValidationIssue[]) {
        if (this.issueListener == null || issues.length === 0) return;
        this.pendingDispatch.push(...issues);
        // A listener that synchronously re-applies options re-enters this method through the issues
        // that validation pass records; queue those and deliver them once the callback has returned.
        if (this.dispatching) return;

        // The batch belongs to the listener that was registered when its issues were raised, so a
        // callback that swaps the listener mid-drain does not receive the remainder of the batch.
        const listener = this.issueListener;
        this.dispatching = true;
        try {
            while (this.pendingDispatch.length > 0) {
                const pending = this.pendingDispatch.shift()!;
                try {
                    listener({ severity: pending.severity, message: pending.message });
                } catch (error) {
                    this.issueListenerLogger?.error('validations.issueRaised threw an error', error);
                }
            }
        } finally {
            this.dispatching = false;
        }
    }

    /**
     * Selects the severities the overlay shows, an empty selection showing no overlay at all. Compared
     * by content: the caller allocates a fresh array every options pass, so a reference guard would
     * never fire and every pass would dispatch a spurious change.
     */
    setShowOverlayOn(levels: readonly ValidationSeverity[]) {
        const mask = severityMask(levels);
        if (this.showOverlayMask === mask) return;
        this.showOverlayMask = mask;
        this.listeners.dispatch('change');
    }

    /**
     * Replace the option-sourced issues for a fresh option-application cycle. A dismissed overlay
     * only re-shows when the collection actually changes, so a re-apply with identical issues stays hidden.
     * The prior cycle's caught runtime error is superseded — the update about to run re-reports it if it
     * still throws — so the runtime feed is cleared here rather than accumulating across cycles.
     */
    setIssues(issues: ValidationIssue[]) {
        this.issues = issues;
        this.runtimeIssues = [];
        this.issuesChanged();
        this.listeners.dispatch('change');
    }

    /**
     * Replace the update-time data feed (invalid xKey/yKey warnings) each data-processing cycle.
     * Re-derived from the current config, so a fixed key simply isn't re-emitted next cycle — no
     * per-issue clearing, matching the stateless replace model of {@link setIssues}.
     */
    setDataIssues(issues: ValidationIssue[]) {
        // Called every data-processing pass; skip the common no-op so a valid config costs no dispatch.
        if (issues.length === 0 && this.dataIssues.length === 0) return;
        this.dataIssues = issues;
        this.issuesChanged();
        this.listeners.dispatch('change');
    }

    /**
     * Record a caught runtime error, de-duplicated within the runtime-error feed by severity + message.
     * The catch site re-reports the same failure on every failed update pass (a resize re-runs the update),
     * so an identical error counts once rather than accumulating. Kept in its own feed so a runtime error
     * never displaces — nor is displaced by — an option or data issue that merely shares a severity and
     * message. `code` (a per-throw stack) is excluded from the identity: it varies between throws of the
     * same error, and folding it in would grow the signature and spuriously un-dismiss the overlay.
     */
    recordRuntimeError(issue: ValidationIssue) {
        const duplicate = this.runtimeIssues.some(
            (existing) => existing.severity === issue.severity && existing.message === issue.message
        );
        if (duplicate) return;
        this.runtimeIssues.push(issue);
        this.issuesChanged();
        this.listeners.dispatch('change');
    }

    /**
     * Start a fresh buffer for callback errors caught during a render cycle. Callbacks (itemStyler,
     * formatters) can throw once per datum, so they are collected across the cycle and committed as a
     * whole via {@link commitCallbackIssues}, keeping the feed stateless like {@link setDataIssues}.
     */
    beginCallbackIssues() {
        this.pendingCallbackIssues = [];
    }

    /**
     * Whether anything has been buffered since the last {@link beginCallbackIssues} or
     * {@link commitCallbackIssues} — see `Chart.tryPerformUpdate()`.
     */
    hasPendingCallbackIssues(): boolean {
        return this.pendingCallbackIssues.length > 0;
    }

    /** Buffer a caught callback error for the current render cycle, de-duplicated by severity + message. */
    recordCallbackIssue(issue: ValidationIssue) {
        const duplicate = this.pendingCallbackIssues.some(
            (existing) => existing.severity === issue.severity && existing.message === issue.message
        );
        if (!duplicate) this.pendingCallbackIssues.push(issue);
    }

    /**
     * Replace the shown callback-error set with the buffer collected since {@link beginCallbackIssues}.
     * Re-derived each cycle, so a fixed callback simply isn't re-emitted — no per-issue clearing. The
     * atomic replace keeps a dismissed overlay dismissed when the set is unchanged.
     */
    commitCallbackIssues() {
        if (this.callbackIssues.length === 0 && this.pendingCallbackIssues.length === 0) return;
        // Copy, not alias: a callback that throws outside a render cycle (e.g. a tooltip formatter on
        // hover) still calls recordCallbackIssue, which must not mutate the shown set in place.
        this.callbackIssues = [...this.pendingCallbackIssues];
        // Emptied here too, not only in `beginCallbackIssues`: a retained buffer keeps
        // `hasPendingCallbackIssues()` true, and `Chart.tryPerformUpdate()` recommits on every update.
        this.pendingCallbackIssues = [];
        this.issuesChanged();
        this.listeners.dispatch('change');
    }

    dismiss() {
        if (this.dismissed) return;
        this.dismissed = true;
        this.listeners.dispatch('change');
    }

    hasVisibleIssues(): boolean {
        if (this.showOverlayMask === 0 || this.dismissed) return false;
        return this.allIssues().some((issue) => (this.showOverlayMask & SEVERITY_BIT[issue.severity]) !== 0);
    }

    getVisibleIssues(): GroupedValidationIssues {
        const grouped: GroupedValidationIssues = { error: [], warning: [], deprecation: [] };
        for (const issue of this.allIssues()) {
            if ((this.showOverlayMask & SEVERITY_BIT[issue.severity]) !== 0) {
                grouped[issue.severity].push(issue);
            }
        }
        return grouped;
    }

    private allIssues(): ValidationIssue[] {
        if (this.dataIssues.length === 0 && this.callbackIssues.length === 0 && this.runtimeIssues.length === 0) {
            return this.issues;
        }
        return [...this.issues, ...this.dataIssues, ...this.callbackIssues, ...this.runtimeIssues];
    }

    /**
     * The single choke point every feed mutation passes through, so a feed added later cannot reach the
     * collection without also reaching the issue listener.
     */
    private issuesChanged() {
        const all = this.allIssues();
        const signature = signatureOf(all);
        if (signature !== this.signature) {
            this.dismissed = false;
            this.signature = signature;
        }
        if (this.issueListener == null) return;
        // Only what this listener has not already been told about: an options pass that re-applies the
        // same issues does not re-warn on the console either, and the fast path replays them unvalidated.
        const delivered = this.deliveredKeys;
        this.deliveredKeys = new Set(all.map(keyOf));
        this.dispatchIssues(all.filter((issue) => !delivered.has(keyOf(issue))));
    }
}
