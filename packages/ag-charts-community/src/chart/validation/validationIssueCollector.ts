import { Listeners } from '../../util/listeners';

export type ValidationSeverity = 'error' | 'warning' | 'deprecation';
export type ValidationOverlayLevel = ValidationSeverity | 'none';

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

export const SEVERITY_ORDER: ValidationSeverity[] = ['error', 'warning', 'deprecation'];

// Inclusive threshold: a level shows its own severity and every louder one ('error' is loudest).
const LEVEL_INCLUDES: Record<ValidationOverlayLevel, ValidationSeverity[]> = {
    error: ['error'],
    warning: ['error', 'warning'],
    deprecation: ['error', 'warning', 'deprecation'],
    none: [],
};

function signatureOf(issues: ValidationIssue[]): string {
    return issues.map((i) => `${i.severity}:${i.message}:${i.code ?? ''}`).join('\n');
}

/**
 * Per-chart-instance sink for validation issues (option misconfiguration and caught runtime errors).
 * The overlay processor subscribes to it and re-evaluates whenever the collection or threshold changes.
 */
export class ValidationIssueCollector {
    private issues: ValidationIssue[] = [];
    private dataIssues: ValidationIssue[] = [];
    private callbackIssues: ValidationIssue[] = [];
    private pendingCallbackIssues: ValidationIssue[] = [];
    private runtimeIssues: ValidationIssue[] = [];
    private overlayLevel: ValidationOverlayLevel = 'none';
    private dismissed = false;
    private signature = '';
    private readonly listeners = new Listeners<'change', () => void>();

    addListener(handler: () => void) {
        return this.listeners.addListener('change', handler);
    }

    setOverlayLevel(level: ValidationOverlayLevel) {
        if (this.overlayLevel === level) return;
        this.overlayLevel = level;
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
        this.refreshSignature();
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
        this.refreshSignature();
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
        this.refreshSignature();
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
        this.refreshSignature();
        this.listeners.dispatch('change');
    }

    dismiss() {
        if (this.dismissed) return;
        this.dismissed = true;
        this.listeners.dispatch('change');
    }

    hasVisibleIssues(): boolean {
        if (this.overlayLevel === 'none' || this.dismissed) return false;
        const allowed = LEVEL_INCLUDES[this.overlayLevel];
        return this.allIssues().some((issue) => allowed.includes(issue.severity));
    }

    getVisibleIssues(): GroupedValidationIssues {
        const allowed = LEVEL_INCLUDES[this.overlayLevel];
        const grouped: GroupedValidationIssues = { error: [], warning: [], deprecation: [] };
        for (const issue of this.allIssues()) {
            if (allowed.includes(issue.severity)) {
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

    private refreshSignature() {
        const signature = signatureOf(this.allIssues());
        if (signature !== this.signature) {
            this.dismissed = false;
            this.signature = signature;
        }
    }
}
