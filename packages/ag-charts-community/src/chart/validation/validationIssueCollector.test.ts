import { describe, expect, it, vi } from 'vitest';

import { ValidationIssueCollector } from './validationIssueCollector';

const errorIssue = { severity: 'error', message: 'runtime boom' } as const;
const warningIssue = { severity: 'warning', message: 'bad option' } as const;
const deprecationIssue = { severity: 'deprecation', message: 'deprecated thing' } as const;

describe('ValidationIssueCollector', () => {
    it('shows nothing when overlayLevel is none, regardless of issues', () => {
        const collector = new ValidationIssueCollector();
        collector.setIssues([errorIssue, warningIssue]);
        expect(collector.hasVisibleIssues()).toBe(false);
    });

    it('applies inclusive threshold semantics (level shows its severity and every louder one)', () => {
        const collector = new ValidationIssueCollector();
        collector.setIssues([errorIssue, warningIssue, deprecationIssue]);

        collector.setOverlayLevel('error');
        expect(collector.getVisibleIssues()).toEqual({ error: [errorIssue], warning: [], deprecation: [] });

        collector.setOverlayLevel('warning');
        expect(collector.getVisibleIssues()).toEqual({
            error: [errorIssue],
            warning: [warningIssue],
            deprecation: [],
        });

        collector.setOverlayLevel('deprecation');
        expect(collector.getVisibleIssues()).toEqual({
            error: [errorIssue],
            warning: [warningIssue],
            deprecation: [deprecationIssue],
        });
    });

    it('does not show a warning-only collection at the error threshold', () => {
        const collector = new ValidationIssueCollector();
        collector.setOverlayLevel('error');
        collector.setIssues([warningIssue]);
        expect(collector.hasVisibleIssues()).toBe(false);
    });

    it('captures a caught runtime error as an error-severity issue', () => {
        const collector = new ValidationIssueCollector();
        collector.setOverlayLevel('error');
        collector.add({ severity: 'error', message: 'update error', code: 'stack trace' });
        expect(collector.hasVisibleIssues()).toBe(true);
        expect(collector.getVisibleIssues().error).toHaveLength(1);
    });

    it('dismiss hides the overlay; an identical re-apply stays dismissed but a changed one re-shows', () => {
        const collector = new ValidationIssueCollector();
        collector.setOverlayLevel('warning');
        collector.setIssues([warningIssue]);
        expect(collector.hasVisibleIssues()).toBe(true);

        collector.dismiss();
        expect(collector.hasVisibleIssues()).toBe(false);

        collector.setIssues([warningIssue]);
        expect(collector.hasVisibleIssues()).toBe(false);

        collector.setIssues([warningIssue, { severity: 'warning', message: 'another bad option' }]);
        expect(collector.hasVisibleIssues()).toBe(true);
    });

    it('notifies listeners when the collection or threshold changes', () => {
        const collector = new ValidationIssueCollector();
        const listener = vi.fn();
        collector.addListener(listener);

        collector.setOverlayLevel('warning');
        collector.setIssues([warningIssue]);
        collector.add(errorIssue);
        collector.dismiss();

        expect(listener).toHaveBeenCalledTimes(4);
    });
});
