import type { AgMarkerShape, AgMarkerShapeFn } from 'ag-charts-types';

import { memoiseByMarkerShape, traceMarkerShape } from '../chart/markerShapes';
import type { Point } from '../types/scene';

/** A marker shape's outline centred on the origin: at size `s` each vertex is `scale * s + offset`. */
export interface MarkerOutline {
    /** Vertex = scale * size + offset, so one outline serves every marker size. */
    readonly scale: Float64Array;
    readonly offset: Float64Array;
    /** Bounds the outline at any size without walking its vertices. */
    readonly minX: number;
    readonly minY: number;
    readonly maxX: number;
    readonly maxY: number;
    readonly minOffsetX: number;
    readonly minOffsetY: number;
    readonly maxOffsetX: number;
    readonly maxOffsetY: number;
    /** Clear of every edge, so overlapping it proves a hit without an edge test. */
    readonly innerMinX: number;
    readonly innerMinY: number;
    readonly innerMaxX: number;
    readonly innerMaxY: number;
}

// Curves are traced finely, then simplified to within this fraction of the marker size: 0.15px at 30px.
const OUTLINE_TOLERANCE = 0.005;
const CURVE_SAMPLES = 32;
// How far every edge stays from the inner box, as a fraction of the size: far beyond the rounding of the full test.
const INNER_MARGIN = 0.01;
// Two sizes fit a custom shape's bounds exactly when they are made of size-proportional and fixed-px parts.
const CUSTOM_SMALL_SIZE = 10;
const CUSTOM_LARGE_SIZE = 100;

const cachedOutline = memoiseByMarkerShape(
    (shape) => (typeof shape === 'string' ? builtInOutline(shape) : customOutline(shape)),
    [CUSTOM_SMALL_SIZE, CUSTOM_LARGE_SIZE]
);

/** The shape's outline, analysed once; `undefined` for a circle or unmeasurable shape, which collide as circles. */
export function markerOutline(shape: AgMarkerShape | undefined): MarkerOutline | undefined {
    return shape == null || shape === 'circle' ? undefined : cachedOutline(shape);
}

function builtInOutline(shape: AgMarkerShape): MarkerOutline | undefined {
    const rings = traceMarkerShape(shape, 1).flatten(CURVE_SAMPLES);
    if (rings.length !== 1) return undefined;
    const ring = rings[0];
    const last = ring.at(-1);
    if (last != null && ring.length > 1 && last.x === ring[0].x && last.y === ring[0].y) ring.pop();
    const kept = simplifyRing(ring, OUTLINE_TOLERANCE);
    if (kept.length < 3) return undefined;
    const scale = new Float64Array(kept.length * 2);
    for (let i = 0; i < kept.length; i++) {
        scale[i * 2] = kept[i].x;
        scale[i * 2 + 1] = kept[i].y;
    }
    return outlineOf(scale, new Float64Array(scale.length), true);
}

/** Douglas–Peucker over a closed ring, split at its first vertex and the vertex farthest from it. */
function simplifyRing(ring: Point[], tolerance: number): Point[] {
    if (ring.length < 4) return ring;
    let far = 1;
    let farDistance = -1;
    for (let i = 1; i < ring.length; i++) {
        const distance = Math.hypot(ring[i].x - ring[0].x, ring[i].y - ring[0].y);
        if (distance > farDistance) {
            far = i;
            farDistance = distance;
        }
    }
    const keep = new Array<boolean>(ring.length).fill(false);
    keep[0] = true;
    keep[far] = true;
    simplifyChain(ring, 0, far, tolerance, keep);
    simplifyChain(ring, far, ring.length, tolerance, keep);
    return ring.filter((_, i) => keep[i]);
}

/** Marks the vertices between `from` and `to` (wrapping to the first) that the chain cannot drop. */
function simplifyChain(ring: Point[], from: number, to: number, tolerance: number, keep: boolean[]) {
    const a = ring[from];
    const b = ring[to % ring.length];
    let worst = -1;
    let worstDistance = tolerance;
    for (let i = from + 1; i < to; i++) {
        const distance = distanceToSegment(ring[i], a, b);
        if (distance > worstDistance) {
            worst = i;
            worstDistance = distance;
        }
    }
    if (worst < 0) return;
    keep[worst] = true;
    simplifyChain(ring, from, worst, tolerance, keep);
    simplifyChain(ring, worst, to, tolerance, keep);
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared > 0 ? Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared)) : 0;
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

