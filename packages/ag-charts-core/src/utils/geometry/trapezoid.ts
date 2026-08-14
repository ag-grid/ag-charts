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

/** Axis-aligned bounding box of the trapezoid. */
export function trapezoidBox(t: TrapezoidBounds): BoxBounds {
    return toBox(t, t.spanLo, t.spanHi, Math.max(t.extentLo, t.extentHi));
}

/**
 * The largest axis-aligned rectangle inscribed in the trapezoid.
 *
 * A rectangle spanning `[t0, t1]` (normalised span positions) is limited by the narrowest
 * cross-section it covers, so the optimum always extends to the wide edge: `t1 = 1`. Maximising
 * `A(t0) = L(1 - t0)(eMin + (eMax - eMin)t0)` gives `t0* = (delta - eMin) / (2 * delta)`, which is
 * interior only while `eMax >= 2 * eMin`; otherwise the full span at `eMin` wins.
 */
export function trapezoidInscribedRect(t: TrapezoidBounds): BoxBounds {
    const length = t.spanHi - t.spanLo;
    const eMin = Math.min(t.extentLo, t.extentHi);
    const eMax = Math.max(t.extentLo, t.extentHi);
    if (length <= 0 || eMax <= 0) {
        return toBox(t, (t.spanLo + t.spanHi) / 2, (t.spanLo + t.spanHi) / 2, 0);
    }
    if (eMax < 2 * eMin) {
        return toBox(t, t.spanLo, t.spanHi, eMin);
    }
    const spanExtent = (length * eMax) / (2 * (eMax - eMin));
    return t.extentHi >= t.extentLo
        ? toBox(t, t.spanHi - spanExtent, t.spanHi, eMax / 2)
        : toBox(t, t.spanLo, t.spanLo + spanExtent, eMax / 2);
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

    const length = t.spanHi - t.spanLo;
    const widthAt = (s: number) => t.extentLo + ((t.extentHi - t.extentLo) * (s - t.spanLo)) / length;
    const crossExtent = length > 0 ? Math.max(widthAt(s0), widthAt(s1)) : Math.max(t.extentLo, t.extentHi);
    if (crossExtent <= 0) return false;

    const boxCrossLo = t.vertical ? box.x : box.y;
    const boxCrossHi = boxCrossLo + (t.vertical ? box.width : box.height);
    return boxCrossLo < t.crossCentre + crossExtent / 2 && boxCrossHi > t.crossCentre - crossExtent / 2;
}
