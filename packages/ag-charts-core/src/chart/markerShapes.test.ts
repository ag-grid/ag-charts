import { describe, expect, it } from 'vitest';

import type { AgPath } from 'ag-charts-types';

import { MARKER_SHAPES, MARKER_SHAPE_GEOMETRY } from './markerShapes';

type Vertex = readonly [number, number];

const SIZE = 100;
const CURVE_STEPS = 400;
// Flattening a curve into CURVE_STEPS chords moves it by at most r(1 - cos(pi / CURVE_STEPS)), about 3e-5 r.
const FLATTENING = 1e-4;
const MITER_LIMIT = 10;

/** The outline a shape function draws at the origin, curves flattened finely enough to read corners from. */
function outline(shape: keyof typeof MARKER_SHAPES): Vertex[] {
    const points: Vertex[] = [];
    const last = () => points.at(-1) ?? [0, 0];
    const path: AgPath = {
        moveTo: (x, y) => points.push([x, y]),
        lineTo: (x, y) => points.push([x, y]),
        rect: () => {
            throw new Error('unexpected rect');
        },
        roundRect: () => {
            throw new Error('unexpected roundRect');
        },
        arc: (cx, cy, r, start, end, counterClockwise = false) => {
            let span = end - start;
            if (!counterClockwise && span < 0) span += 2 * Math.PI;
            if (counterClockwise && span > 0) span -= 2 * Math.PI;
            for (let i = 0; i <= CURVE_STEPS; i++) {
                const a = start + (span * i) / CURVE_STEPS;
                points.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
            }
        },
        cubicCurveTo: (x1, y1, x2, y2, x, y) => {
            const [x0, y0] = last();
            for (let i = 1; i <= CURVE_STEPS; i++) {
                const t = i / CURVE_STEPS;
                const m = 1 - t;
                points.push([
                    m * m * m * x0 + 3 * m * m * t * x1 + 3 * m * t * t * x2 + t * t * t * x,
                    m * m * m * y0 + 3 * m * m * t * y1 + 3 * m * t * t * y2 + t * t * t * y,
                ]);
            }
        },
        closePath: () => {},
        clear: () => {
            points.length = 0;
        },
    };
    MARKER_SHAPES[shape]({ path, x: 0, y: 0, size: SIZE, pixelRatio: 1 });
    const deduped = points.filter(
        (p, i) => i === 0 || Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) > 1e-9
    );
    if (Math.hypot(deduped[0][0] - deduped.at(-1)![0], deduped[0][1] - deduped.at(-1)![1]) < 1e-9) deduped.pop();
    return deduped;
}

function edges(poly: Vertex[]) {
    return poly.map((p, i) => [p, poly[(i + 1) % poly.length]] as const);
}

/** Non-zero winding, the canvas default fill rule. */
function insideFill(poly: Vertex[], x: number, y: number) {
    let winding = 0;
    for (const [[ax, ay], [bx, by]] of edges(poly)) {
        const side = (bx - ax) * (y - ay) - (x - ax) * (by - ay);
        if (ay <= y && by > y && side > 0) winding++;
        else if (ay > y && by <= y && side < 0) winding--;
    }
    return winding !== 0;
}

function distanceToSegment(x: number, y: number, [ax, ay]: Vertex, [bx, by]: Vertex) {
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared === 0 ? 0 : Math.min(1, Math.max(0, ((x - ax) * dx + (y - ay) * dy) / lengthSquared));
    return Math.hypot(x - ax - t * dx, y - ay - t * dy);
}

/** Radius of the largest centred circle the fill holds: the nearest outline point, or 0 when the centre is unfilled. */
function inscribedRadius(poly: Vertex[]) {
    if (!insideFill(poly, 0, 0)) return 0;
    return Math.min(...edges(poly).map(([a, b]) => distanceToSegment(0, 0, a, b)));
}

/** Half-strokes a miter join reaches past the outline at its sharpest outward corner, bevelling past the limit. */
function worstMiter(poly: Vertex[]) {
    const orientation = Math.sign(edges(poly).reduce((area, [[ax, ay], [bx, by]]) => area + ax * by - ay * bx, 0));
    let worst = 1;
    for (const [i, q] of poly.entries()) {
        const p = poly[(i - 1 + poly.length) % poly.length];
        const r = poly[(i + 1) % poly.length];
        const ux = q[0] - p[0];
        const uy = q[1] - p[1];
        const vx = r[0] - q[0];
        const vy = r[1] - q[1];
        const turn = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
        if (Math.sign(turn) !== orientation) continue;
        const miter = 1 / Math.sin((Math.PI - Math.abs(turn)) / 2);
        worst = Math.max(worst, miter <= MITER_LIMIT ? miter : 1);
    }
    return worst;
}

describe('MARKER_SHAPE_GEOMETRY', () => {
    const shapes = Object.keys(MARKER_SHAPES) as (keyof typeof MARKER_SHAPES)[];

    it('covers every built-in shape', () => {
        expect(new Set(Object.keys(MARKER_SHAPE_GEOMETRY))).toEqual(new Set(shapes));
    });

    it.each(shapes)('%s: the fill holds the inscribed circle, and closely', (shape) => {
        const actual = inscribedRadius(outline(shape)) / SIZE;
        expect(MARKER_SHAPE_GEOMETRY[shape].inR).toBeLessThanOrEqual(actual + FLATTENING);
        expect(MARKER_SHAPE_GEOMETRY[shape].inR).toBeGreaterThan(actual - 0.01);
    });

    it.each(shapes)('%s: the circumscribed circle holds every outline point, and closely', (shape) => {
        const actual = Math.max(...outline(shape).map(([x, y]) => Math.hypot(x, y))) / SIZE;
        expect(MARKER_SHAPE_GEOMETRY[shape].circumR).toBeGreaterThanOrEqual(actual - FLATTENING);
        expect(MARKER_SHAPE_GEOMETRY[shape].circumR).toBeLessThan(actual + 0.01);
    });

    it.each(shapes)('%s: the miter factor bounds the stroke at the sharpest outward corner, and closely', (shape) => {
        const actual = worstMiter(outline(shape));
        expect(MARKER_SHAPE_GEOMETRY[shape].miter).toBeGreaterThanOrEqual(actual - FLATTENING);
        expect(MARKER_SHAPE_GEOMETRY[shape].miter).toBeLessThan(actual + 0.02);
    });
});
