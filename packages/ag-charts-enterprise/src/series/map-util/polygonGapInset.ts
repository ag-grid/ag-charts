import type { Position } from 'ag-charts-core';

import type { GapRingInfo } from './mapShapeGapIndex';

const DROP_DISTANCE_SQ = 0.5 * 0.5;
const MIN_AREA = 0.5;
const PARALLEL_SIN = 1e-6;
const REVERSED_EPSILON = 1e-9;
const LENGTHEN_TOLERANCE = 1e-6;

/** A ring after dropping sub-pixel vertices inside shared runs. */
export interface GapSimplifiedRing {
    /** Kept vertices, as the same `Position` objects as the input ring. */
    readonly points: Position[];
    /** `moved[k]` is 1 when the edge from `points[k]` to the next kept vertex is moved. */
    readonly moved: Uint8Array;
    /** Index of each kept vertex in the input ring. */
    readonly sourceIndex: number[];
}

/** Where one surviving edge of an inset ring was drawn. */
export interface GapInsetEdge {
    /** Index of the edge in the simplified ring. */
    readonly edge: number;
    readonly x0: number;
    readonly y0: number;
    readonly x1: number;
    readonly y1: number;
}

export interface GapInsetRing {
    /** The drawn ring, closed. */
    readonly ring: Position[];
    /** The surviving simplified edges in ring order, with the segment each one is drawn as. */
    readonly edges: GapInsetEdge[];
}

function mod(i: number, n: number): number {
    return ((i % n) + n) % n;
}

/**
 * Drops, per shared run, every vertex within 0.5px of the previous kept vertex, walking the run from its canonical end
 * so that both rings on a border drop the same vertices. Tripoints and run ends are never dropped. Returns
 * `undefined` for a ring with non-finite coordinates.
 */
export function simplifyGapRing(ring: readonly Position[], info: GapRingInfo): GapSimplifiedRing | undefined {
    const n = info.vertexCount;
    if (ring.length < n) return undefined;

    for (let i = 0; i < n; i += 1) {
        if (!Number.isFinite(ring[i][0]) || !Number.isFinite(ring[i][1])) return undefined;
    }

    const dropped = new Uint8Array(n);
    for (const { start, length, reversed } of info.runs) {
        let previous = reversed ? mod(start + length, n) : start;
        for (let j = 1; j < length; j += 1) {
            const v = reversed ? mod(start + length - j, n) : (start + j) % n;
            if (info.pinned[v] === 1) {
                previous = v;
                continue;
            }
            const dx = ring[v][0] - ring[previous][0];
            const dy = ring[v][1] - ring[previous][1];
            if (dx * dx + dy * dy < DROP_DISTANCE_SQ) {
                dropped[v] = 1;
            } else {
                previous = v;
            }
        }
    }

    const points: Position[] = [];
    const moved: number[] = [];
    const sourceIndex: number[] = [];
    for (let i = 0; i < n; i += 1) {
        if (dropped[i] === 1) continue;
        const p = ring[i];
        const last = points.length - 1;
        if (last >= 0 && points[last][0] === p[0] && points[last][1] === p[1]) {
            // A zero-length edge has no direction: merge the vertices.
            moved[last] = info.movedEdges[i];
            continue;
        }
        points.push(p);
        moved.push(info.movedEdges[i]);
        sourceIndex.push(i);
    }
    const first = points[0];
    const last = points.at(-1);
    if (last != null && points.length > 1 && first[0] === last[0] && first[1] === last[1]) {
        points.pop();
        moved.pop();
        sourceIndex.pop();
    }

    return { points, moved: Uint8Array.from(moved), sourceIndex };
}

interface Edges {
    readonly sx: Float64Array;
    readonly sy: Float64Array;
    readonly ex: Float64Array;
    readonly ey: Float64Array;
    readonly tx: Float64Array;
    readonly ty: Float64Array;
    readonly nx: Float64Array;
    readonly ny: Float64Array;
    readonly len: Float64Array;
    readonly moved: Uint8Array;
    readonly source: Int32Array;
}

interface Join {
    /** Points between the two edges: the first ends the incoming edge, the last starts the outgoing one. */
    readonly points: number[];
    /** How far the incoming unmoved edge is trimmed at its end (negative: extended). */
    readonly endSlide: number;
    /** How far the outgoing unmoved edge is trimmed at its start (negative: extended). */
    readonly startSlide: number;
}

