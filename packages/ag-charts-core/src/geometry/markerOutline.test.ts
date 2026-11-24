import { beforeAll, describe, expect, it } from 'vitest';

import type { AgMarkerShape, AgMarkerShapeFn } from 'ag-charts-types';

import { getSharedMarkerPath } from '../chart/markerPathCache';
import { MARKER_SHAPES } from '../chart/markerShapes';
import { ExtendedPath2D } from '../scene/extendedPath2D';
import { seedRandom } from '../test/random';
import { stubPath2D } from '../test/stubPath2D';
import { drawnMarkerShapeAnalysis } from './markerLabelRect';
import { markerOutline, markerOutlineOverlapsRect, markerOutlineSpans, placeMarkerOutline } from './markerOutline';

beforeAll(stubPath2D);

const BUILT_IN_SHAPES = Object.keys(MARKER_SHAPES).filter((shape) => shape !== 'circle') as AgMarkerShape[];

/** Axis-aligned overlap of a unit-centred outline at `size` 10 with the box `[x0, x1] × [y0, y1]`. */
function overlapsBox(shape: AgMarkerShape, x0: number, y0: number, x1: number, y1: number) {
    const placed = placeMarkerOutline(markerOutline(shape, 10)!, 0, 0, 10);
    return markerOutlineOverlapsRect(placed, (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, 1, 0);
}

/** Even-odd containment of `(x, y)` in the interleaved polygon `xy`. */
function insidePolygon(xy: Float64Array, x: number, y: number) {
    let inside = false;
    const n = xy.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const [xi, yi, xj, yj] = [xy[2 * i], xy[2 * i + 1], xy[2 * j], xy[2 * j + 1]];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

function distanceToPolygon(xy: Float64Array, x: number, y: number) {
    let best = Infinity;
    const n = xy.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const [ax, ay, dx, dy] = [xy[2 * j], xy[2 * j + 1], xy[2 * i] - xy[2 * j], xy[2 * i + 1] - xy[2 * j + 1]];
        const t = Math.min(1, Math.max(0, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
        best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
    }
    return best;
}

describe('markerOutline', () => {
    it.each([undefined, 'circle', 'no-such-shape'])('leaves %s to the circle test', (shape) => {
        expect(markerOutline(shape as AgMarkerShape | undefined, 10)).toBeUndefined();
    });

    it.each(BUILT_IN_SHAPES)('gives %s an outline within its unit box, analysed once', (shape) => {
        const outline = markerOutline(shape, 1)!;
        expect(outline.scale.length).toBeGreaterThanOrEqual(6);
        expect(outline.minX).toBeGreaterThanOrEqual(-0.5 - 1e-4);
        expect(outline.maxX).toBeLessThanOrEqual(0.5 + 1e-4);
        expect(outline.minY).toBeGreaterThanOrEqual(-0.5 - 1e-4);
        expect(outline.maxY).toBeLessThanOrEqual(0.5 + 1e-4);
        expect(markerOutline(shape, 20)).toBe(outline);
    });

    it.each([
        ['heart', 30],
        ['pin', 26],
    ] as const)('traces the curves of a %s in at most %s edges', (shape, edges) => {
        expect(markerOutline(shape, 1)!.scale.length / 2).toBeLessThanOrEqual(edges);
    });

    it.each(['pin', 'heart'] as const)('keeps a %s outline within 0.005 of its size inside the drawn edge', (shape) => {
        const { scale } = markerOutline(shape, 1)!;
        const path = new ExtendedPath2D();
        MARKER_SHAPES[shape]({ path, x: 0, y: 0, size: 1, pixelRatio: 1 });
        let worst = 0;
        for (const ring of path.flatten(2000)) {
            for (const { x, y } of ring) {
                if (!insidePolygon(scale, x, y)) worst = Math.max(worst, distanceToPolygon(scale, x, y));
            }
        }
        expect(worst).toBeLessThanOrEqual(0.005);
    });

    it('bounds a custom shape by its path box at the size it is drawn', () => {
        const wide: AgMarkerShapeFn = ({ path, x, y, size }) => {
            path.moveTo(x - size, y - size / 4);
            path.lineTo(x + size, y - size / 4);
            path.lineTo(x, y + size / 4);
            path.closePath();
        };
        const outline = markerOutline(wide, 20)!;
        const bounds = [outline.minOffsetX, outline.minOffsetY, outline.maxOffsetX, outline.maxOffsetY];
        expect(bounds.map((b) => Number(b.toFixed(9)))).toEqual([-20, -5, 20, 5]);
        expect([outline.minX, outline.minY, outline.maxX, outline.maxY]).toEqual([0, 0, 0, 0]);
        expect(markerOutline(wide, 20)).toBe(outline);
    });

    it('keeps the fixed-width parts of a custom shape at their width at any size', () => {
        // A square drawn with a 4px border outside it: 9px from the centre at size 10, 54px at size 100.
        const bordered: AgMarkerShapeFn = ({ path, x, y, size }) => {
            const r = size / 2 + 4;
            path.rect(x - r, y - r, 2 * r, 2 * r);
        };
        const [outX, outY] = [
            { min: 0, max: 0 },
            { min: 0, max: 0 },
        ];
        for (const size of [10, 40, 100]) {
            markerOutlineSpans(
                outX,
                outY,
                placeMarkerOutline(markerOutline(bordered, size)!, 0, 0, size),
                -1,
                -1,
                1,
                1
            );
            expect(outX.max).toBeCloseTo(size / 2 + 4);
            expect(outY.max).toBeCloseTo(size / 2 + 4);
        }
    });

    it('bounds a custom shape as drawn at its size, not as linear in size', () => {
        // 40px wide at size 40, though 10px at size 10 and 40px at size 100 would make it 20px.
        const capped: AgMarkerShapeFn = ({ path, x, y, size }) => {
            const side = Math.min(size, 40);
            path.rect(x - side / 2, y - side / 2, side, side);
        };
        const placed = placeMarkerOutline(markerOutline(capped, 40)!, 0, 0, 40);
        expect(markerOutlineOverlapsRect(placed, 15, 0, 2, 2, 1, 0)).toBe(true);
    });

    it('keeps the circle test for a custom shape that draws nothing', () => {
        expect(markerOutline(() => {}, 10)).toBeUndefined();
    });
});

describe('custom shape analysis', () => {
    // A styler may return a fresh function per datum, which placement must not trace again beyond rendering.
    it('traces a custom shape once per size for rendering, its outline and its inside room', () => {
        let traces = 0;
        const kite: AgMarkerShapeFn = ({ path, x, y, size }) => {
            traces++;
            path.moveTo(x, y - size / 2);
            path.lineTo(x + size / 4, y);
            path.lineTo(x, y + size / 2);
            path.lineTo(x - size / 4, y);
            path.closePath();
        };
        getSharedMarkerPath(kite, 30, 2);
        const outline = markerOutline(kite, 30, 2);
        const analysis = drawnMarkerShapeAnalysis(kite, 30, 2);
        expect(outline).toBeDefined();
        expect(markerOutline(kite, 30, 2)).toBe(outline);
        expect(drawnMarkerShapeAnalysis(kite, 30, 2)).toBe(analysis);
        expect(traces).toBe(1);
        expect(markerOutline(kite, 40, 2)).not.toBe(outline);
        expect(traces).toBe(2);
    });
});

describe('markerOutlineOverlapsRect', () => {
    it.each([
        // A square fills its box corners, which a circle of the same size leaves empty.
        ['square', [3.6, 3.6, 8, 8], true],
        ['square', [5, -2, 8, 2], false],
        // A diamond leaves its box corners empty, which a circle of the same size fills.
        ['diamond', [3, 3, 8, 8], false],
        ['diamond', [2, 2, 8, 8], true],
        // A box wholly inside the outline overlaps it, though no edge crosses it.
        ['square', [-1, -1, 1, 1], true],
        // Boxes that only touch the outline do not overlap it.
        ['square', [5, -5, 8, 5], false],
        ['diamond', [2.5, 2.5, 8, 8], false],
        // Between the arms of a cross is empty.
        ['plus', [2.5, 2.5, 5, 5], false],
        ['plus', [1, 2.5, 5, 5], true],
    ] as const)('%s against %j overlaps: %s', (shape, [x0, y0, x1, y1], expected) => {
        expect(overlapsBox(shape, x0, y0, x1, y1)).toBe(expected);
    });

    it.each([Number.NaN, 0])('never overlaps a rectangle %s wide', (halfWidth) => {
        const square = placeMarkerOutline(markerOutline('square', 10)!, 0, 0, 10);
        expect(markerOutlineOverlapsRect(square, 0, 0, halfWidth, 1, 1, 0)).toBe(false);
    });

    it('tests a rotated rectangle in its own frame', () => {
        const outline = placeMarkerOutline(markerOutline('diamond', 10)!, 0, 0, 10);
        // A 2 × 20 bar at the diamond's edge crosses it upright and turned across it, but not laid along it.
        const cx = 4.5;
        const cy = 4.5;
        expect(markerOutlineOverlapsRect(outline, cx, cy, 1, 10, 1, 0)).toBe(true);
        const c = Math.SQRT1_2;
        expect(markerOutlineOverlapsRect(outline, cx, cy, 10, 1, c, -c)).toBe(false);
        expect(markerOutlineOverlapsRect(outline, cx, cy, 10, 1, c, c)).toBe(true);
    });
});

/** The interleaved polygon `xy` clipped to the half-plane `sign * (xy[axis] - at) <= 0`. */
function clipHalfPlane(xy: number[], axis: 0 | 1, at: number, sign: 1 | -1): number[] {
    const out: number[] = [];
    const n = xy.length / 2;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const a = sign * (xy[2 * i + axis] - at);
        const b = sign * (xy[2 * j + axis] - at);
        if (a <= 0) out.push(xy[2 * i], xy[2 * i + 1]);
        if ((a < 0 && b > 0) || (a > 0 && b < 0)) {
            const t = a / (a - b);
            out.push(xy[2 * i] + t * (xy[2 * j] - xy[2 * i]), xy[2 * i + 1] + t * (xy[2 * j + 1] - xy[2 * i + 1]));
        }
    }
    return out;
}

function clipToBox(xy: number[], x0: number, y0: number, x1: number, y1: number) {
    return clipHalfPlane(clipHalfPlane(clipHalfPlane(clipHalfPlane(xy, 0, x0, -1), 0, x1, 1), 1, y0, -1), 1, y1, 1);
}

function polygonArea(xy: number[]) {
    let twice = 0;
    for (let i = 0, n = xy.length / 2; i < n; i++) {
        const j = (i + 1) % n;
        twice += xy[2 * i] * xy[2 * j + 1] - xy[2 * j] * xy[2 * i + 1];
    }
    return Math.abs(twice / 2);
}

/** The outline at `size` on `(cx, cy)`, taken into the frame of a rectangle on `(rx, ry)` turned by `(cos, sin)`. */
function outlineInFrame(shape: AgMarkerShape, cx: number, cy: number, size: number, rx = 0, ry = 0, cos = 1, sin = 0) {
    const { scale, offset } = markerOutline(shape, size)!;
    const xy: number[] = [];
    for (let i = 0; i < scale.length; i += 2) {
        const dx = cx + scale[i] * size + offset[i] - rx;
        const dy = cy + scale[i + 1] * size + offset[i + 1] - ry;
        xy.push(cos * dx + sin * dy, cos * dy - sin * dx);
    }
    return xy;
}

const triangleFn: AgMarkerShapeFn = ({ path, x, y, size }) => {
    path.moveTo(x - size / 2, y + size / 2);
    path.lineTo(x + size / 2, y + size / 2);
    path.lineTo(x, y - size / 2);
    path.closePath();
};
const ORACLE_SHAPES: AgMarkerShape[] = [...BUILT_IN_SHAPES, triangleFn];

describe('markerOutline shortcuts against a clipping oracle', () => {
    it('leaves an hourglass, pinched at its centre, without an inner box', () => {
        const { innerMinX, innerMaxX } = markerOutline('hourglass', 1)!;
        expect(innerMaxX).toBeLessThan(innerMinX);
    });

    it.each(BUILT_IN_SHAPES.filter((shape) => shape !== 'hourglass'))(
        'keeps every edge of %s clear of its inner box',
        (shape) => {
            const { innerMinX, innerMinY, innerMaxX, innerMaxY } = markerOutline(shape, 1)!;
            expect(innerMaxX).toBeGreaterThan(innerMinX);
            expect(innerMaxY).toBeGreaterThan(innerMinY);
            const [x0, y0, x1, y1] = [innerMinX - 0.01, innerMinY - 0.01, innerMaxX + 0.01, innerMaxY + 0.01];
            const inside = polygonArea(clipToBox(outlineInFrame(shape, 0, 0, 1), x0, y0, x1, y1));
            expect(inside).toBeCloseTo((x1 - x0) * (y1 - y0), 12);
        }
    );

    it.each(ORACLE_SHAPES)('overlaps a rectangle exactly where %s shares area with it', (shape) => {
        const random = seedRandom(18765);
        const size = 20;
        const outline = placeMarkerOutline(markerOutline(shape, size)!, 0, 0, size);
        // Margins either side of the verdict, so only rectangles touching the outline go unjudged; clipping a
        // concave outline leaves zero-width slivers, whose rounded area stays far below `minArea`.
        const eps = 1e-7;
        const minArea = 1e-10;
        let judged = 0;
        for (let i = 0; i < 4000; i++) {
            const turned = i % 4 === 0;
            const angle = turned ? random() * Math.PI : 0;
            const [cos, sin] = turned ? [Math.cos(angle), Math.sin(angle)] : [1, 0];
            const rx = (random() * 1.6 - 0.8) * size;
            const ry = (random() * 1.6 - 0.8) * size;
            const halfWidth = size * 10 ** (random() * 2.5 - 3);
            const halfHeight = size * 10 ** (random() * 2.5 - 3);
            const xy = outlineInFrame(shape, 0, 0, size, rx, ry, cos, sin);
            const [w, h] = [halfWidth - eps, halfHeight - eps];
            const [W, H] = [halfWidth + eps, halfHeight + eps];
            const robustlyIn = polygonArea(clipToBox(xy, -w, -h, w, h)) > minArea;
            const robustlyOut = polygonArea(clipToBox(xy, -W, -H, W, H)) < minArea;
            if (!robustlyIn && !robustlyOut) continue;
            judged++;
            expect(markerOutlineOverlapsRect(outline, rx, ry, halfWidth, halfHeight, cos, sin)).toBe(robustlyIn);
        }
        expect(judged).toBeGreaterThan(3900);
    });

    it.each(ORACLE_SHAPES)('measures %s across a band as its clipped outline does', (shape) => {
        const random = seedRandom(18766);
        const outline = placeMarkerOutline(markerOutline(shape, 20)!, 3, -2, 20);
        const xy = outlineInFrame(shape, 3, -2, 20);
        const spans = [
            { min: 0, max: 0 },
            { min: 0, max: 0 },
        ];
        for (let i = 0; i < 2000; i++) {
            // A box across the outline: its rows band the horizontal extent, its columns the vertical.
            const [left, top] = [(random() * 1.4 - 0.7) * 20, (random() * 1.4 - 0.7) * 20];
            const [right, bottom] = [left + random() * 10, top + random() * 10];
            markerOutlineSpans(spans[0], spans[1], outline, left, top, right, bottom);
            for (const axis of [0, 1] as const) {
                const [lo, hi] = axis === 0 ? [top, bottom] : [left, right];
                const band = clipHalfPlane(clipHalfPlane(xy, (1 - axis) as 0 | 1, lo, -1), (1 - axis) as 0 | 1, hi, 1);
                const along = band.filter((_, k) => k % 2 === axis);
                const { min, max } = spans[axis];
                if (along.length === 0) {
                    expect(min).toBe(Infinity);
                    continue;
                }
                expect(min).toBeCloseTo(Math.min(...along), 9);
                expect(max).toBeCloseTo(Math.max(...along), 9);
            }
        }
    });
});

describe('markerOutlineSpans', () => {
    it('measures the outline across a band, not its bounding box', () => {
        const [outX, outY] = [
            { min: 0, max: 0 },
            { min: 0, max: 0 },
        ];
        // A diamond of size 10 is 5 wide at y = 2.5, and 5 tall at x = 2.5.
        const diamond = placeMarkerOutline(markerOutline('diamond', 10)!, 0, 0, 10);
        markerOutlineSpans(outX, outY, diamond, 2.5, 2.5, 10, 10);
        expect(outX.min).toBeCloseTo(-2.5);
        expect(outX.max).toBeCloseTo(2.5);
        expect(outY.min).toBeCloseTo(-2.5);
        expect(outY.max).toBeCloseTo(2.5);
        markerOutlineSpans(outX, outY, placeMarkerOutline(markerOutline('square', 10)!, 100, 50, 10), 0, 52, 1, 60);
        expect([outX.min, outX.max]).toEqual([95, 105]);
        expect(outY.min).toBe(Infinity);
    });
});
