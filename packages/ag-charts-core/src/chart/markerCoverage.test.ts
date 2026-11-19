import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgMarkerShapeFn } from 'ag-charts-types';

import { Color } from '../format/color';
import { ExtendedPath2D } from '../scene/extendedPath2D';
import { stubPath2D } from '../test/coreAccessors';
import {
    EVERY_MARKER_FILL_PAINTED,
    MarkerFillMemo,
    MarkerShapeCoverage,
    applyStyledMarkerCoverage,
    markerUnitOutline,
} from './markerCoverage';
import { getSharedMarkerPath } from './markerPathCache';
import { MARKER_SHAPES } from './markerShapes';

const gradient = (...colors: string[]) => ({ type: 'gradient', colorStops: colors.map((color) => ({ color })) });

// More fills than any data in these cases can need.
const OUTGROWING = 201;

const distinctFills = (count: number, from = 0) => Array.from({ length: count }, (_, i) => `rgb(${from + i}, 0, 0)`);

describe('MarkerFillMemo', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.each([
        { case: 'an opaque colour', fill: 'red', painted: true },
        { case: 'a colour padded with spaces', fill: ' red ', painted: true },
        { case: 'a colour of zero alpha', fill: 'rgba(255, 0, 0, 0)', painted: false },
        { case: 'an unparseable colour', fill: 'not-a-colour', painted: false },
        { case: 'no fill', fill: undefined, painted: false },
        { case: 'a pattern without a background', fill: { type: 'pattern', pattern: 'stars' }, painted: false },
        {
            case: 'a pattern on an opaque background',
            fill: { type: 'pattern', pattern: 'stars', backgroundFill: 'white' },
            painted: true,
        },
        {
            case: 'a pattern on a transparent background',
            fill: { type: 'pattern', pattern: 'stars', backgroundFill: 'white', backgroundFillOpacity: 0 },
            painted: false,
        },
        {
            case: 'a pattern too small to tile, filled opaque',
            fill: { type: 'pattern', pattern: 'stars', width: 1, scale: 0.5, fill: 'red' },
            painted: true,
        },
        {
            case: 'a pattern too small to tile, filled transparent',
            fill: { type: 'pattern', pattern: 'stars', width: 1, scale: 0.5, fill: 'red', fillOpacity: 0 },
            painted: false,
        },
        { case: 'an image on its default background', fill: { type: 'image', url: 'a.png' }, painted: true },
        {
            case: 'an image on a transparent background',
            fill: { type: 'image', url: 'a.png', backgroundFillOpacity: 0 },
            painted: false,
        },
        { case: 'a gradient of opaque stops', fill: gradient('red', 'blue'), painted: true },
        { case: 'a gradient with a transparent stop', fill: gradient('red', 'transparent'), painted: false },
        { case: 'a gradient without stops, drawn black', fill: gradient(), painted: true },
    ])('knows a fill of $case paints the marker: $painted', ({ fill, painted }) => {
        expect(new MarkerFillMemo().isPainted(fill)).toBe(painted);
    });

    it('parses each distinct fill once, however many it holds', () => {
        const memo = new MarkerFillMemo();
        const parse = vi.spyOn(Color, 'validColorString');
        const fills = distinctFills(100);
        for (const fill of fills) memo.isPainted(fill);
        expect(parse).toHaveBeenCalledTimes(100);
        for (const fill of fills) memo.isPainted(fill);
        expect(parse).toHaveBeenCalledTimes(100);
    });

    it('parses no fill still in use again once the data shrinks', () => {
        const memo = new MarkerFillMemo();
        const fills = distinctFills(100);
        for (const fill of fills) memo.isPainted(fill);

        memo.bound(1);
        const parse = vi.spyOn(Color, 'validColorString');
        for (const fill of fills) memo.isPainted(fill);
        expect(parse).not.toHaveBeenCalled();
    });

    // A bound lets go of a fill only after the memo outgrew the data with that fill unused since the bound before.
    it.each([
        { case: 'as many as twice the data', held: 100, datumCount: 50, forgotten: false },
        { case: 'more than twice the data', held: 101, datumCount: 50, forgotten: true },
        { case: 'as many as its floor, however little the data', held: 64, datumCount: 1, forgotten: false },
        { case: 'more than its floor', held: 65, datumCount: 1, forgotten: true },
    ])('forgets unused fills once it held $case: $forgotten', ({ held, datumCount, forgotten }) => {
        const memo = new MarkerFillMemo();
        const unused = distinctFills(held);
        for (const fill of unused) memo.isPainted(fill);
        memo.bound(datumCount);
        for (const fill of distinctFills(OUTGROWING, held)) memo.isPainted(fill);
        memo.bound(datumCount);

        const parse = vi.spyOn(Color, 'validColorString');
        for (const fill of unused) memo.isPainted(fill);
        expect(parse).toHaveBeenCalledTimes(forgotten ? held : 0);
    });

    it('drops the fills of rolled-off data, so it holds only as many as the data needs', () => {
        const memo = new MarkerFillMemo();
        for (let window = 0; window < 10; window++) {
            memo.bound(50);
            for (const fill of distinctFills(50, window * 50)) memo.isPainted(fill);
        }
        const parse = vi.spyOn(Color, 'validColorString');
        memo.bound(50);
        for (const fill of distinctFills(50, 0)) memo.isPainted(fill);
        expect(parse).toHaveBeenCalledTimes(50);
    });
});