interface StackEntry {
    readonly edge: number;
    /** Join with the previous entry. Empty for the bottom entry, whose start join is made when the ring closes. */
    startPoints: number[];
    startSlide: number;
    endSlide: number;
}

function buildEdges(points: readonly Position[], sourceMoved: Uint8Array, fillLeft: boolean): Edges {
    const m = points.length;
    const edges: Edges = {
        sx: new Float64Array(m),
        sy: new Float64Array(m),
        ex: new Float64Array(m),
        ey: new Float64Array(m),
        tx: new Float64Array(m),
        ty: new Float64Array(m),
        nx: new Float64Array(m),
        ny: new Float64Array(m),
        len: new Float64Array(m),
        moved: new Uint8Array(m),
        source: new Int32Array(m),
    };

    // Rotate so that edge 0 is unmoved: unmoved edges are never removed, so it anchors the stack.
    let anchor = 0;
    for (let i = 0; i < m; i += 1) {
        if (sourceMoved[i] === 0) {
            anchor = i;
            break;
        }
    }

    for (let k = 0; k < m; k += 1) {
        const i = (anchor + k) % m;
        const [x0, y0] = points[i];
        const [x1, y1] = points[(i + 1) % m];
        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.hypot(dx, dy);
        edges.sx[k] = x0;
        edges.sy[k] = y0;
        edges.ex[k] = x1;
        edges.ey[k] = y1;
        edges.tx[k] = dx / len;
        edges.ty[k] = dy / len;
        edges.nx[k] = fillLeft ? -dy / len : dy / len;
        edges.ny[k] = fillLeft ? dx / len : -dx / len;
        edges.len[k] = len;
        edges.source[k] = i;
        edges.moved[k] = sourceMoved[i];
    }
    return edges;
}

/** Intersection of two lines, each given by a point and a unit direction. */
function intersect(
    ax: number,
    ay: number,
    atx: number,
    aty: number,
    bx: number,
    by: number,
    btx: number,
    bty: number
): [number, number] | undefined {
    const cross = atx * bty - aty * btx;
    if (Math.abs(cross) < PARALLEL_SIN) return undefined;
    const u = ((bx - ax) * bty - (by - ay) * btx) / cross;
    const x = ax + u * atx;
    const y = ay + u * aty;
    return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : undefined;
}

function distanceToSegment(px: number, py: number, x0: number, y0: number, x1: number, y1: number): number {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const lengthSq = dx * dx + dy * dy;
    const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / lengthSq));
    return Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy));
}

/**
 * Meets edge `a` and the following edge `b` at their shared vertex (or, after edges between them were removed, at the
 * end of `a` and the start of `b`). A mitre where both edges are moved, a slide along the unmoved edge where one is.
 * Past the caps, a bevel or a square step at the original vertex.
 */
