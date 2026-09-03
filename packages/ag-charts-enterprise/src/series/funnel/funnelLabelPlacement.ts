import type {
    AgConeFunnelSeriesLabelPlacement,
    AgConeFunnelSeriesLabelPlacementAlias,
    AgFunnelSeriesLabelPlacement,
    _ModuleSupport,
} from 'ag-charts-community';
import type { OrientationAnchor, TrapezoidBounds } from 'ag-charts-core';
import { toArray } from 'ag-charts-core';

type BarLabelPlacement = _ModuleSupport.BarLabelPlacement;

/**
 * Funnel and pyramid `before`/`after` run along the category axis, which is the axis bar's
 * `start`/`end` placements run along once the axis flags are transposed (see {@link funnelPlacementAxes}).
 */
export const FUNNEL_TO_BAR_PLACEMENT: Record<AgFunnelSeriesLabelPlacement, BarLabelPlacement> = {
    'inside-center': 'inside-center',
    'inside-before': 'inside-start',
    'inside-after': 'inside-end',
    'outside-before': 'outside-start',
    'outside-after': 'outside-end',
};

/**
 * A cone funnel divider spans the value axis and its `start`/`end` sides lie on the cross axis, which
 * is the normal bar convention: the side of the line maps onto `beside-*`, and the
 * `before`/`center`/`after` position along the line onto the bar's own `start`/`center`/`end`.
 */
export const CONE_FUNNEL_TO_BAR_PLACEMENT: Record<AgConeFunnelSeriesLabelPlacement, BarLabelPlacement> = {
    'middle-before': 'inside-start',
    'middle-center': 'inside-center',
    'middle-after': 'inside-end',
    'start-before': 'beside-before-start',
    'start-center': 'beside-before-center',
    'start-after': 'beside-before-end',
    'end-before': 'beside-after-start',
    'end-center': 'beside-after-center',
    'end-after': 'beside-after-end',
};

const CONE_FUNNEL_ALIASES: Record<AgConeFunnelSeriesLabelPlacementAlias, AgConeFunnelSeriesLabelPlacement> = {
    before: 'start-center',
    middle: 'middle-center',
    after: 'end-center',
};

/** Mirrors the side of a vertical divider, whose `start`/`end` sides lie on the horizontal axis. */
const CONE_FUNNEL_RTL_SIDE_SWAP: Record<AgConeFunnelSeriesLabelPlacement, AgConeFunnelSeriesLabelPlacement> = {
    'start-before': 'end-before',
    'start-center': 'end-center',
    'start-after': 'end-after',
    'middle-before': 'middle-before',
    'middle-center': 'middle-center',
    'middle-after': 'middle-after',
    'end-before': 'start-before',
    'end-center': 'start-center',
    'end-after': 'start-after',
};

/** Mirrors the position along a horizontal divider, whose `before`/`after` ends lie on the horizontal axis. */
const CONE_FUNNEL_RTL_SWAP: Record<AgConeFunnelSeriesLabelPlacement, AgConeFunnelSeriesLabelPlacement> = {
    'start-before': 'start-after',
    'start-after': 'start-before',
    'start-center': 'start-center',
    'middle-before': 'middle-after',
    'middle-after': 'middle-before',
    'middle-center': 'middle-center',
    'end-before': 'end-after',
    'end-after': 'end-before',
    'end-center': 'end-center',
};

/**
 * Axis flags placing a funnel or pyramid label along the **category** axis: transposing bar's
 * `isVertical` makes its `start`/`end` placements run perpendicular to the value axis, which is where
 * `before`/`after` live. `isUpward` then follows the category axis' direction, so a reversed axis swaps
 * the two sides.
 */
export function funnelPlacementAxes(barAlongX: boolean, categoryReversed: boolean) {
    return { isVertical: barAlongX, isUpward: barAlongX === categoryReversed };
}

