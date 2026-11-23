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

/**
 * The most text a region could hold at `lineHeight`, as a total advance width: the widest bands it has the
 * vertical room to stack, summed. Wrapping cannot beat this — breaking on words and centring only cost
 * width — so text measuring wider than this cannot fit whole however it is wrapped.
 */
export function regionTextCapacity(region: FitRegion, lineHeight: number): number {
    const lines = Math.floor((region.extentAbove + region.extentBelow) / lineHeight);
    if (lines < 1) {
        return 0;
    }
    const widths: number[] = [];
    // Half-line strides, since a band's width is taken across its whole height and a line of the block
    // need not sit where a top-aligned one would.
    for (let top = -region.extentAbove; top + lineHeight <= region.extentBelow; top += lineHeight / 2) {
        widths.push(regionWidthAt(region, top, top + lineHeight));
    }
    return widths
        .toSorted((a, b) => b - a)
        .slice(0, lines)
        .reduce((total, width) => total + width, 0);
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
 *
 * `holdsColumn(x, top, bottom)` vouches that a column whose ends are inside is inside throughout, and
 * `rays` where along a ray `contains` is already known, so probes there skip it.
 */
export function probedFitRegion(
    anchor: { x: number; y: number },
    contains: (x: number, y: number) => boolean,
    limit: number,
    holdsColumn?: (x: number, top: number, bottom: number) => boolean,
    rays?: RayBounds,
    steps = 20,
    rows = 5,
    probes = 16
): FitRegion {
    const reach = (top: number, bottom: number, direction: number) => {
        const sampled = Math.max(2, rows);
        const step = (bottom - top) / (sampled - 1);
        const firstY = anchor.y + top;
        const lastY = anchor.y + top + step * (sampled - 1);
        // OPTIMIZATION: a probe short of where a row's ray is vouched for skips that row's containment test.
        const firstUntil = rays?.insideUntil(anchor.x, firstY, direction, 0, limit) ?? -1;
        const lastUntil = rays?.insideUntil(anchor.x, lastY, direction, 0, limit) ?? -1;
        let bandUntil = Math.min(firstUntil, lastUntil);
        if (middleRowsUntil.length < sampled) middleRowsUntil = new Float64Array(sampled);
        // A convex shape holds what lies between the edge rows wherever both are held, so their bounds bound the band.
        const middleUntil = rays == null || rays.convex === true ? undefined : middleRowsUntil;
        for (let i = 1; middleUntil != null && i < sampled - 1; i += 1) {
            middleUntil[i] = rays!.insideUntil(anchor.x, anchor.y + top + step * i, direction, 0, limit);
            bandUntil = Math.min(bandUntil, middleUntil[i]);
        }
        // Either edge row leaving for good leaves the band, as those are tested first.
        const bandOutside = Math.min(
            rays?.outsideFrom(anchor.x, firstY, direction, 0, limit) ?? Infinity,
            rays?.outsideFrom(anchor.x, lastY, direction, 0, limit) ?? Infinity
        );
        const insideBand = (t: number) => {
            const x = anchor.x + direction * t;
            // OPTIMIZATION: a band usually leaves the shape at its edge rows, so those are tested first.
            if (!(t <= firstUntil || contains(x, firstY)) || !(t <= lastUntil || contains(x, lastY))) return false;
            if (holdsColumn?.(x, firstY, lastY) === true) return true;
            for (let i = 1; i < sampled - 1; i += 1) {
                if (middleUntil != null && t <= middleUntil[i]) continue;
                if (!contains(x, anchor.y + top + step * i)) return false;
            }
            return true;
        };
        return firstOutside(insideBand, limit, probes, steps, bandUntil, bandOutside);
    };
    const vertical = (direction: number) => {
        const until = rays?.insideUntil(anchor.x, anchor.y, 0, direction, limit) ?? -1;
        const outside = rays?.outsideFrom(anchor.x, anchor.y, 0, direction, limit) ?? Infinity;
        return firstOutside((t) => contains(anchor.x, anchor.y + direction * t), limit, probes, steps, until, outside);
    };
    return {
        // Wrapping asks for the same band once per candidate word, and each ask is a pair of outward
        // scans over a containment test, so the answer is memoised for the label's own short-lived region.
        spanAt: memoiseByBand((top, bottom) => [-reach(top, bottom, -1), reach(top, bottom, 1)]),
        extentAbove: vertical(-1),
        extentBelow: vertical(1),
    };
}

/** Where along a ray from `(x, y)` a containment test is known: passed up to `insideUntil`, failed from `outsideFrom` on. */
export interface RayBounds {
    insideUntil(x: number, y: number, dx: number, dy: number, limit: number): number;
    outsideFrom(x: number, y: number, dx: number, dy: number, limit: number): number;
    /** Whether a point between two that `insideUntil` vouches for is vouched for too. */
    readonly convex?: boolean;
}

// OPTIMIZATION: scratch for a reach's middle-row bounds, filled afresh by each reach before its probes read it.
let middleRowsUntil = new Float64Array(8);

// Scanned outward, then bisected within the step that crossed: a ray out of an annulus sector re-enters
// it beyond the hole, so bisecting the whole limit could land past the hole and carry the reach across it.
// The scan resolves a gap only as narrow as `limit / probes`, so a hole thinner than one step is still
// crossed — bounded sampling, not a guarantee.
// `inside` is taken as read up to `knownInside` and from `knownOutside` on, where a caller has vouched for it.
function firstOutside(
    inside: (t: number) => boolean,
    limit: number,
    probes: number,
    steps: number,
    knownInside = -1,
    knownOutside = Infinity
): number {
    const count = Math.max(1, probes);
    const step = limit / count;
    let lo = 0;
    let hi = limit;
    for (let i = 1; i <= count; i += 1) {
        const t = Math.min(i * step, limit);
        if (t > knownInside && (t >= knownOutside || !inside(t))) {
            hi = t;
            break;
        }
        lo = t;
    }
    if (lo >= limit) return limit;
    for (let i = 0; i < steps; i += 1) {
        const t = (lo + hi) / 2;
        if (t <= knownInside || (t < knownOutside && inside(t))) {
            lo = t;
        } else {
            hi = t;
        }
    }
    return lo;
}

/** Caches a region's `spanAt` by band, as wrapping asks for the same band once per candidate word. */
export function memoiseByBand(spanAt: (top: number, bottom: number) => readonly [number, number]) {
    // OPTIMIZATION: keyed by the two numbers rather than a string built from them, so a hit allocates nothing.
    const cache = new Map<number, Map<number, readonly [number, number]>>();
    return (top: number, bottom: number) => {
        let byBottom = cache.get(top);
        if (byBottom == null) {
            byBottom = new Map();
            cache.set(top, byBottom);
        }
        let span = byBottom.get(bottom);
        if (span == null) {
            span = spanAt(top, bottom);
            byBottom.set(bottom, span);
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
        spanAt: (top, bottom) => insetSpan(region, dx, dy, top, bottom),
        extentAbove: Math.max(0, region.extentAbove - dy),
        extentBelow: Math.max(0, region.extentBelow - dy),
    };
}

function insetSpan(region: FitRegion, dx: number, dy: number, top: number, bottom: number): readonly [number, number] {
    const [left, right] = region.spanAt(top - dy, bottom + dy);
    const mid = (left + right) / 2;
    return [Math.min(left + dx, mid), Math.max(right - dx, mid)];
}

/**
 * {@link insetFitRegion} as one reusable region, for a caller that insets afresh on every pass of a fit: each
 * band is worked out once per {@link reset}, in maps kept across resets, so a pass allocates no memo of its own.
 */
export class ReusableInsetRegion implements FitRegion {
    extentAbove = 0;
    extentBelow = 0;
    private region?: FitRegion;
    private dx = 0;
    private dy = 0;
    private readonly byTop = new Map<number, Map<number, readonly [number, number]>>();
    private readonly spare: Map<number, readonly [number, number]>[] = [];

    reset(region: FitRegion, dx: number, dy: number): this {
        this.release();
        this.region = region;
        this.dx = dx;
        this.dy = dy;
        this.extentAbove = Math.max(0, region.extentAbove - dy);
        this.extentBelow = Math.max(0, region.extentBelow - dy);
        return this;
    }

    /** Drops the region and the bands worked out for it, keeping only the emptied maps. */
    release() {
        for (const byBottom of this.byTop.values()) {
            byBottom.clear();
            this.spare.push(byBottom);
        }
        this.byTop.clear();
        this.region = undefined;
    }

    readonly spanAt = (top: number, bottom: number): readonly [number, number] => {
        let byBottom = this.byTop.get(top);
        if (byBottom == null) {
            byBottom = this.spare.pop() ?? new Map();
            this.byTop.set(top, byBottom);
        }
        let span = byBottom.get(bottom);
        if (span == null) {
            span = insetSpan(this.region!, this.dx, this.dy, top, bottom);
            byBottom.set(bottom, span);
        }
        return span;
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
