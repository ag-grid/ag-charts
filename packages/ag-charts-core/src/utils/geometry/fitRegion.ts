import type { TrapezoidBounds } from './trapezoid';
import { trapezoidExtentAcross } from './trapezoid';

/**
 * The room a shape offers a label, as a function of the vertical band a line of text occupies. Coordinates
 * are relative to the label's anchor: `top`/`bottom` are signed offsets from it (negative above), and the
 * span returned is `[left, right]` offsets from it too, which need not be symmetric — a wedge, a taper or
 * a corner all offer more room on one side of an anchor than the other.
 */
export interface FitRegion {
    /** Horizontal room across the band `[top, bottom]`, as `[left, right]` offsets from the anchor. */
    spanAt(top: number, bottom: number): readonly [number, number];
    /** Vertical room above the anchor (positive) — the block cannot extend past it. */
    readonly extentAbove: number;
    /** Vertical room below the anchor (positive). */
    readonly extentBelow: number;
}

/**
 * Width a line centred `offsetX` from the anchor can use across the band. Centred text is symmetric about
 * where it is drawn, so only the nearer edge counts, however much room lies beyond the further one.
 */
export function regionWidthAt(region: FitRegion, top: number, bottom: number, offsetX = 0): number {
    const [left, right] = region.spanAt(top, bottom);
    return Math.max(0, 2 * Math.min(offsetX - left, right - offsetX));
}

/** The room a pyramid stage offers a label anchored at `anchor` along the trapezoid's span axis. */
export function trapezoidFitRegion(trapezoid: TrapezoidBounds, anchorSpan: number): FitRegion {
    return {
        // Every cross-section of a trapezoid shares a centre, and the label is anchored on it.
        spanAt: (top, bottom) => {
            const half = trapezoidExtentAcross(trapezoid, anchorSpan + top, anchorSpan + bottom) / 2;
            return [-half, half];
        },
        extentAbove: anchorSpan - trapezoid.spanLo,
        extentBelow: trapezoid.spanHi - anchorSpan,
    };
}

/**
 * A region probed from a containment test, for shapes with no closed form: at each band the horizontal
 * reach is scanned outward from the anchor on both sides, and the two are reported as they are, so a
 * caller can use the wider side rather than folding it away.
 *
 * A band is tested at `rows` evenly spaced rows rather than at its two edges alone, because the shapes
 * that need probing are not convex: an annulus sector is closest to its hole between the edges of a band
 * that straddles the centre line, so an edge-only test reaches into the hole unseen. This samples the
 * band rather than proving it, so a shape that narrows sharply within one row can still be over-reported.
 *
 * Nor is containment monotonic along the ray, for the same reason: a wide annulus sector is left through
 * its hole and entered again beyond it, so a plain bisection over `[0, limit]` can settle on the far arm
 * and report room across the gap. The reach is therefore bracketed by a coarse outward scan of `probes`
 * samples first, and bisected only inside the interval where the shape was first left.
 */
export function probedFitRegion(
    anchor: { x: number; y: number },
    contains: (x: number, y: number) => boolean,
    limit: number,
    steps = 20,
    rows = 5,
    probes = 16
): FitRegion {
    const reach = (top: number, bottom: number, direction: number) => {
        const sampled = Math.max(2, rows);
        const step = (bottom - top) / (sampled - 1);
        const insideBand = (t: number) => {
            const x = anchor.x + direction * t;
            for (let i = 0; i < sampled; i += 1) {
                if (!contains(x, anchor.y + top + step * i)) return false;
            }
            return true;
        };
        return firstOutside(insideBand, limit, probes, steps);
    };
    const vertical = (direction: number) =>
        firstOutside((t) => contains(anchor.x, anchor.y + direction * t), limit, probes, steps);
    return {
        // Wrapping asks for the same band once per candidate word, and each ask is a pair of outward
        // scans over a containment test, so the answer is memoised for the label's own short-lived region.
        spanAt: memoiseByBand((top, bottom) => [-reach(top, bottom, -1), reach(top, bottom, 1)]),
        extentAbove: vertical(-1),
        extentBelow: vertical(1),
    };
}

