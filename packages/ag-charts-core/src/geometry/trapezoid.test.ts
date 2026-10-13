import { describe, expect, test } from 'vitest';

import {
    type TrapezoidBounds,
    trapezoidBandRect,
    trapezoidBox,
    trapezoidExtentAcross,
    trapezoidOverlapsBox,
} from './trapezoid';

const vertical = (overrides: Partial<TrapezoidBounds> = {}): TrapezoidBounds => ({
    spanLo: 0,
    spanHi: 100,
    extentLo: 40,
    extentHi: 200,
    crossCentre: 50,
    vertical: true,
    ...overrides,
});

const horizontal = (overrides: Partial<TrapezoidBounds> = {}): TrapezoidBounds =>
    vertical({ vertical: false, ...overrides });

describe('trapezoidBox', () => {
    test('spans the span axis and the widest parallel edge', () => {
        expect(trapezoidBox(vertical())).toEqual({ x: -50, y: 0, width: 200, height: 100 });
        expect(trapezoidBox(horizontal())).toEqual({ x: 0, y: -50, width: 100, height: 200 });
    });

    test('is unaffected by which edge is the wider one', () => {
        expect(trapezoidBox(vertical({ extentLo: 200, extentHi: 40 }))).toEqual(trapezoidBox(vertical()));
    });
});

describe('trapezoidExtentAcross', () => {
    test('takes the narrowest cross-section the band covers', () => {
        // The vertical fixture widens from 40 to 200 over its span, so it is 104 wide at y = 40.
        expect(trapezoidExtentAcross(vertical(), 40, 60)).toBe(104);
        expect(trapezoidExtentAcross(vertical(), 60, 40)).toBe(104);
    });

    test('is the shape-wide minimum for a band covering the whole span', () => {
        expect(trapezoidExtentAcross(vertical(), 0, 100)).toBe(40);
    });

    test('measures only where the band and the shape overlap', () => {
        expect(trapezoidExtentAcross(vertical(), -50, 10)).toBe(40);
        expect(trapezoidExtentAcross(vertical(), 110, 120)).toBe(0);
    });

    test('offers more width to a short band than the whole shape allows', () => {
        const t = vertical({ extentLo: 40, extentHi: 60 });
        expect(trapezoidExtentAcross(t, 45, 55)).toBeGreaterThan(trapezoidExtentAcross(t, t.spanLo, t.spanHi));
    });
});

describe('trapezoidBandRect', () => {
    test('keeps the trapezoid span and narrows to the band width', () => {
        expect(trapezoidBandRect(vertical(), 40, 60)).toEqual({ x: -2, y: 0, width: 104, height: 100 });
    });

    test('stays centred on a trapezoid that tapers to a point', () => {
        expect(trapezoidBandRect(vertical({ extentLo: 0, extentHi: 200 }), 40, 60)).toEqual({
            x: 10,
            y: 0,
            width: 80,
            height: 100,
        });
    });

    test('handles the horizontal orientation', () => {
        expect(trapezoidBandRect(horizontal(), 40, 60)).toEqual({ x: 0, y: -2, width: 100, height: 104 });
    });
});

describe('trapezoidOverlapsBox', () => {
    const t = vertical({ extentLo: 0, extentHi: 100 });

    test('rejects a box outside the span range', () => {
        expect(trapezoidOverlapsBox(t, { x: 0, y: -20, width: 100, height: 10 })).toBe(false);
        expect(trapezoidOverlapsBox(t, { x: 0, y: 110, width: 100, height: 10 })).toBe(false);
    });

    test('rejects a box beyond the taper at its own span position', () => {
        // At y = 20 the trapezoid is 20 wide, so it reaches x = 40..60 only.
        expect(trapezoidOverlapsBox(t, { x: 62, y: 10, width: 10, height: 10 })).toBe(false);
        // The same box lower down, where the shape has widened, does overlap.
        expect(trapezoidOverlapsBox(t, { x: 62, y: 80, width: 10, height: 10 })).toBe(true);
    });

    test('uses the widest covered cross-section', () => {
        expect(trapezoidOverlapsBox(t, { x: 55, y: 0, width: 2, height: 100 })).toBe(true);
    });

    test('treats touching edges as non-overlapping', () => {
        expect(trapezoidOverlapsBox(t, { x: 0, y: 100, width: 100, height: 10 })).toBe(false);
        expect(trapezoidOverlapsBox(t, { x: 100, y: 0, width: 10, height: 100 })).toBe(false);
    });

    test('handles the horizontal orientation', () => {
        const h = horizontal({ extentLo: 0, extentHi: 100 });
        expect(trapezoidOverlapsBox(h, { x: 10, y: 62, width: 10, height: 10 })).toBe(false);
        expect(trapezoidOverlapsBox(h, { x: 80, y: 62, width: 10, height: 10 })).toBe(true);
    });

    test('rejects everything when the trapezoid has no width', () => {
        expect(
            trapezoidOverlapsBox(vertical({ extentLo: 0, extentHi: 0 }), { x: 0, y: 0, width: 100, height: 100 })
        ).toBe(false);
    });
});
