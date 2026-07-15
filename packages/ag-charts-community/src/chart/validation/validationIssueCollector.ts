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

function signatureOf(issues: ValidationIssue[]): string {
    return issues.map((i) => `${i.severity}:${i.message}`).join('\n');
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
     */
    setIssues(issues: ValidationIssue[]) {
        const signature = signatureOf(issues);
        this.issues = issues;
        if (signature !== this.signature) {
            this.dismissed = false;
            this.signature = signature;
        }
        this.listeners.dispatch('change');
    }

    add(issue: ValidationIssue) {
        this.issues = [...this.issues, issue];
        this.signature = signatureOf(this.issues);
        this.dismissed = false;
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
