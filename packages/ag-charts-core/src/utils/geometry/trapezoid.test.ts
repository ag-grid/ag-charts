import { describe, expect, test } from 'vitest';

import { type TrapezoidBounds, trapezoidBox, trapezoidInscribedRect, trapezoidOverlapsBox } from './trapezoid';

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

describe('trapezoidInscribedRect', () => {
    test('takes the interior optimum when one edge is more than twice the other', () => {
        // eMax / (2 * delta) = 200 / 320 of the span, anchored on the wide edge, at eMax / 2 wide.
        expect(trapezoidInscribedRect(vertical())).toEqual({ x: 0, y: 37.5, width: 100, height: 62.5 });
    });

    test('mirrors the optimum when the wide edge is at the low end', () => {
        expect(trapezoidInscribedRect(vertical({ extentLo: 200, extentHi: 40 }))).toEqual({
            x: 0,
            y: 0,
            width: 100,
            height: 62.5,
        });
    });

    test('maximises area against a dense scan of candidate rectangles', () => {
        const t = vertical();
        const { width, height } = trapezoidInscribedRect(t);
        const delta = t.extentHi - t.extentLo;
        let best = 0;
        for (let i = 0; i <= 1000; i++) {
            const u0 = i / 1000;
            best = Math.max(best, (t.spanHi - t.spanLo) * (1 - u0) * (t.extentLo + delta * u0));
        }
        expect(width * height).toBeGreaterThanOrEqual(best - 1e-6);
    });

    test('takes the full span at the narrow width when the taper is shallow', () => {
        expect(trapezoidInscribedRect(vertical({ extentLo: 120, extentHi: 200 }))).toEqual({
            x: -10,
            y: 0,
            width: 120,
            height: 100,
        });
    });

    test('returns the whole rectangle when both edges are equal', () => {
        expect(trapezoidInscribedRect(vertical({ extentLo: 80, extentHi: 80 }))).toEqual({
            x: 10,
            y: 0,
            width: 80,
            height: 100,
        });
    });

    test('handles a degenerate triangle', () => {
        expect(trapezoidInscribedRect(vertical({ extentLo: 0 }))).toEqual({ x: 0, y: 50, width: 100, height: 50 });
    });

    test('returns a zero-size rectangle for a degenerate trapezoid', () => {
        expect(trapezoidInscribedRect(vertical({ spanHi: 0 }))).toEqual({ x: 50, y: 0, width: 0, height: 0 });
        expect(trapezoidInscribedRect(vertical({ extentLo: 0, extentHi: 0 }))).toEqual({
            x: 50,
            y: 50,
            width: 0,
            height: 0,
        });
    });

    test('lies inside the trapezoid on the transposed axis too', () => {
        expect(trapezoidInscribedRect(horizontal())).toEqual({ x: 37.5, y: 0, width: 62.5, height: 100 });
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
