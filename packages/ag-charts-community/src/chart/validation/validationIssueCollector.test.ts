import { describe, expect, it, vi } from 'vitest';

import { Logger } from 'ag-charts-core';

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

    it('re-shows a dismissed issue when only its code changes', () => {
        const collector = new ValidationIssueCollector();
        collector.setOverlayLevel('warning');
        collector.setIssues([{ severity: 'warning', message: 'bad option', code: 'series[0].a' }]);
        expect(collector.hasVisibleIssues()).toBe(true);

        collector.dismiss();
        expect(collector.hasVisibleIssues()).toBe(false);

        // Same severity and message but a different code must be treated as a changed issue.
        collector.setIssues([{ severity: 'warning', message: 'bad option', code: 'series[0].b' }]);
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

describe('ValidationIssueCollector - issue listener', () => {
    it('add() dispatches { level, message } for each severity', () => {
        const collector = new ValidationIssueCollector();
        const listener = vi.fn();
        collector.setIssueListener(listener);

        collector.add(errorIssue);
        collector.add(warningIssue);
        collector.add(deprecationIssue);

        expect(listener).toHaveBeenNthCalledWith(1, { level: 'error', message: errorIssue.message });
        expect(listener).toHaveBeenNthCalledWith(2, { level: 'warning', message: warningIssue.message });
        expect(listener).toHaveBeenNthCalledWith(3, { level: 'deprecation', message: deprecationIssue.message });
        expect(listener).toHaveBeenCalledTimes(3);
    });

    it('setIssues() dispatches once per new issue and not at all on an identical re-apply', () => {
        const collector = new ValidationIssueCollector();
        const listener = vi.fn();
        collector.setIssueListener(listener);

        collector.setIssues([errorIssue, warningIssue]);
        expect(listener).toHaveBeenCalledTimes(2);
        expect(listener).toHaveBeenNthCalledWith(1, { level: 'error', message: errorIssue.message });
        expect(listener).toHaveBeenNthCalledWith(2, { level: 'warning', message: warningIssue.message });

        listener.mockClear();
        collector.setIssues([errorIssue, warningIssue]);
        expect(listener).not.toHaveBeenCalled();

        collector.setIssues([errorIssue, warningIssue, deprecationIssue]);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ level: 'deprecation', message: deprecationIssue.message });
    });

    it('dispatches regardless of overlay level and dismissal', () => {
        const collector = new ValidationIssueCollector();
        const listener = vi.fn();
        collector.setIssueListener(listener);
        collector.setOverlayLevel('none');

        collector.add(errorIssue);
        expect(listener).toHaveBeenCalledTimes(1);

        collector.dismiss();
        listener.mockClear();
        collector.add(warningIssue);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ level: 'warning', message: warningIssue.message });
    });

    it('a throwing listener does not propagate out of add() or setIssues()', () => {
        const collector = new ValidationIssueCollector();
        const listener = vi.fn(() => {
            throw new Error('listener boom');
        });
        collector.setIssueListener(listener);

        expect(() => collector.add(errorIssue)).not.toThrow();
        expect(() => collector.setIssues([errorIssue, warningIssue])).not.toThrow();
        expect(listener).toHaveBeenCalledTimes(2);
    });

    it('reports a throwing listener via the supplied logger', () => {
        const collector = new ValidationIssueCollector();
        const listener = vi.fn(() => {
            throw new Error('listener boom');
        });
        const logger = new Logger();
        const loggerError = vi.spyOn(logger, 'error');
        collector.setIssueListener(listener, logger);

        collector.add(errorIssue);

        expect(loggerError).toHaveBeenCalledTimes(1);
        expect(loggerError).toHaveBeenCalledWith('validations.onErrorRaised threw an error', expect.any(Error));
    });

    it('a re-entrant listener does not recurse', () => {
        const collector = new ValidationIssueCollector();
        let calls = 0;
        const listener = vi.fn(() => {
            calls += 1;
            if (calls < 5) {
                collector.add(warningIssue);
            }
        });
        collector.setIssueListener(listener);

        collector.add(errorIssue);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(calls).toBe(1);
    });

    it('setIssueListener(undefined) stops delivery', () => {
        const collector = new ValidationIssueCollector();
        const listener = vi.fn();
        collector.setIssueListener(listener);

        collector.add(errorIssue);
        expect(listener).toHaveBeenCalledTimes(1);

        collector.setIssueListener(undefined);
        collector.add(warningIssue);
        collector.setIssues([errorIssue, warningIssue, deprecationIssue]);

        expect(listener).toHaveBeenCalledTimes(1);
    });
});
