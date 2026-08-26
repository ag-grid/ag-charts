import { describe, expect, test, vi } from 'vitest';

import {
    type FitRegion,
    type FitRegionMask,
    insetFitRegion,
    maskFitRegion,
    probedFitRegion,
    regionWidthAt,
    trapezoidFitRegion,
} from './fitRegion';
import type { TrapezoidBounds } from './trapezoid';

// A stage narrowing towards its apex, anchored at its middle: 40px across at the apex end, 200px at the
// base, so a band's width depends only on how far up the stage it sits.
const stage = (overrides: Partial<TrapezoidBounds> = {}): TrapezoidBounds => ({
    spanLo: 0,
    spanHi: 100,
    extentLo: 40,
    extentHi: 200,
    crossCentre: 0,
    vertical: true,
    ...overrides,
});

const inCircle = (radius: number) => (x: number, y: number) => x * x + y * y <= radius * radius;

/** A region of constant width, split evenly about the anchor: the trivial case every other one relaxes. */
const rect = (width: number, height: number): FitRegion => {
    const half = height / 2;
    const span = [-width / 2, width / 2] as const;
    return { spanAt: () => span, extentAbove: half, extentBelow: half };
};

describe('a constant-width region', () => {
    test('answers the same width for every band, and splits its height about the anchor', () => {
        const region = rect(120, 40);
        expect(regionWidthAt(region, -20, 0)).toBe(120);
        expect(regionWidthAt(region, 0, 20)).toBe(120);
        expect(region.extentAbove).toBe(20);
        expect(region.extentBelow).toBe(20);
    });
});

describe('trapezoidFitRegion', () => {
    test('narrows a band towards the apex and keeps the whole stage in reach', () => {
        const region = trapezoidFitRegion(stage(), 50);
        expect(regionWidthAt(region, 0, 0)).toBe(120);
        expect(regionWidthAt(region, -50, -25)).toBe(40);
        expect(regionWidthAt(region, 25, 50)).toBe(160);
        expect(region.extentAbove).toBe(50);
        expect(region.extentBelow).toBe(50);
    });

    test('measures a band by its narrow end, which is the part the text has to pass through', () => {
        const region = trapezoidFitRegion(stage(), 50);
        expect(regionWidthAt(region, -50, 50)).toBe(regionWidthAt(region, -50, -50));
    });
});

describe('probedFitRegion', () => {
    test('gives a band the chord of its furthest edge, symmetric about the anchor', () => {
        const region = probedFitRegion({ x: 0, y: 0 }, inCircle(100), 200);
        // The band [0, 60] is bounded by the chord at y = 60, half of which is sqrt(100^2 - 60^2) = 80.
        expect(regionWidthAt(region, 0, 60)).toBeCloseTo(160, 3);
        expect(regionWidthAt(region, -60, 0)).toBeCloseTo(160, 3);
        expect(regionWidthAt(region, 0, 0)).toBeCloseTo(200, 3);
    });

    test('reports the vertical room either side of an off-centre anchor', () => {
        const region = probedFitRegion({ x: 0, y: 40 }, inCircle(100), 200);
        expect(region.extentAbove).toBeCloseTo(140, 3);
        expect(region.extentBelow).toBeCloseTo(60, 3);
    });

    test('bounds a band by the narrower side when the anchor is off-centre horizontally', () => {
        const region = probedFitRegion({ x: 60, y: 0 }, inCircle(100), 200);
        // 40px of room to the right, 160 to the left; only the smaller half is usable symmetrically.
        expect(regionWidthAt(region, 0, 0)).toBeCloseTo(80, 3);
    });

    test('answers a repeated band without probing the shape again', () => {
        const contains = vi.fn(inCircle(100));
        const region = probedFitRegion({ x: 0, y: 0 }, contains, 200);
        regionWidthAt(region, 0, 20);
        const probes = contains.mock.calls.length;
        expect(probes).toBeGreaterThan(0);
        regionWidthAt(region, 0, 20);
        expect(contains).toHaveBeenCalledTimes(probes);
        regionWidthAt(region, 0, 40);
        expect(contains.mock.calls.length).toBeGreaterThan(probes);
    });
});

