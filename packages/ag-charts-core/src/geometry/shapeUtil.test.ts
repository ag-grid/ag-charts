import { describe, expect, it } from 'vitest';

import { getMinOuterRectSizeInto } from './shapeUtil';

describe('getMinOuterRectSizeInto', () => {
    it.each([0, 180, -180, 360])('keeps the size exactly at %s degrees', (rotation) => {
        const out = { width: 0, height: 0 };

        expect(getMinOuterRectSizeInto(out, rotation, 30, 20)).toBe(out);
        expect(out).toEqual({ width: 30, height: 20 });
    });

    it.each([90, 270, -90])('swaps the sides at %s degrees', (rotation) => {
        const { width, height } = getMinOuterRectSizeInto({ width: 0, height: 0 }, rotation, 30, 20);

        expect(width).toBeCloseTo(20);
        expect(height).toBeCloseTo(30);
    });

    it('bounds a rectangle turned 45 degrees by its diagonal reach', () => {
        const { width, height } = getMinOuterRectSizeInto({ width: 0, height: 0 }, 45, 30, 20);

        expect(width).toBeCloseTo(50 * Math.SQRT1_2);
        expect(height).toBeCloseTo(50 * Math.SQRT1_2);
    });
});