function joinEdges(
    g: Edges,
    a: number,
    b: number,
    aStartSlide: number,
    bEndSlide: number,
    d: number,
    fillLeft: boolean
): Join {
    const vax = g.ex[a];
    const vay = g.ey[a];
    const vbx = g.sx[b];
    const vby = g.sy[b];
    const aMoved = g.moved[a] === 1;
    const bMoved = g.moved[b] === 1;
    const qax = vax + g.nx[a] * d;
    const qay = vay + g.ny[a] * d;
    const qbx = vbx + g.nx[b] * d;
    const qby = vby + g.ny[b] * d;
    const cap = 2 * d;

    if (aMoved && bMoved) {
        const cross = g.tx[a] * g.ty[b] - g.ty[a] * g.tx[b];
        const dot = g.tx[a] * g.tx[b] + g.ty[a] * g.ty[b];
        const bevel: Join = { points: [qax, qay, qbx, qby], endSlide: 0, startSlide: 0 };
        if (Math.abs(cross) < PARALLEL_SIN) {
            return dot > 0 && vax === vbx && vay === vby ? { points: [qax, qay], endSlide: 0, startSlide: 0 } : bevel;
        }
        const mitre = intersect(qax, qay, g.tx[a], g.ty[a], qbx, qby, g.tx[b], g.ty[b]);
        if (mitre == null) return bevel;
        const convex = cross > 0 === fillLeft;
        if (convex) {
            // At a convex corner both edges only ever shorten. A mitre that lengthens either one comes from edges
            // that were never adjacent, once the edges between them were removed.
            const pastA = (mitre[0] - qax) * g.tx[a] + (mitre[1] - qay) * g.ty[a];
            const beforeB = (mitre[0] - qbx) * g.tx[b] + (mitre[1] - qby) * g.ty[b];
            return pastA > LENGTHEN_TOLERANCE || beforeB < -LENGTHEN_TOLERANCE
                ? bevel
                : { points: mitre, endSlide: 0, startSlide: 0 };
        }
        if (distanceToSegment(mitre[0], mitre[1], vax, vay, vbx, vby) > cap) return bevel;
        return { points: mitre, endSlide: 0, startSlide: 0 };
    }

    if (aMoved) {
        const m = intersect(qax, qay, g.tx[a], g.ty[a], vbx, vby, g.tx[b], g.ty[b]);
        if (m != null) {
            const slide = (m[0] - vbx) * g.tx[b] + (m[1] - vby) * g.ty[b];
            if (Math.abs(slide) <= cap && slide <= g.len[b] - bEndSlide) {
                return { points: m, endSlide: 0, startSlide: slide };
            }
        }
        return { points: [qax, qay, vbx, vby], endSlide: 0, startSlide: 0 };
    }

    if (bMoved) {
        const m = intersect(vax, vay, g.tx[a], g.ty[a], qbx, qby, g.tx[b], g.ty[b]);
        if (m != null) {
            const slide = (vax - m[0]) * g.tx[a] + (vay - m[1]) * g.ty[a];
            if (Math.abs(slide) <= cap && slide + aStartSlide <= g.len[a]) {
                return { points: m, endSlide: slide, startSlide: 0 };
            }
        }
        return { points: [vax, vay, qbx, qby], endSlide: 0, startSlide: 0 };
    }

    // Both unmoved: only after a moved edge between them was removed.
    const m = intersect(vax, vay, g.tx[a], g.ty[a], vbx, vby, g.tx[b], g.ty[b]);
    if (m != null) {
        const endSlide = (vax - m[0]) * g.tx[a] + (vay - m[1]) * g.ty[a];
        const startSlide = (m[0] - vbx) * g.tx[b] + (m[1] - vby) * g.ty[b];
        if (
            Math.abs(endSlide) <= cap &&
            Math.abs(startSlide) <= cap &&
            endSlide + aStartSlide <= g.len[a] &&
            startSlide <= g.len[b] - bEndSlide
        ) {
            return { points: m, endSlide, startSlide };
        }
    }
    return { points: [vax, vay, vbx, vby], endSlide: 0, startSlide: 0 };
}

function isReversed(g: Edges, edge: number, fromPoints: number[], toPoints: number[]): boolean {
    const end = fromPoints.length;
    const x0 = fromPoints[end - 2];
    const y0 = fromPoints[end - 1];
    const dot = (toPoints[0] - x0) * g.tx[edge] + (toPoints[1] - y0) * g.ty[edge];
    return dot <= REVERSED_EPSILON;
}

/**
 * Insets the moved edges of one simplified ring by `d`, towards the fill. Returns `undefined` when fewer than 3 edges
 * survive the removal of reversed moved edges.
 */