/**
 * Axis flags placing a pyramid label along the axis its stages stack on, which always runs in the
 * direction of increasing datum index: downwards when vertical, rightwards when horizontal. `reverse`
 * only swaps which parallel edge of a stage is the wider one, so it does not enter here.
 */
export function pyramidPlacementAxes(horizontal: boolean) {
    return { isVertical: !horizontal, isUpward: horizontal };
}

/** The isosceles trapezoid a pyramid stage is drawn as, described along its stacking axis. */
export function pyramidStageTrapezoid(
    stage: { x: number; y: number; top: number; right: number; bottom: number; left: number },
    horizontal: boolean
): TrapezoidBounds {
    const { x, y, top, right, bottom, left } = stage;
    return horizontal
        ? { spanLo: x - top / 2, spanHi: x + top / 2, extentLo: left, extentHi: right, crossCentre: y, vertical: false }
        : {
              spanLo: y - left / 2,
              spanHi: y + left / 2,
              extentLo: top,
              extentHi: bottom,
              crossCentre: x,
              vertical: true,
          };
}

/**
 * The span band a pyramid label occupies once anchored, so the stage can be measured for width where the
 * text actually sits rather than across its whole height.
 */
export function pyramidLabelBand(
    trapezoid: TrapezoidBounds,
    anchor: OrientationAnchor,
    extent: number
): [number, number] {
    const position = trapezoid.vertical ? anchor.y : anchor.x;
    const alignment = trapezoid.vertical ? anchor.textBaseline : anchor.textAlign;
    if (alignment === 'top' || alignment === 'left') return [position, position + extent];
    if (alignment === 'bottom' || alignment === 'right') return [position - extent, position];
    return [position - extent / 2, position + extent / 2];
}

/** The inside/outside distinction the funnel and pyramid placement styles select on. */
export function toResolvedFunnelPlacement(placement: AgFunnelSeriesLabelPlacement): 'inside' | 'outside' {
    return placement.startsWith('inside') ? 'inside' : 'outside';
}

function dedupe<T>(values: T[], fallback: T): T[] {
    const unique = Array.from(new Set(values));
    return unique.length > 0 ? unique : [fallback];
}

/** The ordered placement list a funnel or pyramid label cascades through. */
export function resolveFunnelPlacements(
    placement: AgFunnelSeriesLabelPlacement | AgFunnelSeriesLabelPlacement[] | undefined,
    fallback: AgFunnelSeriesLabelPlacement
): AgFunnelSeriesLabelPlacement[] {
    return dedupe(toArray(placement), fallback);
}

/**
 * The ordered placement list a cone funnel label cascades through, with the deprecated single-word
 * aliases mapped onto their `*-center` equivalents. A right-to-left chart mirrors whichever half of a
 * placement runs along the horizontal axis: `before`/`after` for a horizontal divider, `start`/`end` for
 * a vertical one.
 */
export function resolveConeFunnelPlacements(
    placement:
        | AgConeFunnelSeriesLabelPlacement
        | AgConeFunnelSeriesLabelPlacementAlias
        | (AgConeFunnelSeriesLabelPlacement | AgConeFunnelSeriesLabelPlacementAlias)[]
        | undefined,
    fallback: AgConeFunnelSeriesLabelPlacement,
    barAlongX: boolean,
    isRtl: boolean
): AgConeFunnelSeriesLabelPlacement[] {
    let swap: Record<AgConeFunnelSeriesLabelPlacement, AgConeFunnelSeriesLabelPlacement> | undefined;
    if (isRtl) {
        swap = barAlongX ? CONE_FUNNEL_RTL_SWAP : CONE_FUNNEL_RTL_SIDE_SWAP;
    }
    const resolved = toArray(placement).map((value) => {
        const canonical = CONE_FUNNEL_ALIASES[value as AgConeFunnelSeriesLabelPlacementAlias] ?? value;
        return swap?.[canonical] ?? canonical;
    });
    return dedupe(resolved, fallback);
}