describe('markerUnitOutline', () => {
    stubPath2D();

    type Polygons = readonly (readonly { x: number; y: number }[])[];

    /** The farthest any vertex of `from` lies from the edges of `to`. */
    const farthestVertex = (from: Polygons, to: Polygons) => {
        let farthest = 0;
        for (const polygon of from) {
            for (const p of polygon) {
                let nearest = Infinity;
                for (const edges of to) {
                    for (let i = 0, j = edges.length - 1; i < edges.length; j = i++) {
                        const a = edges[j];
                        const b = edges[i];
                        const dx = b.x - a.x;
                        const dy = b.y - a.y;
                        const lengthSq = dx * dx + dy * dy;
                        const along = lengthSq === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;
                        const t = Math.max(0, Math.min(1, along));
                        nearest = Math.min(nearest, Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy));
                    }
                }
                farthest = Math.max(farthest, nearest);
            }
        }
        return farthest;
    };

    const builtIns = (Object.keys(MARKER_SHAPES) as (keyof typeof MARKER_SHAPES)[]).filter((s) => s !== 'circle');

    it.each(builtIns.flatMap((shape) => [7, 40].map((size) => ({ shape, size }))))(
        'scales the $shape outline to the path drawn at size $size',
        ({ shape, size }) => {
            const unit = markerUnitOutline(shape);
            expect(unit?.polygons.length).toBeGreaterThan(0);
            const scaled = unit!.polygons.map((polygon) => polygon.map(({ x, y }) => ({ x: x * size, y: y * size })));
            const drawn = getSharedMarkerPath(shape, size).flatten(16, unit!.tolerance * size);
            const tolerance = unit!.tolerance * size;
            expect(farthestVertex(scaled, drawn)).toBeLessThanOrEqual(tolerance);
            expect(farthestVertex(drawn, scaled)).toBeLessThanOrEqual(tolerance);
        }
    );
});

