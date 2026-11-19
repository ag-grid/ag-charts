import type { OrientedRect } from './orientedRect';

type OutlinePoint = { readonly x: number; readonly y: number };

/** A marker's drawn outline about its centre as closed polygons, in fractions of its size when {@link unit}, else px. */
export interface MarkerOutline {
    readonly polygons: readonly (readonly OutlinePoint[])[];
    readonly unit: boolean;
    /** How far the drawn curves may stray outside the polygons, in the same units. */
    readonly tolerance: number;
}

/** The extent {@link outlineSpan} writes; `min > max` when the outline has none in the band. */
export interface OutlineSpan {
    min: number;
    max: number;
}

// OPTIMIZATION: the clip interval lives in module scope so testing an edge allocates nothing.
let clipT0 = 0;
let clipT1 = 1;

function clipToSide(p: number, q: number): boolean {
    if (p === 0) return q >= 0;
    const t = q / p;
    if (p < 0) {
        clipT0 = Math.max(clipT0, t);
    } else {
        clipT1 = Math.min(clipT1, t);
    }
    return clipT0 <= clipT1;
}

/** Liang-Barsky: whether any of the segment from `a` to `b` lies within the closed box. */
export function segmentTouchesBox(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    x0: number,
    y0: number,
    x1: number,
    y1: number
): boolean {
    const dx = bx - ax;
    const dy = by - ay;
    clipT0 = 0;
    clipT1 = 1;
    return clipToSide(-dx, ax - x0) && clipToSide(dx, x1 - ax) && clipToSide(-dy, ay - y0) && clipToSide(dy, y1 - ay);
}

/** Whether `(x, y)` lies within the outline drawn at `(cx, cy)` and `scale`, by the canvas' nonzero fill rule. */
export function pointInOutline(
    outline: MarkerOutline,
    cx: number,
    cy: number,
    scale: number,
    x: number,
    y: number
): boolean {
    const px = (x - cx) / scale;
    const py = (y - cy) / scale;
    let winding = 0;
    for (const polygon of outline.polygons) {
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const a = polygon[j];
            const b = polygon[i];
            const side = (b.x - a.x) * (py - a.y) - (px - a.x) * (b.y - a.y);
            if (a.y <= py) {
                if (b.y > py && side > 0) winding++;
            } else if (b.y <= py && side < 0) {
                winding--;
            }
        }
    }
    return winding !== 0;
}

/** Whether the outline drawn at `(cx, cy)` and `scale`, grown by `padX` and `padY` px, touches the box. */
export function outlineOverlapsBox(
    outline: MarkerOutline,
    cx: number,
    cy: number,
    scale: number,
    padX: number,
    padY: number,
    x: number,
    y: number,
    width: number,
    height: number
): boolean {
    const x0 = x - padX;
    const y0 = y - padY;
    const x1 = x + width + padX;
    const y1 = y + height + padY;
    for (const polygon of outline.polygons) {
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const a = polygon[j];
            const b = polygon[i];
            const ax = cx + a.x * scale;
            const ay = cy + a.y * scale;
            if (segmentTouchesBox(ax, ay, cx + b.x * scale, cy + b.y * scale, x0, y0, x1, y1)) return true;
        }
    }
    return pointInOutline(outline, cx, cy, scale, x + width / 2, y + height / 2);
}

/**
 * {@link outlineOverlapsBox} against a rotated rectangle, each edge taken into its frame. `pad` grows the outline
 * in every direction; `snap` moves it up to that far along each screen axis.
 */