// A custom path may draw anything at any cost to trace, so it collides as its bounding box.
function customOutline(shape: AgMarkerShapeFn): MarkerOutline | undefined {
    const small = customBounds(shape, CUSTOM_SMALL_SIZE);
    const large = customBounds(shape, CUSTOM_LARGE_SIZE);
    if (small == null || large == null) return undefined;
    // Fits each bound as `scale * size + offset` through both measurements.
    const scale = new Float64Array(8);
    const offset = new Float64Array(8);
    const corners = [0, 1, 2, 1, 2, 3, 0, 3];
    for (let i = 0; i < 8; i++) {
        const b = corners[i];
        scale[i] = (large[b] - small[b]) / (CUSTOM_LARGE_SIZE - CUSTOM_SMALL_SIZE);
        offset[i] = small[b] - scale[i] * CUSTOM_SMALL_SIZE;
    }
    return outlineOf(scale, offset, false);
}

/** `[x0, y0, x1, y1]` of the custom shape's path at `size`, or `undefined` when it has no area. */
function customBounds(shape: AgMarkerShapeFn, size: number): number[] | undefined {
    const { x, y, width, height } = traceMarkerShape(shape, size).computeBBox();
    const measurable = width > 0 && height > 0 && Number.isFinite(width) && Number.isFinite(height);
    return measurable ? [x, y, x + width, y + height] : undefined;
}

function outlineOf(scale: Float64Array, offset: Float64Array, withInner: boolean): MarkerOutline {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let minOffsetX = Infinity;
    let minOffsetY = Infinity;
    let maxOffsetX = -Infinity;
    let maxOffsetY = -Infinity;
    for (let i = 0; i < scale.length; i += 2) {
        minX = Math.min(minX, scale[i]);
        maxX = Math.max(maxX, scale[i]);
        minY = Math.min(minY, scale[i + 1]);
        maxY = Math.max(maxY, scale[i + 1]);
        minOffsetX = Math.min(minOffsetX, offset[i]);
        maxOffsetX = Math.max(maxOffsetX, offset[i]);
        minOffsetY = Math.min(minOffsetY, offset[i + 1]);
        maxOffsetY = Math.max(maxOffsetY, offset[i + 1]);
    }
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const fraction = withInner ? innerFraction(scale, midX, midY, (maxX - minX) / 2, (maxY - minY) / 2) : 0;
    const innerHalfWidth = fraction > 0 ? fraction * ((maxX - minX) / 2) : -Infinity;
    const innerHalfHeight = fraction > 0 ? fraction * ((maxY - minY) / 2) : -Infinity;
    return {
        scale,
        offset,
        minX,
        minY,
        maxX,
        maxY,
        minOffsetX,
        minOffsetY,
        maxOffsetX,
        maxOffsetY,
        innerMinX: midX - innerHalfWidth,
        innerMinY: midY - innerHalfHeight,
        innerMaxX: midX + innerHalfWidth,
        innerMaxY: midY + innerHalfHeight,
    };
}

/** The largest fraction of the bounding box, shrunk about its centre, the outline holds with the margin; 0 if none. */
function innerFraction(scale: Float64Array, midX: number, midY: number, halfWidth: number, halfHeight: number) {
    for (let fraction = 0.9; fraction > 0.01; fraction *= 0.9) {
        const w = fraction * halfWidth + INNER_MARGIN;
        const h = fraction * halfHeight + INNER_MARGIN;
        if (outlineContainsBox(scale, midX, midY, w, h)) return fraction;
    }
    return 0;
}

