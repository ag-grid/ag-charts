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
    private dispatching = false;

    addListener(handler: () => void) {
        return this.listeners.addListener('change', handler);
    }

    setIssueListener(listener: ValidationIssueListener | undefined, logger?: Logger) {
        this.issueListener = listener;
        this.issueListenerLogger = logger;
    }

    /**
     * Reports an issue to the user-supplied listener as it is recorded, ahead of any threshold or
     * dismissal filtering, so that delivery cannot depend on the overlay or console settings.
     */
    private dispatchIssue(issue: ValidationIssue) {
        if (this.issueListener == null) return;
        // A listener that synchronously re-applies options re-enters this method through the issues
        // that validation pass records, which would recurse without ever throwing.
        if (this.dispatching) return;
        this.dispatching = true;
        try {
            this.issueListener({ level: issue.severity, message: issue.message });
        } catch (error) {
            this.issueListenerLogger?.error('validations.onErrorRaised threw an error', error);
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
        const previousKeys = new Set(this.issues.map(keyOf));
        this.issues = issues;
        if (signature !== this.signature) {
            this.dismissed = false;
            this.signature = signature;
        }
        // Only issues the previous snapshot did not carry: an options pass that re-applies the same
        // issues does not re-warn on the console either, and the fast path replays them unvalidated.
        for (const issue of issues) {
            if (!previousKeys.has(keyOf(issue))) {
                this.dispatchIssue(issue);
            }
        }
        this.listeners.dispatch('change');
    }

    add(issue: ValidationIssue) {
        this.issues = [...this.issues, issue];
        this.signature = signatureOf(this.issues);
        this.dismissed = false;
        this.dispatchIssue(issue);
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