describe('probedFitRegion over a shape with a hole', () => {
    // A donut wedge is an annulus sector, so it is not convex: a band straddling the centre line comes
    // closest to the hole between its edges, and testing only the edges lets the reach dip into it.
    const annulus = (inner: number, outer: number) => (x: number, y: number) => {
        const r2 = x * x + y * y;
        return r2 >= inner * inner && r2 <= outer * outer;
    };

    test('stops at the near edge of the hole rather than crossing to the band beyond it', () => {
        // A single-slice donut: the wedge spans the whole circle, so the ray leftward out of the ring
        // re-enters it past the hole. The room to the left of the anchor is 60 - 20, not the far rim.
        const region = probedFitRegion({ x: 60, y: 0 }, annulus(20, 100), 200);
        const [left] = region.spanAt(-7, 7);
        expect(left).toBeCloseTo(-40, 1);
    });

    test("does not reach into the hole between a band's edges", () => {
        const region = probedFitRegion({ x: 100, y: 0 }, annulus(50, 200), 200);
        // The band spans y in [-10, 10], so it is closest to the origin at y = 0: the reach inward has to
        // stop at the hole's radius, not at where the band's own edges clear it.
        const [left] = region.spanAt(-10, 10);
        expect(left).toBeCloseTo(-50, 1);
    });

    test('stops at the hole rather than reporting the room beyond it', () => {
        // Anchored on the left arm, the reach to the right leaves the annulus at the hole and enters it
        // again 100px further on: the room reported is the near arm's, not the far one's.
        const region = probedFitRegion({ x: -100, y: 0 }, annulus(50, 200), 400);
        const [, right] = region.spanAt(0, 0);
        expect(right).toBeCloseTo(50, 1);
    });
});

describe('insetFitRegion', () => {
    test('holds the text clear of the edge on both axes', () => {
        const region = insetFitRegion(rect(120, 40), 10, 5);
        expect(regionWidthAt(region, 0, 10)).toBe(100);
        expect(region.extentAbove).toBe(15);
        expect(region.extentBelow).toBe(15);
    });

    test('charges the vertical inset to the band, not just to the block', () => {
        const region = insetFitRegion(trapezoidFitRegion(stage(), 50), 0, 10);
        // The band [0, 10] is measured as [-10, 20], so it pays the narrower width 10px further up.
        expect(regionWidthAt(region, 0, 10)).toBe(regionWidthAt(trapezoidFitRegion(stage(), 50), -10, 20));
    });

    test('bottoms out at nothing rather than going negative', () => {
        const region = insetFitRegion(rect(10, 10), 20, 20);
        expect(regionWidthAt(region, 0, 1)).toBe(0);
        expect(region.extentAbove).toBe(0);
        expect(region.extentBelow).toBe(0);
    });
});

describe('maskFitRegion', () => {
    // Three rows of a shape pinching in the middle, sampled over a unit shape anchored at its centre.
    const mask: FitRegionMask = {
        rows: [
            [-0.5, 0.5],
            [-0.1, 0.1],
            [-0.5, 0.5],
        ],
        top: -0.5,
        rowHeight: 1 / 3,
    };
    const region = () => maskFitRegion(mask, 30, { x: 0, y: 0 });

    test('scales the unit mask onto the drawn shape', () => {
        expect(region().extentAbove).toBe(15);
        expect(region().extentBelow).toBe(15);
    });

    test('bounds a band by the narrowest row it covers', () => {
        // The middle row pinches to 0.1 of the shape either side of the anchor: 6px across at scale 30.
        expect(regionWidthAt(region(), -1, 1)).toBe(6);
    });

    test('treats a band as reaching the rows either side, since a row is sampled at its centre line', () => {
        // A band sitting inside the top row still pays the pinch below it: half a row of taper lies
        // between the sample and the row's edge, and nothing in the mask says where it starts.
        expect(regionWidthAt(region(), -12, -8)).toBe(6);
    });

    test('offers nothing where the shape has no row', () => {
        const empty = maskFitRegion({ rows: [undefined, [-0.5, 0.5]], top: -0.5, rowHeight: 0.5 }, 30, {
            x: 0,
            y: 0,
        });
        expect(regionWidthAt(empty, -15, -10)).toBe(0);
    });
});

describe('an asymmetric region', () => {
    test('reports each side of the anchor separately', () => {
        const region = probedFitRegion({ x: 60, y: 0 }, inCircle(100), 200);
        const [left, right] = region.spanAt(0, 0);
        expect(left).toBeCloseTo(-160, 3);
        expect(right).toBeCloseTo(40, 3);
    });

    test('offers a line centred off the anchor more room than one centred on it', () => {
        const region = probedFitRegion({ x: 60, y: 0 }, inCircle(100), 200);
        // Centred on the anchor a line can only use twice the 40px on its right; centred 60px to the left,
        // where the circle actually is, it can use the full 200px chord.
        expect(regionWidthAt(region, 0, 0)).toBeCloseTo(80, 3);
        expect(regionWidthAt(region, 0, 0, -60)).toBeCloseTo(200, 3);
    });

    test('keeps an inset inside the span rather than crossing it over', () => {
        const region = insetFitRegion(rect(10, 40), 20, 0);
        const [left, right] = region.spanAt(0, 0);
        expect(left).toBeLessThanOrEqual(right);
        expect(regionWidthAt(region, 0, 0)).toBe(0);
    });
});
