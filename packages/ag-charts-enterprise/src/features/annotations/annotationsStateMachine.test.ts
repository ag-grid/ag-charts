import { describe, expect, it, vi } from 'vitest';

import { AnnotationsStateMachine } from './annotationsStateMachine';
import type { AnnotationsStateMachineContext } from './annotationsSuperTypes';
import { lineDatum } from './line/lineDatum';

describe('AnnotationsStateMachine coordinates', () => {
    it('applies a coordinate beyond Number precision and records it', () => {
        const datum = { ...lineDatum.create(), start: { x: 1, y: 2 }, end: { x: 3, y: 4 } };
        // Only what selecting and applying a change reads; the rest of the context is unused.
        const ctx = {
            datum: () => datum,
            node: () => undefined,
            selectLast: () => 0,
            select: vi.fn(),
            update: vi.fn(),
            recordAction: vi.fn(),
        } as unknown as AnnotationsStateMachineContext;

        const machine = new AnnotationsStateMachine(ctx);
        machine.transition('selectLast');
        machine.transition('coordinates', { start: { y: 9007199254740993n } });

        expect(datum.start.y).toBe(9007199254740993n);
        expect(ctx.recordAction).toHaveBeenCalledWith('Change line start to {"y":"9007199254740993"}');
    });
});
