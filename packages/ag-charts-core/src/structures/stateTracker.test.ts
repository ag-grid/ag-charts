import { describe, expect, it } from 'vitest';

import { StateTracker } from './stateTracker';

describe('StateTracker', () => {
    it('reports the most recently set state', () => {
        const tracker = new StateTracker<string>('default');

        tracker.set('a', 'one');
        tracker.set('b', 'two');

        expect(tracker.stateValue()).toBe('two');
        expect(tracker.stateId()).toBe('b');
    });

    it('falls back to the default once all states are cleared', () => {
        const tracker = new StateTracker<string>('default');
        const cleared: string | undefined = undefined;

        tracker.set('a', 'one');
        expect(tracker.stateValue()).toBe('one');

        // Callers clear their contribution by setting no value, as `updateCursor(id)` does.
        tracker.set('a', cleared);
        expect(tracker.stateValue()).toBe('default');
    });

    describe('lock', () => {
        it('reports the locked value regardless of later updates from others', () => {
            const tracker = new StateTracker<string>('default');
            tracker.set('hover', 'ew-resize');

            tracker.lock('drag', 'grabbing');
            expect(tracker.stateValue()).toBe('grabbing');
            expect(tracker.stateId()).toBe('drag');

            tracker.set('legend', 'pointer');
            tracker.set('hover', 'ns-resize');
            expect(tracker.stateValue()).toBe('grabbing');
        });

        it('resumes the current state on unlock, not the state at lock time', () => {
            const tracker = new StateTracker<string>('default');
            tracker.set('hover', 'ew-resize');
            tracker.lock('drag', 'grabbing');

            tracker.set('legend', 'pointer');
            tracker.unlock('drag');

            // Updates during the lock are recorded, so the latest wins once released.
            expect(tracker.stateValue()).toBe('pointer');
        });

        it('ignores an unlock from a caller that does not hold the lock', () => {
            const tracker = new StateTracker<string>('default');
            tracker.lock('drag', 'grabbing');

            tracker.unlock('someone-else');

            expect(tracker.isLocked()).toBe(true);
            expect(tracker.stateValue()).toBe('grabbing');
        });

        it('falls back to the default when unlocked with no other state set', () => {
            const tracker = new StateTracker<string>('default');

            tracker.lock('drag', 'grabbing');
            tracker.unlock('drag');

            expect(tracker.isLocked()).toBe(false);
            expect(tracker.stateValue()).toBe('default');
        });

        it('replaces the pinned value when the holder re-locks', () => {
            const tracker = new StateTracker<string>('default');

            tracker.lock('drag', 'grabbing');
            tracker.lock('drag', 'ns-resize');

            expect(tracker.stateValue()).toBe('ns-resize');
        });
    });
});