describe('MarkerShapeCoverage', () => {
    stubPath2D();

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const square: AgMarkerShapeFn = ({ path, size }) => path.rect(-size / 2, -size / 2, size, size);
    const disc: AgMarkerShapeFn = ({ path, size }) => path.arc(0, 0, size / 2, 0, 2 * Math.PI);

    /** Counts custom paths measured; only that measure flattens to a tolerance. */
    const countMeasures = () => {
        const flatten = vi.spyOn(ExtendedPath2D.prototype, 'flatten');
        return () => flatten.mock.calls.filter(([, tolerance]) => tolerance != null).length;
    };

    it('measures the cover rectangle only once one is asked for, and once for each size', () => {
        const shapes = new MarkerShapeCoverage();
        const measures = countMeasures();
        shapes.of(square, 10, 1, true);
        expect(measures()).toBe(1);
        expect(shapes.coverRectOf(square, 10, 1)).toBeDefined();
        expect(shapes.coverRectOf(square, 10, 1)).toBeDefined();
        shapes.of(square, 10, 1, true);
        expect(measures()).toBe(2);
    });

    it('measures each shape once per size, however often it is asked for', () => {
        const shapes = new MarkerShapeCoverage();
        const measures = countMeasures();
        const ask = () => {
            for (const shape of [square, disc]) {
                for (const size of [10, 20]) shapes.of(shape, size, 1, true);
            }
        };
        ask();
        ask();
        expect(measures()).toBe(4);
    });

    it('measures again at a different pixel ratio', () => {
        const shapes = new MarkerShapeCoverage();
        const measures = countMeasures();
        shapes.of(square, 10, 1, true);
        shapes.of(square, 10, 2, true);
        shapes.of(square, 10, 2, true);
        expect(measures()).toBe(2);
    });

    it('measures the cover only once one is asked for', () => {
        const shapes = new MarkerShapeCoverage();
        const measures = countMeasures();
        expect(shapes.of(square, 10, 1, false).cover).toBe(0);
        expect(shapes.of(square, 10, 1, true).cover).toBeGreaterThan(0);
        shapes.of(square, 10, 1, false);
        expect(measures()).toBe(2);
    });

    it.each([
        { case: 'as many as twice the data', held: 100, datumCount: 50, forgotten: false },
        { case: 'more than twice the data', held: 101, datumCount: 50, forgotten: true },
    ])('forgets unused sizes once it held $case: $forgotten', ({ held, datumCount, forgotten }) => {
        const shapes = new MarkerShapeCoverage();
        const sizes = (count: number, from = 1) => Array.from({ length: count }, (_, i) => from + i);
        for (const size of sizes(held)) shapes.of(square, size, 1, true);
        shapes.bound(datumCount);
        for (const size of sizes(OUTGROWING, 1000)) shapes.of(square, size, 1, true);
        shapes.bound(datumCount);

        const measures = countMeasures();
        for (const size of sizes(held)) shapes.of(square, size, 1, true);
        expect(measures()).toBe(forgotten ? held : 0);
    });

    describe('what a custom path covers and reaches', () => {
        const SIZE = 100;
        const star =
            (points: number, step: number): AgMarkerShapeFn =>
            ({ path }) => {
                for (let i = 0; i < points; i++) {
                    const angle = -Math.PI / 2 + (i * step * 2 * Math.PI) / points;
                    const x = 50 * Math.cos(angle);
                    const y = 50 * Math.sin(angle);
                    if (i === 0) path.moveTo(x, y);
                    else path.lineTo(x, y);
                }
                path.closePath();
            };
        const ring: AgMarkerShapeFn = ({ path }) => {
            path.arc(0, 0, 50, 0, 2 * Math.PI);
            path.closePath();
            path.moveTo(25, 0);
            path.arc(0, 0, 25, 0, 2 * Math.PI, true);
            path.closePath();
        };
        const cShape: AgMarkerShapeFn = ({ path }) => {
            path.moveTo(-50, -50);
            path.lineTo(50, -50);
            path.lineTo(50, -25);
            path.lineTo(-25, -25);
            path.lineTo(-25, 25);
            path.lineTo(50, 25);
            path.lineTo(50, 50);
            path.lineTo(-50, 50);
            path.closePath();
        };
        const slit: AgMarkerShapeFn = ({ path }) => {
            path.rect(-50, -50, 100, 100);
            path.rect(-1, -50, 2, 100);
        };
        // Narrower than the gap between grid samples, which fall at x = 0 and about 3.
        const hairline: AgMarkerShapeFn = ({ path }) => {
            path.rect(-50, -50, 100, 100);
            path.rect(1, -50, 0.4, 100);
        };
        const offCentre: AgMarkerShapeFn = ({ path, size }) => path.rect(size, size, size, size);
        const empty: AgMarkerShapeFn = () => {};
        const measure = (shape: AgMarkerShapeFn) => new MarkerShapeCoverage().of(shape, SIZE, 1, true);
        const measureRect = (shape: AgMarkerShapeFn) => new MarkerShapeCoverage().coverRectOf(shape, SIZE, 1);

        it.each([
            { case: 'a ring, whose hole holds the centre', shape: ring, cover: 0 },
            { case: 'a C, open at the centre', shape: cShape, cover: 0 },
            { case: 'a square slit through the centre', shape: slit, cover: 0 },
            { case: 'a pentagram, its centre inside two of its loops', shape: star(5, 2), cover: 0 },
            // Straight edges flatten exactly, so only the tolerance is conceded from the inradius.
            {
                case: 'an open triangle, which the fill closes',
                shape: star(3, 1),
                cover: 25 - 50 * Math.sqrt(3) * 0.005,
            },
            { case: 'a square off the centre', shape: offCentre, cover: 0 },
            { case: 'an empty path', shape: empty, cover: 0 },
        ])('measures the cover about the centre of $case', ({ shape, cover }) => {
            expect(measure(shape).cover).toBeCloseTo(cover, 6);
        });

        it.each([
            {
                case: 'within the band of a ring',
                shape: ring,
                within: (x: number, y: number) => Math.hypot(x, y) >= 25 && Math.hypot(x, y) <= 50,
            },
            { case: 'clear of a slit through the centre', shape: slit, within: (x: number) => Math.abs(x) >= 1 },
        ])('finds a rectangle $case', ({ shape, within }) => {
            const rect = measureRect(shape);
            expect(rect).toBeDefined();
            const { width = 0, height = 0, cx = 0, cy = 0 } = rect ?? {};
            const corners = [-1, 1].flatMap((sx) =>
                [-1, 1].map((sy) => [(cx + (sx * width) / 2) * SIZE, (cy + (sy * height) / 2) * SIZE])
            );
            expect(corners.every(([x, y]) => within(x, y))).toBe(true);
        });

        it('finds no rectangle where a slit the grid steps over would cross it', () => {
            expect(measureRect(hairline)).toBeUndefined();
        });

        it.each([
            {
                case: 'a square off the centre, to its farthest corner',
                shape: offCentre,
                reach: 200 * Math.SQRT2 + 0.5,
            },
            { case: 'an empty path', shape: empty, reach: 0 },
        ])('measures the reach of $case', ({ shape, reach }) => {
            expect(measure(shape).reach).toBeCloseTo(reach, 6);
        });

        // A sliver whose tip turns sharper than the miter limit allows, its base corners near right angles.
        const sliver: AgMarkerShapeFn = ({ path }) => {
            path.moveTo(0, -50);
            path.lineTo(2, 50);
            path.lineTo(-2, 50);
            path.closePath();
        };

        it.each([
            { case: 'a square, at its right-angled corners', shape: offCentre, miter: Math.SQRT2 },
            { case: 'a sliver, at its base, its tip bevelling', shape: sliver, miter: 1.428568514 },
            { case: 'an empty path', shape: empty, miter: 1 },
        ])('measures the sharpest join of $case', ({ shape, miter }) => {
            expect(measure(shape).miter).toBeCloseTo(miter, 6);
        });

        it('reaches a stroke past a custom path by its sharpest join, not the miter limit', () => {
            const datum: { markerReach?: number } = {};
            const shapes = new MarkerShapeCoverage();
            const inputs = {
                castsShadow: false,
                fills: EVERY_MARKER_FILL_PAINTED,
                shapes,
                pixelRatio: 1,
                inside: false,
            };
            applyStyledMarkerCoverage(datum, { shape: offCentre, size: SIZE, stroke: 'black', strokeWidth: 2 }, inputs);
            expect(datum.markerReach).toBeCloseTo(200 * Math.SQRT2 + 0.5 + Math.SQRT2, 6);
        });
    });
});
