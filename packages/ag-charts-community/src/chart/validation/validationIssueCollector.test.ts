import { describe, expect, it, vi } from 'vitest';

import { Logger } from 'ag-charts-core';

import { ValidationIssueCollector, severityAtOrAbove } from './validationIssueCollector';

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
        collector.recordRuntimeError({ severity: 'error', message: 'update error', code: 'stack trace' });
        expect(collector.hasVisibleIssues()).toBe(true);
        expect(collector.getVisibleIssues().error).toHaveLength(1);
    });

    it('de-duplicates an identical caught runtime error re-reported on every update pass', () => {
        const collector = new ValidationIssueCollector();
        collector.setOverlayLevel('error');
        const runtimeError = { severity: 'error', message: 'update error', code: 'stack trace' } as const;

        // Each resize/layout pass re-runs the update, which re-throws and re-reports the same error.
        for (let pass = 0; pass < 3; pass++) {
            collector.recordRuntimeError(runtimeError);
        }

        expect(collector.getVisibleIssues().error).toEqual([runtimeError]);
    });

    it('de-duplicates a re-reported runtime error even when only its code (stack trace) differs', () => {
        const collector = new ValidationIssueCollector();
        collector.setOverlayLevel('error');

        collector.recordRuntimeError({ severity: 'error', message: 'update error', code: 'stack A' });
        collector.recordRuntimeError({ severity: 'error', message: 'update error', code: 'stack B' });

        expect(collector.getVisibleIssues().error).toHaveLength(1);
    });

    it('keeps distinct caught runtime errors (different message)', () => {
        const collector = new ValidationIssueCollector();
        collector.setOverlayLevel('error');

        collector.recordRuntimeError({ severity: 'error', message: 'boom one' });
        collector.recordRuntimeError({ severity: 'error', message: 'boom two' });

        expect(collector.getVisibleIssues().error).toHaveLength(2);
    });

    it('keeps a dismissed runtime-error overlay dismissed when the same error re-reports next pass', () => {
        const collector = new ValidationIssueCollector();
        collector.setOverlayLevel('error');
        const runtimeError = { severity: 'error', message: 'update error', code: 'stack trace' } as const;

        collector.recordRuntimeError(runtimeError);
        collector.dismiss();
        expect(collector.hasVisibleIssues()).toBe(false);

        // A subsequent resize re-throws the identical error; the overlay must stay dismissed
        // *because the shown set is unchanged* (still exactly one issue), not merely re-hidden.
        collector.recordRuntimeError(runtimeError);
        expect(collector.hasVisibleIssues()).toBe(false);
        expect(collector.getVisibleIssues().error).toHaveLength(1);
    });

    it('does not conflate a caught runtime error with an option issue that shares its severity and message', () => {
        const collector = new ValidationIssueCollector();
        collector.setOverlayLevel('error');
        const shared = { severity: 'error', message: 'boom' } as const;

        collector.setIssues([shared]); // an option-validation error
        collector.recordRuntimeError(shared); // an independent caught runtime error that happens to coincide

        // Both are legitimate, independent issues from different feeds — neither may silently swallow the other.
        expect(collector.getVisibleIssues().error).toHaveLength(2);
    });

    it('clears a caught runtime error when a fresh option-application cycle sets new issues', () => {
        const collector = new ValidationIssueCollector();
        collector.setOverlayLevel('error');
        collector.recordRuntimeError({ severity: 'error', message: 'update error' });
        expect(collector.getVisibleIssues().error).toHaveLength(1);

        // A new option-application cycle supersedes the prior cycle's caught error.
        collector.setIssues([]);
        expect(collector.hasVisibleIssues()).toBe(false);
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

    it('surfaces data-feed issues and clears them statelessly when the next cycle is clean', () => {
        const collector = new ValidationIssueCollector();
        collector.setOverlayLevel('warning');
        const dataIssue = { severity: 'warning', message: "the key 'xyz' was not found in any data element." } as const;

        collector.setDataIssues([dataIssue]);
        expect(collector.getVisibleIssues().warning).toEqual([dataIssue]);

        // A fixed config re-derives an empty data feed next cycle — no per-issue clearing needed.
        collector.setDataIssues([]);
        expect(collector.hasVisibleIssues()).toBe(false);
    });

    it('combines option-feed and data-feed issues in the overlay', () => {
        const collector = new ValidationIssueCollector();
        collector.setOverlayLevel('warning');
        collector.setIssues([warningIssue]);
        const dataIssue = { severity: 'warning', message: 'invalid value of type [object] ignored: [x]' } as const;
        collector.setDataIssues([dataIssue]);

        expect(collector.getVisibleIssues().warning).toEqual([warningIssue, dataIssue]);
    });

    it('re-shows a dismissed overlay only when the data feed changes', () => {
        const collector = new ValidationIssueCollector();
        collector.setOverlayLevel('warning');
        const dataIssue = { severity: 'warning', message: 'bad key' } as const;
        collector.setDataIssues([dataIssue]);
        collector.dismiss();
        expect(collector.hasVisibleIssues()).toBe(false);

        collector.setDataIssues([dataIssue]);
        expect(collector.hasVisibleIssues()).toBe(false);

        collector.setDataIssues([dataIssue, { severity: 'warning', message: 'another bad key' }]);
        expect(collector.hasVisibleIssues()).toBe(true);
    });

    it('surfaces buffered callback errors as error issues, de-duplicated within a render cycle', () => {
        const collector = new ValidationIssueCollector();
        collector.setOverlayLevel('error');
        const callbackError = {
            severity: 'error',
            message: 'Uncaught exception in user callback `series[0].itemStyler`: boom',
        } as const;

        collector.beginCallbackIssues();
        // A per-datum styler throws once per datum; identical throws collapse to a single entry.
        collector.recordCallbackIssue(callbackError);
        collector.recordCallbackIssue(callbackError);
        collector.commitCallbackIssues();

        expect(collector.getVisibleIssues().error).toEqual([callbackError]);
    });

    it('clears callback errors statelessly when the next render cycle no longer throws', () => {
        const collector = new ValidationIssueCollector();
        collector.setOverlayLevel('error');
        const callbackError = { severity: 'error', message: 'Uncaught exception in user callback: boom' } as const;

        collector.beginCallbackIssues();
        collector.recordCallbackIssue(callbackError);
        collector.commitCallbackIssues();
        expect(collector.hasVisibleIssues()).toBe(true);

        // A fixed callback re-derives an empty buffer next cycle — no per-issue clearing.
        collector.beginCallbackIssues();
        collector.commitCallbackIssues();
        expect(collector.hasVisibleIssues()).toBe(false);
    });

    it('keeps a dismissed callback-error overlay dismissed when the same error re-commits next cycle', () => {
        const collector = new ValidationIssueCollector();
        collector.setOverlayLevel('error');
        const callbackError = { severity: 'error', message: 'Uncaught exception in user callback: boom' } as const;

        collector.beginCallbackIssues();
        collector.recordCallbackIssue(callbackError);
        collector.commitCallbackIssues();
        collector.dismiss();
        expect(collector.hasVisibleIssues()).toBe(false);

        // Still-broken callback throws again next cycle; the identical committed set stays dismissed.
        collector.beginCallbackIssues();
        collector.recordCallbackIssue(callbackError);
        collector.commitCallbackIssues();
        expect(collector.hasVisibleIssues()).toBe(false);
    });

    it('does not re-commit a committed callback error on a pass that buffered nothing new', () => {
        const collector = new ValidationIssueCollector();
        collector.setOverlayLevel('error');
        const callbackError = { severity: 'error', message: 'Uncaught exception in user callback: boom' } as const;

        collector.beginCallbackIssues();
        collector.recordCallbackIssue(callbackError);
        collector.commitCallbackIssues();

        // `Chart.tryPerformUpdate()` commits whenever this reads true, on every update — so a committed
        // buffer left in place turns a one-off callback error into per-update work forever.
        expect(collector.hasPendingCallbackIssues()).toBe(false);
        // The shown set, not the buffer, is what keeps the error live across the passes that skip.
        expect(collector.getVisibleIssues().error).toEqual([callbackError]);

        // A pass that throws again outside a begin/commit cycle still arms the gate.
        collector.recordCallbackIssue(callbackError);
        expect(collector.hasPendingCallbackIssues()).toBe(true);
    });

    it('notifies listeners when the collection or threshold changes', () => {
        const collector = new ValidationIssueCollector();
        const listener = vi.fn();
        collector.addListener(listener);

        collector.setOverlayLevel('warning');
        collector.setIssues([warningIssue]);
        collector.recordRuntimeError(errorIssue);
        collector.dismiss();

        expect(listener).toHaveBeenCalledTimes(4);
    });
});

