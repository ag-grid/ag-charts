import type { BoxBounds } from './boxBounds';

/**
 * An isosceles trapezoid described along its span axis: the two parallel edges sit at `spanLo` and
 * `spanHi` with cross-axis widths `extentLo` and `extentHi`, and every cross-section is centred on
 * `crossCentre`. `vertical` says the span axis is Y (so the cross axis is X).
 */
export interface TrapezoidBounds {
    spanLo: number;
    spanHi: number;
    extentLo: number;
    extentHi: number;
    crossCentre: number;
    vertical: boolean;
}

const toBox = (t: TrapezoidBounds, spanLo: number, spanHi: number, crossExtent: number): BoxBounds => {
    const crossLo = t.crossCentre - crossExtent / 2;
    return t.vertical
        ? { x: crossLo, y: spanLo, width: crossExtent, height: spanHi - spanLo }
        : { x: spanLo, y: crossLo, width: spanHi - spanLo, height: crossExtent };
};

const widthAt = (t: TrapezoidBounds, span: number) =>
    t.extentLo + ((t.extentHi - t.extentLo) * (span - t.spanLo)) / (t.spanHi - t.spanLo);

/** Axis-aligned bounding box of the trapezoid. */
export function trapezoidBox(t: TrapezoidBounds): BoxBounds {
    return toBox(t, t.spanLo, t.spanHi, Math.max(t.extentLo, t.extentHi));
}

/**
 * The cross-axis extent available across the span band `[bandLo, bandHi]`: the narrowest cross-section it
 * covers, which is at one of its two ends because width is linear in span. The band is clipped to the
 * trapezoid, so one overhanging an edge is measured only where the shape exists.
 */
export function trapezoidExtentAcross(t: TrapezoidBounds, bandLo: number, bandHi: number): number {
    if (t.spanHi <= t.spanLo) return Math.max(t.extentLo, t.extentHi);
    const lo = Math.max(t.spanLo, Math.min(bandLo, bandHi));
    const hi = Math.min(t.spanHi, Math.max(bandLo, bandHi));
    if (lo > hi) return 0;
    return Math.max(0, Math.min(widthAt(t, lo), widthAt(t, hi)));
}

/**
 * The trapezoid's full span, narrowed to the cross extent available across `[bandLo, bandHi]`. Anchoring
 * a label against this box keeps the placement the whole shape implies, while limiting its width to the
 * part of the shape the text actually occupies.
 */
export function trapezoidBandRect(t: TrapezoidBounds, bandLo: number, bandHi: number): BoxBounds {
    return toBox(t, t.spanLo, t.spanHi, trapezoidExtentAcross(t, bandLo, bandHi));
}

/**
 * Exact overlap test between the trapezoid and an axis-aligned box, without allocating. The widest
 * cross-section over the clipped span range contains every other one (width is linear in span and
 * all sections share a centre), so a single cross-axis range test settles it.
 */
export function trapezoidOverlapsBox(t: TrapezoidBounds, box: BoxBounds): boolean {
    const boxSpanLo = t.vertical ? box.y : box.x;
    const boxSpanHi = boxSpanLo + (t.vertical ? box.height : box.width);
    const s0 = Math.max(t.spanLo, boxSpanLo);
    const s1 = Math.min(t.spanHi, boxSpanHi);
    if (s0 >= s1) return false;

    const crossExtent =
        t.spanHi > t.spanLo ? Math.max(widthAt(t, s0), widthAt(t, s1)) : Math.max(t.extentLo, t.extentHi);
    if (crossExtent <= 0) return false;

    const boxCrossLo = t.vertical ? box.x : box.y;
    const boxCrossHi = boxCrossLo + (t.vertical ? box.width : box.height);
    return boxCrossLo < t.crossCentre + crossExtent / 2 && boxCrossHi > t.crossCentre - crossExtent / 2;
}
