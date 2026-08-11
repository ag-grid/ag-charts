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
 * Minimal write-side of the collector, satisfied by `ValidationIssueCollector`. Update-time feeds
 * (data-key warnings, caught callback errors) emit through this without depending on the concrete class.
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
export class ValidationIssueCollector implements ValidationSink {
    private issues: ValidationIssue[] = [];
    private dataIssues: ValidationIssue[] = [];
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
        this.issues = issues;
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

    add(issue: ValidationIssue) {
        this.issues = [...this.issues, issue];
        this.refreshSignature();
        this.listeners.dispatch('change');
    }

    recordIssue(issue: ValidationIssue) {
        this.add(issue);
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
        return this.dataIssues.length === 0 ? this.issues : [...this.issues, ...this.dataIssues];
    }

    private refreshSignature() {
        const signature = signatureOf(this.allIssues());
        if (signature !== this.signature) {
            this.dismissed = false;
            this.signature = signature;
        }
    }
}
