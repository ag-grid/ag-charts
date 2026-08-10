import type { Logger } from 'ag-charts-core';

import { Listeners } from '../../util/listeners';

export type ValidationSeverity = 'error' | 'warning' | 'deprecation';
export type ValidationOverlayLevel = ValidationSeverity | 'none';

export interface ValidationIssue {
    severity: ValidationSeverity;
    message: string;
    code?: string;
}

export type GroupedValidationIssues = Record<ValidationSeverity, ValidationIssue[]>;

export const SEVERITY_ORDER: ValidationSeverity[] = ['error', 'warning', 'deprecation'];

// Inclusive threshold: a level shows its own severity and every louder one ('error' is loudest).
const LEVEL_INCLUDES: Record<ValidationOverlayLevel, ValidationSeverity[]> = {
    error: ['error'],
    warning: ['error', 'warning'],
    deprecation: ['error', 'warning', 'deprecation'],
    none: [],
};

export type ValidationIssueListener = (event: { level: ValidationSeverity; message: string }) => void;

function keyOf(issue: ValidationIssue): string {
    return `${issue.severity}:${issue.message}:${issue.code ?? ''}`;
}

function signatureOf(issues: ValidationIssue[]): string {
    return issues.map(keyOf).join('\n');
}

/**
 * Per-chart-instance sink for validation issues (option misconfiguration and caught runtime errors).
 * The overlay processor subscribes to it and re-evaluates whenever the collection or threshold changes.
 */
export class ValidationIssueCollector {
    private issues: ValidationIssue[] = [];
    private overlayLevel: ValidationOverlayLevel = 'none';
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
     * Reports issues to the user-supplied listener as they are recorded, ahead of any threshold or
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
                    listener({ level: pending.severity, message: pending.message });
                } catch (error) {
                    this.issueListenerLogger?.error('validations.onErrorRaised threw an error', error);
                }
            }
        } finally {
            this.dispatching = false;
        }
    }

    setOverlayLevel(level: ValidationOverlayLevel) {
        if (this.overlayLevel === level) return;
        this.overlayLevel = level;
        this.listeners.dispatch('change');
    }

    /**
     * Replace the option-sourced issues for a fresh option-application cycle. A dismissed overlay
     * only re-shows when the collection actually changes, so a re-apply with identical issues stays hidden.
     */
    setIssues(issues: ValidationIssue[]) {
        const signature = signatureOf(issues);
        const delivered = this.deliveredKeys;
        this.deliveredKeys = new Set(issues.map(keyOf));
        this.issues = issues;
        if (signature !== this.signature) {
            this.dismissed = false;
            this.signature = signature;
        }
        // Only issues the current listener has not already been told about: an options pass that
        // re-applies the same issues does not re-warn on the console either, and the fast path
        // replays them unvalidated.
        this.dispatchIssues(issues.filter((issue) => !delivered.has(keyOf(issue))));
        this.listeners.dispatch('change');
    }

    add(issue: ValidationIssue) {
        this.issues = [...this.issues, issue];
        this.deliveredKeys.add(keyOf(issue));
        this.signature = signatureOf(this.issues);
        this.dismissed = false;
        this.dispatchIssues([issue]);
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
        return this.issues.some((issue) => allowed.includes(issue.severity));
    }

    getVisibleIssues(): GroupedValidationIssues {
        const allowed = LEVEL_INCLUDES[this.overlayLevel];
        const grouped: GroupedValidationIssues = { error: [], warning: [], deprecation: [] };
        for (const issue of this.issues) {
            if (allowed.includes(issue.severity)) {
                grouped[issue.severity].push(issue);
            }
        }
        return grouped;
    }
}