describe('severityAtOrAbove', () => {
    it.each<{
        level: 'error' | 'warning' | 'deprecation' | 'none';
        severity: 'error' | 'warning' | 'deprecation';
        expected: boolean;
    }>([
        // error level admits only error
        { level: 'error', severity: 'error', expected: true },
        { level: 'error', severity: 'warning', expected: false },
        { level: 'error', severity: 'deprecation', expected: false },
        // warning level admits error and warning
        { level: 'warning', severity: 'error', expected: true },
        { level: 'warning', severity: 'warning', expected: true },
        { level: 'warning', severity: 'deprecation', expected: false },
        // deprecation level admits all three severities
        { level: 'deprecation', severity: 'error', expected: true },
        { level: 'deprecation', severity: 'warning', expected: true },
        { level: 'deprecation', severity: 'deprecation', expected: true },
        // none level admits nothing
        { level: 'none', severity: 'error', expected: false },
        { level: 'none', severity: 'warning', expected: false },
        { level: 'none', severity: 'deprecation', expected: false },
    ])('level=$level, severity=$severity => $expected', ({ level, severity, expected }) => {
        expect(severityAtOrAbove(level, severity)).toBe(expected);
    });
});

describe('ValidationIssueCollector - issue listener', () => {
    it('dispatches { level, message } for each severity', () => {
        const collector = new ValidationIssueCollector();
        const listener = vi.fn();
        collector.setIssueListener(listener);

        collector.setIssues([errorIssue, warningIssue, deprecationIssue]);

        expect(listener).toHaveBeenNthCalledWith(1, { level: 'error', message: errorIssue.message });
        expect(listener).toHaveBeenNthCalledWith(2, { level: 'warning', message: warningIssue.message });
        expect(listener).toHaveBeenNthCalledWith(3, { level: 'deprecation', message: deprecationIssue.message });
        expect(listener).toHaveBeenCalledTimes(3);
    });

    it('dispatches for every feed, not just the option-sourced one', () => {
        const collector = new ValidationIssueCollector();
        const listener = vi.fn();
        collector.setIssueListener(listener);

        collector.setDataIssues([warningIssue]);
        collector.recordRuntimeError(errorIssue);
        collector.beginCallbackIssues();
        collector.recordCallbackIssue(deprecationIssue);
        collector.commitCallbackIssues();

        expect(listener).toHaveBeenCalledTimes(3);
        expect(listener).toHaveBeenNthCalledWith(1, { level: 'warning', message: warningIssue.message });
        expect(listener).toHaveBeenNthCalledWith(2, { level: 'error', message: errorIssue.message });
        expect(listener).toHaveBeenNthCalledWith(3, { level: 'deprecation', message: deprecationIssue.message });
    });

    it('does not re-dispatch a runtime error the catch site re-reports each failed pass', () => {
        const collector = new ValidationIssueCollector();
        const listener = vi.fn();
        collector.setIssueListener(listener);

        collector.recordRuntimeError(errorIssue);
        collector.recordRuntimeError(errorIssue);

        expect(listener).toHaveBeenCalledTimes(1);
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

        collector.setIssues([errorIssue]);
        expect(listener).toHaveBeenCalledTimes(1);

        collector.dismiss();
        listener.mockClear();
        collector.setDataIssues([warningIssue]);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ level: 'warning', message: warningIssue.message });
    });

    it('a throwing listener does not propagate out of the recording call', () => {
        const collector = new ValidationIssueCollector();
        const listener = vi.fn(() => {
            throw new Error('listener boom');
        });
        collector.setIssueListener(listener);

        expect(() => collector.recordRuntimeError(errorIssue)).not.toThrow();
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

        collector.setIssues([errorIssue]);

        expect(loggerError).toHaveBeenCalledTimes(1);
        expect(loggerError).toHaveBeenCalledWith('validations.onErrorRaised threw an error', expect.any(Error));
    });

    it('a re-entrant listener does not recurse, and its issues are delivered after it returns', () => {
        const collector = new ValidationIssueCollector();
        const depths: number[] = [];
        let depth = 0;
        let calls = 0;
        const listener = vi.fn(() => {
            depth += 1;
            depths.push(depth);
            calls += 1;
            if (calls < 5) {
                collector.setDataIssues([{ severity: 'warning', message: `re-entrant ${calls}` }]);
            }
            depth -= 1;
        });
        collector.setIssueListener(listener);

        collector.setIssues([errorIssue]);

        expect(listener).toHaveBeenCalledTimes(5);
        expect(depths).toEqual([1, 1, 1, 1, 1]);
    });

    it('a listener attached while issues are already collected is told about them', () => {
        const collector = new ValidationIssueCollector();
        const first = vi.fn();
        collector.setIssueListener(first);
        collector.setIssues([errorIssue, warningIssue]);
        expect(first).toHaveBeenCalledTimes(2);

        const second = vi.fn();
        collector.setIssueListener(second);
        collector.setIssues([errorIssue, warningIssue]);

        expect(second).toHaveBeenCalledTimes(2);
        expect(second).toHaveBeenNthCalledWith(1, { level: 'error', message: errorIssue.message });
        expect(second).toHaveBeenNthCalledWith(2, { level: 'warning', message: warningIssue.message });
        expect(first).toHaveBeenCalledTimes(2);
    });

    it('a listener replaced from inside a callback does not receive the rest of that batch', () => {
        const collector = new ValidationIssueCollector();
        const replacement = vi.fn();
        const original = vi.fn(() => {
            collector.setIssueListener(replacement);
        });
        collector.setIssueListener(original);

        collector.setIssues([errorIssue, warningIssue]);

        expect(original).toHaveBeenCalledTimes(2);
        expect(replacement).not.toHaveBeenCalled();
    });

    it('setIssueListener(undefined) stops delivery', () => {
        const collector = new ValidationIssueCollector();
        const listener = vi.fn();
        collector.setIssueListener(listener);

        collector.setIssues([errorIssue]);
        expect(listener).toHaveBeenCalledTimes(1);

        collector.setIssueListener(undefined);
        collector.setDataIssues([warningIssue]);
        collector.setIssues([errorIssue, warningIssue, deprecationIssue]);

        expect(listener).toHaveBeenCalledTimes(1);
    });
});