/** Whether the unit outline `scale` holds the whole box on `(x, y)`: no edge enters it and its centre is inside. */
function outlineContainsBox(scale: Float64Array, x: number, y: number, halfWidth: number, halfHeight: number) {
    const n = scale.length;
    let winding = 0;
    for (let i = 0; i < n; i += 2) {
        const j = (i + 2) % n;
        const x0 = scale[i] - x;
        const y0 = scale[i + 1] - y;
        const x1 = scale[j] - x;
        const y1 = scale[j + 1] - y;
        if (segmentCrossesOpenBox(x0, y0, x1, y1, halfWidth, halfHeight)) return false;
        winding += windingStep(x0, y0, x1, y1);
    }
    return winding !== 0;
}

/** An outline drawn at one size and centre, its vertices derived per test so placing it costs no layout pass. */
export interface PlacedMarkerOutline {
    /** `undefined` while the outline is released, or drawn at no positive size. */
    outline: MarkerOutline | undefined;
    cx: number;
    cy: number;
    size: number;
    innerMinX: number;
    innerMinY: number;
    innerMaxX: number;
    innerMaxY: number;
}

/** Places `outline` at `size` on `(cx, cy)`, into `out` when given; empty unless `size` is positive. */
export function placeMarkerOutline(
    outline: MarkerOutline,
    cx: number,
    cy: number,
    size: number,
    out?: PlacedMarkerOutline
): PlacedMarkerOutline {
    const drawn = size > 0;
    const placed = out ?? {
        outline: undefined,
        cx: 0,
        cy: 0,
        size: 0,
        innerMinX: 0,
        innerMinY: 0,
        innerMaxX: 0,
        innerMaxY: 0,
    };
    placed.outline = drawn ? outline : undefined;
    placed.cx = cx;
    placed.cy = cy;
    placed.size = size;
    placed.innerMinX = drawn ? cx + outline.innerMinX * size : Infinity;
    placed.innerMinY = drawn ? cy + outline.innerMinY * size : Infinity;
    placed.innerMaxX = drawn ? cx + outline.innerMaxX * size : -Infinity;
    placed.innerMaxY = drawn ? cy + outline.innerMaxY * size : -Infinity;
    return placed;
}

/** Whether the placed outline shares area with the rectangle on `(rx, ry)` rotated by `(cos, sin)`. */
export function markerOutlineOverlapsRect(
    placed: PlacedMarkerOutline,
    rx: number,
    ry: number,
    halfWidth: number,
    halfHeight: number,
    cos: number,
    sin: number
): boolean {
    const { outline } = placed;
    if (outline == null || !(halfWidth > 0 && halfHeight > 0)) return false;
    if (cos === 1 && sin === 0) {
        // Sharing area with the inner box is an overlap the full test finds too, as every edge keeps clear of it.
        const sharesInner =
            rx - halfWidth < placed.innerMaxX &&
            rx + halfWidth > placed.innerMinX &&
            ry - halfHeight < placed.innerMaxY &&
            ry + halfHeight > placed.innerMinY;
        if (sharesInner) return true;
    }
    const { scale, offset } = outline;
    const { cx, cy, size } = placed;
    const n = scale.length;
    // Vertices are taken into the rectangle's frame, where it is the open box ±halfWidth × ±halfHeight.
    let prevX = 0;
    let prevY = 0;
    let winding = 0;
    for (let i = 0; i <= n; i += 2) {
        const j = i === n ? 0 : i;
        const dx = cx + scale[j] * size + offset[j] - rx;
        const dy = cy + scale[j + 1] * size + offset[j + 1] - ry;
        const x = cos * dx + sin * dy;
        const y = cos * dy - sin * dx;
        if (i > 0) {
            // An edge wholly beyond one side cannot enter the open box, which is all the clip would find.
            const beyond =
                (prevX <= -halfWidth && x <= -halfWidth) ||
                (prevX >= halfWidth && x >= halfWidth) ||
                (prevY <= -halfHeight && y <= -halfHeight) ||
                (prevY >= halfHeight && y >= halfHeight);
            if (!beyond && segmentCrossesOpenBox(prevX, prevY, x, y, halfWidth, halfHeight)) return true;
            winding += windingStep(prevX, prevY, x, y);
        }
        prevX = x;
        prevY = y;
    }
    // No edge enters the rectangle, so it lies wholly inside the outline or wholly outside: its centre decides.
    return winding !== 0;
}