// Scanned outward, then bisected within the step that crossed: a ray out of an annulus sector re-enters
// it beyond the hole, so bisecting the whole limit could land past the hole and carry the reach across it.
// The scan resolves a gap only as narrow as `limit / probes`, so a hole thinner than one step is still
// crossed — bounded sampling, not a guarantee.
function firstOutside(inside: (t: number) => boolean, limit: number, probes: number, steps: number): number {
    const count = Math.max(1, probes);
    const step = limit / count;
    let lo = 0;
    let hi = limit;
    for (let i = 1; i <= count; i += 1) {
        const t = Math.min(i * step, limit);
        if (!inside(t)) {
            hi = t;
            break;
        }
        lo = t;
    }
    if (lo >= limit) return limit;
    for (let i = 0; i < steps; i += 1) {
        const t = (lo + hi) / 2;
        if (inside(t)) {
            lo = t;
        } else {
            hi = t;
        }
    }
    return lo;
}

function memoiseByBand(spanAt: (top: number, bottom: number) => readonly [number, number]) {
    const cache = new Map<string, readonly [number, number]>();
    return (top: number, bottom: number) => {
        const key = `${top},${bottom}`;
        let span = cache.get(key);
        if (span == null) {
            span = spanAt(top, bottom);
            cache.set(key, span);
        }
        return span;
    };
}

/**
 * The same region held clear of the shape's edge by `dx` horizontally and `dy` vertically, which is how a
 * caller pays for what the region does not know about: the drawn box's padding, a collision threshold, or
 * the rounding between the band a line was wrapped to and the band it is finally drawn across.
 */
export function insetFitRegion(region: FitRegion, dx: number, dy: number): FitRegion {
    return {
        spanAt: (top, bottom) => {
            const [left, right] = region.spanAt(top - dy, bottom + dy);
            const mid = (left + right) / 2;
            return [Math.min(left + dx, mid), Math.max(right - dx, mid)];
        },
        extentAbove: Math.max(0, region.extentAbove - dy),
        extentBelow: Math.max(0, region.extentBelow - dy),
    };
}

/** A shape sampled into rows of inside spans, in units scaled by {@link maskFitRegion}'s `scale`. */
export interface FitRegionMask {
    /** Each sampled row's inside span as `[lo, hi]`, top row first; `undefined` where the row is empty. */
    readonly rows: readonly (readonly [number, number] | undefined)[];
    /** Offset of the first row's top edge from the shape's origin. */
    readonly top: number;
    readonly rowHeight: number;
}

const EMPTY_SPAN = [0, 0] as const;

/**
 * A region sampled from a shape mask, for a shape with neither a closed form nor a cheap containment test
 * (a marker outline). A band's span is the intersection of the rows it covers, which is what an
 * axis-aligned box spanning them can occupy. `scale` sizes the unit mask onto the drawn shape.
 */
export function maskFitRegion(mask: FitRegionMask, scale: number, anchor: { x: number; y: number }): FitRegion {
    const rows = mask.rows;
    const rowTop = mask.top * scale;
    const rowHeight = mask.rowHeight * scale;
    const { x: anchorX, y: anchorY } = anchor;
    const rowIndex = (offset: number) => (anchorY + offset - rowTop) / rowHeight;
    return {
        spanAt: (top, bottom) => {
            // A row's span is sampled at its centre line, so a band is only safe if the rows either side of
            // the ones it lands in agree: half a row of taper sits between a sample and the row's edge.
            const first = Math.max(0, Math.floor(rowIndex(top) - 0.5));
            const last = Math.min(rows.length - 1, Math.ceil(rowIndex(bottom) + 0.5) - 1);
            if (first > last) return EMPTY_SPAN;
            let lo = -Infinity;
            let hi = Infinity;
            for (let i = first; i <= last; i += 1) {
                const span = rows[i];
                if (span == null) return EMPTY_SPAN;
                lo = Math.max(lo, span[0] * scale);
                hi = Math.min(hi, span[1] * scale);
            }
            return lo <= hi ? [lo - anchorX, hi - anchorX] : EMPTY_SPAN;
        },
        extentAbove: anchorY - rowTop,
        extentBelow: rowTop + rows.length * rowHeight - anchorY,
    };
}
