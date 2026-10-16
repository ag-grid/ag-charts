import { describe, expect, it } from 'vitest';

import { snapPositionToInterval } from './axisSnap';

// A linear axis with domain [lo, hi] mapped to pixel range [0, 100].
const axis = (lo: number, hi: number) => ({
    scale: { convert: (value: number) => ((value - lo) / (hi - lo)) * 100 },
    scaleInvert: (position: number) => lo + (position / 100) * (hi - lo),
    inRange: (position: number) => position >= 0 && position <= 100,
});

describe('snapPositionToInterval', () => {
    it('snaps to the nearest multiple of the interval', () => {
        expect(snapPositionToInterval(axis(100, 110), 33, 0.25)).toEqual({ value: 103.25, position: 32.5 });
    });

    it('uses the neighbouring multiple when the nearest one is outside the range', () => {
        expect(snapPositionToInterval(axis(100.1, 102.1), 1, 1).value).toBe(101);
    });

    it('returns the pointer value unsnapped when no multiple is within the range', () => {
        const { value, position } = snapPositionToInterval(axis(100.1, 100.2), 50, 1);
        expect(position).toBe(50);
        expect(value).toBeCloseTo(100.15);
    });
});