export function insetGapRing(
    points: readonly Position[],
    moved: Uint8Array,
    d: number,
    fillLeft: boolean
): GapInsetRing | undefined {
    const m = points.length;
    if (m < 3) return undefined;

    const g = buildEdges(points, moved, fillLeft);
    const stack: StackEntry[] = [];

    for (let k = 0; k < m; k += 1) {
        let join: Join;
        for (;;) {
            const top = stack.at(-1);
            if (top == null) {
                join = { points: [], endSlide: 0, startSlide: 0 };
                break;
            }
            join = joinEdges(g, top.edge, k, top.startSlide, 0, d, fillLeft);
            const removable = stack.length > 1 && g.moved[top.edge] === 1;
            if (removable && isReversed(g, top.edge, top.startPoints, join.points)) {
                stack.pop();
                continue;
            }
            top.endSlide = join.endSlide;
            break;
        }
        stack.push({ edge: k, startPoints: join.points, startSlide: join.startSlide, endSlide: 0 });
    }

    // Close the ring. Either end may be a moved edge that reverses once the ring is joined up.
    let head = 0;
    let closing: Join = { points: [], endSlide: 0, startSlide: 0 };
    while (stack.length - head >= 3) {
        const top = stack.at(-1);
        if (top == null) break;
        const bottom = stack[head];
        closing = joinEdges(g, top.edge, bottom.edge, top.startSlide, bottom.endSlide, d, fillLeft);
        if (g.moved[top.edge] === 1 && isReversed(g, top.edge, top.startPoints, closing.points)) {
            stack.pop();
            continue;
        }
        if (g.moved[bottom.edge] === 1 && isReversed(g, bottom.edge, closing.points, stack[head + 1].startPoints)) {
            head += 1;
            continue;
        }
        break;
    }
    if (stack.length - head < 3) return undefined;

    const ringFlat: number[] = [...closing.points];
    for (let i = head + 1; i < stack.length; i += 1) {
        ringFlat.push(...stack[i].startPoints);
    }

    const ring: Position[] = [];
    for (let i = 0; i < ringFlat.length; i += 2) {
        ring.push([ringFlat[i], ringFlat[i + 1]]);
    }
    ring.push([ring[0][0], ring[0][1]]);

    const edges: GapInsetEdge[] = [];
    for (let i = head; i < stack.length; i += 1) {
        const from = i === head ? closing.points : stack[i].startPoints;
        const to = i === stack.length - 1 ? closing.points : stack[i + 1].startPoints;
        const end = from.length;
        edges.push({
            edge: g.source[stack[i].edge],
            x0: from[end - 2],
            y0: from[end - 1],
            x1: to[0],
            y1: to[1],
        });
    }

    return { ring, edges };
}

function signedArea(ring: readonly Position[]): number {
    let area = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
        area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    }
    return area / 2;
}

function hasThreeDistinctVertices(ring: readonly Position[]): boolean {
    const n = ring.length - 1;
    if (n < 3) return false;
    if (n > 4) return true;
    let distinct = 0;
    for (let i = 0; i < n; i += 1) {
        let seen = false;
        for (let j = 0; j < i; j += 1) {
            if (ring[i][0] === ring[j][0] && ring[i][1] === ring[j][1]) seen = true;
        }
        if (!seen) distinct += 1;
    }
    return distinct >= 3;
}

/**
 * Insets one polygon's rings in screen space by `d` on their moved edges. `ringInfo` is aligned with `projectedRings`:
 * a ring without an entry has no moved edge and is returned as the same array.
 *
 * Returns the same `projectedRings` array when nothing moves, and `undefined` for a collapsed polygon.
 */
export function insetPolygonRings(
    projectedRings: Position[][],
    ringInfo: readonly (GapRingInfo | undefined)[],
    d: number
): Position[][] | undefined {
    if (Number.isNaN(d) || d <= 0) return projectedRings;

    let anyMoved = false;
    for (let r = 0; r < projectedRings.length; r += 1) {
        if (ringInfo[r] != null) anyMoved = true;
    }
    if (!anyMoved) return projectedRings;

    const drawn: Position[][] = [];
    for (let r = 0; r < projectedRings.length; r += 1) {
        const ring = projectedRings[r];
        const info = ringInfo[r];
        if (info == null) {
            drawn.push(ring);
            continue;
        }

        const simplified = simplifyGapRing(ring, info);
        if (simplified == null) return undefined;

        const fillLeft = info.orientation > 0 !== info.hole;
        const inset = insetGapRing(simplified.points, simplified.moved, d, fillLeft);
        if (inset != null && hasThreeDistinctVertices(inset.ring)) {
            drawn.push(inset.ring);
        } else if (r === 0) {
            return undefined;
        }
    }

    const originalArea = signedArea(projectedRings[0]);
    const exteriorArea = signedArea(drawn[0]);
    if (originalArea * exteriorArea <= 0 || Math.abs(exteriorArea) < MIN_AREA) return undefined;

    let holesArea = 0;
    for (let r = 1; r < drawn.length; r += 1) {
        holesArea += Math.abs(signedArea(drawn[r]));
    }
    return holesArea >= Math.abs(exteriorArea) ? undefined : drawn;
}
