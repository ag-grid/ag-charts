import { describe, expect, it } from 'vitest';

import { gripScale } from './rangeHandle';

// The outer dots of the grip sit `sqrt(1.5² + 3²) + 1 ≈ 4.354` from the centre at a scale of 1.
const OUTER_DOT_REACH = Math.hypot(1.5, 3) + 1;

const scaleFor = (width: number, height: number, strokeWidth: number, cornerRadius: number) =>
    gripScale({ width, height, halfWidth: width / 2, halfHeight: height / 2, strokeWidth, cornerRadius });

describe('gripScale', () => {
    it('is exactly 1 at the theme default handle size', () => {
        expect(scaleFor(12, 24, 1, 4)).toBe(1);
    });

    it('follows the geometric mean of the width and height ratios while the grip fits', () => {
        expect(scaleFor(36, 36, 1, 4)).toBeCloseTo(Math.sqrt(3 * 1.5), 10);
        expect(scaleFor(8, 40, 1, 4)).toBeCloseTo(Math.sqrt((8 / 12) * (40 / 24)), 10);
    });

    it('keeps the outer dots inside the rectangular interior of a handle with square corners', () => {
        // A 36x36 handle with a 10px stroke has an interior half-size of 8, which limits the taller dots to 8 / 4.
        expect(scaleFor(36, 36, 10, 0)).toBeCloseTo(2, 3);
    });

    it('keeps the outer dots inside the rounded interior of a fully round handle', () => {
        // The same handle with fully round corners has a circular interior of radius 8.
        const scale = scaleFor(36, 36, 10, 18);
        expect(scale).toBeCloseTo(8 / OUTER_DOT_REACH, 3);
        expect(scale * OUTER_DOT_REACH).toBeLessThanOrEqual(8);
    });

    it('is 0 when the stroke leaves no interior', () => {
        expect(scaleFor(12, 24, 7, 4)).toBe(0);
    });
});