export function outlineOverlapsOrientedRect(
    outline: MarkerOutline,
    cx: number,
    cy: number,
    scale: number,
    pad: number,
    snap: number,
    rect: OrientedRect
): boolean {
    const { cos, sin } = rect;
    const grow = pad + snap * (Math.abs(cos) + Math.abs(sin));
    const halfWidth = rect.halfWidth + grow;
    const halfHeight = rect.halfHeight + grow;
    for (const polygon of outline.polygons) {
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const a = polygon[j];
            const b = polygon[i];
            const adx = cx + a.x * scale - rect.cx;
            const ady = cy + a.y * scale - rect.cy;
            const bdx = cx + b.x * scale - rect.cx;
            const bdy = cy + b.y * scale - rect.cy;
            if (
                segmentTouchesBox(
                    cos * adx + sin * ady,
                    cos * ady - sin * adx,
                    cos * bdx + sin * bdy,
                    cos * bdy - sin * bdx,
                    -halfWidth,
                    -halfHeight,
                    halfWidth,
                    halfHeight
                )
            ) {
                return true;
            }
        }
    }
    return pointInOutline(outline, cx, cy, scale, rect.cx, rect.cy);
}

/**
 * Writes the outline's extent along one axis across the band `[lo, hi]` on the other, grown by `padAlong` and
 * `padAcross` px: along x across rows when `rows`, else along y across columns.
 */
export function outlineSpan(
    outline: MarkerOutline,
    cx: number,
    cy: number,
    scale: number,
    padAlong: number,
    padAcross: number,
    lo: number,
    hi: number,
    rows: boolean,
    out: OutlineSpan
): void {
    out.min = Infinity;
    out.max = -Infinity;
    const bandLo = lo - padAcross;
    const bandHi = hi + padAcross;
    for (const polygon of outline.polygons) {
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            spanEdge(polygon[j], polygon[i], cx, cy, scale, bandLo, bandHi, rows, out);
        }
    }
    out.min -= padAlong;
    out.max += padAlong;
}

/** Widens `out` by the extent of the edge from `a` to `b`, drawn at `(cx, cy)` and `scale`, within the band. */
function spanEdge(
    a: OutlinePoint,
    b: OutlinePoint,
    cx: number,
    cy: number,
    scale: number,
    bandLo: number,
    bandHi: number,
    rows: boolean,
    out: OutlineSpan
): void {
    const aAlong = rows ? cx + a.x * scale : cy + a.y * scale;
    const bAlong = rows ? cx + b.x * scale : cy + b.y * scale;
    const aAcross = rows ? cy + a.y * scale : cx + a.x * scale;
    const bAcross = rows ? cy + b.y * scale : cx + b.x * scale;
    if (!segmentTouchesBox(aAlong, aAcross, bAlong, bAcross, -Infinity, bandLo, Infinity, bandHi)) return;
    const from = aAlong + (bAlong - aAlong) * clipT0;
    const to = aAlong + (bAlong - aAlong) * clipT1;
    out.min = Math.min(out.min, from, to);
    out.max = Math.max(out.max, from, to);
}

/** Half-strokes a miter join reaches past the polygons at their sharpest corner; a join past `limit` bevels to 1. */
export function outlineWorstMiter(polygons: readonly (readonly OutlinePoint[])[], limit: number): number {
    let worst = 1;
    for (const polygon of polygons) {
        const corners = distinctCorners(polygon);
        const n = corners.length;
        if (n < 3) continue;
        for (let i = 0; i < n; i++) {
            const prev = corners[(i + n - 1) % n];
            const at = corners[i];
            const next = corners[(i + 1) % n];
            const ux = prev.x - at.x;
            const uy = prev.y - at.y;
            const vx = next.x - at.x;
            const vy = next.y - at.y;
            const cos = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy));
            const sinHalf = Math.sqrt(Math.max(0, (1 - cos) / 2));
            const miter = sinHalf > 0 ? 1 / sinHalf : Infinity;
            if (miter <= limit) worst = Math.max(worst, miter);
        }
    }
    return worst;
}

/** The polygon's points with repeats dropped, including a closing point repeating the first. */
function distinctCorners(polygon: readonly OutlinePoint[]): OutlinePoint[] {
    const corners: OutlinePoint[] = [];
    for (const point of polygon) {
        const last = corners.at(-1);
        if (last?.x !== point.x || last.y !== point.y) corners.push(point);
    }
    const first = corners[0];
    const last = corners.at(-1);
    if (corners.length > 1 && first.x === last?.x && first.y === last.y) corners.pop();
    return corners;
}