/** Liang–Barsky against the open box: a segment along an edge, or meeting a corner, does not cross it. */
function segmentCrossesOpenBox(x0: number, y0: number, x1: number, y1: number, hw: number, hh: number): boolean {
    const dx = x1 - x0;
    const dy = y1 - y0;
    // Each side keeps the part of the segment inside it: the side it starts outside raises t0, the other lowers t1.
    let t0 = 0;
    let t1 = 1;
    if (dx === 0) {
        if (!(x0 + hw > 0 && hw - x0 > 0)) return false;
    } else if (dx > 0) {
        t0 = Math.max(t0, (x0 + hw) / -dx);
        t1 = Math.min(t1, (hw - x0) / dx);
    } else {
        t1 = Math.min(t1, (x0 + hw) / -dx);
        t0 = Math.max(t0, (hw - x0) / dx);
    }
    if (t0 < t1) return clipsOpenY(y0, dy, hh, t0, t1);
    return false;
}

function clipsOpenY(y0: number, dy: number, hh: number, t0: number, t1: number) {
    if (dy === 0) return y0 + hh > 0 && hh - y0 > 0;
    if (dy > 0) {
        t0 = Math.max(t0, (y0 + hh) / -dy);
        t1 = Math.min(t1, (hh - y0) / dy);
    } else {
        t1 = Math.min(t1, (y0 + hh) / -dy);
        t0 = Math.max(t0, (hh - y0) / dy);
    }
    return t0 < t1;
}

/** The edge's contribution to the nonzero winding number of the origin, the rule the outline is filled by. */
function windingStep(x0: number, y0: number, x1: number, y1: number): number {
    const cross = x0 * y1 - x1 * y0;
    if (y0 <= 0) {
        return y1 > 0 && cross > 0 ? 1 : 0;
    }
    return y1 <= 0 && cross < 0 ? -1 : 0;
}

const NO_VERTICES = new Float64Array(0);

/** Both spans in one edge pass, as the label retreat needs each axis per obstacle. */
export function markerOutlineSpans(
    outX: { min: number; max: number },
    outY: { min: number; max: number },
    placed: PlacedMarkerOutline,
    left: number,
    top: number,
    right: number,
    bottom: number
): void {
    const { outline, cx, cy, size } = placed;
    const scale = outline?.scale ?? NO_VERTICES;
    const offset = outline?.offset ?? NO_VERTICES;
    const n = scale.length;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let x0 = 0;
    let y0 = 0;
    for (let i = 0; n > 0 && i <= n; i += 2) {
        const j = i === n ? 0 : i;
        const x1 = cx + scale[j] * size + offset[j];
        const y1 = cy + scale[j + 1] * size + offset[j + 1];
        if (i > 0) {
            const yLo = Math.min(y0, y1);
            const yHi = Math.max(y0, y1);
            if (!(yHi < top || yLo > bottom)) {
                const flat = yHi === yLo;
                const enter = flat ? x0 : alongAt(x0, y0, x1, y1, Math.max(top, yLo));
                const leave = flat ? x1 : alongAt(x0, y0, x1, y1, Math.min(bottom, yHi));
                minX = Math.min(minX, enter, leave);
                maxX = Math.max(maxX, enter, leave);
            }
            const xLo = Math.min(x0, x1);
            const xHi = Math.max(x0, x1);
            if (!(xHi < left || xLo > right)) {
                const flat = xHi === xLo;
                const enter = flat ? y0 : alongAt(y0, x0, y1, x1, Math.max(left, xLo));
                const leave = flat ? y1 : alongAt(y0, x0, y1, x1, Math.min(right, xHi));
                minY = Math.min(minY, enter, leave);
                maxY = Math.max(maxY, enter, leave);
            }
        }
        x0 = x1;
        y0 = y1;
    }
    // Left empty on a miss, unlike a circle's point: callers only measure an obstacle their box overlaps.
    outX.min = minX;
    outX.max = maxX;
    outY.min = minY;
    outY.max = maxY;
}

/** The along-axis value of the edge `(a0, b0)`–`(a1, b1)` where it reaches `b`. */
function alongAt(a0: number, b0: number, a1: number, b1: number, b: number): number {
    return a0 + ((a1 - a0) * (b - b0)) / (b1 - b0);
}
