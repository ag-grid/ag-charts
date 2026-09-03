import type { PixelSize } from './types';

/**
 * Placement of a label relative to its anchor. The directional values (including the diagonal corners)
 * position the label outside the marker, offset in that direction; `inside` centres the label within
 * the marker, hiding or truncating it if it does not fit.
 */
export type AgChartLabelCollisionPlacement =
    | 'inside'
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';

/** Placement of a label relative to a bounded region (a range-area band, a range-bar rect). */
export type AgChartLabelRegionPlacement = 'inside' | 'outside';

/**
 * Rotation of a label rendered inside a bounded region (bar, waterfall, range-bar, range-area).
 * `horizontal` renders the label upright in the normal reading direction; the two `vertical`
 * variants rotate it a quarter-turn in opposite directions.
 */
export type AgChartLabelOrientation = 'horizontal' | 'vertical' | 'vertical-reversed';

/**
 * Where a bar-family label is placed relative to its bar segment.
 *
 * The `inside-*` and `outside-*` values offset the label along the value axis. The `beside-*` values
 * offset it perpendicular to the value axis, floating it to the side of the segment: `before`/`after`
 * choose the side (a column's left/right, a horizontal bar's above/below) and `start`/`center`/`end`
 * position it along the segment's length. `beside-*` is useful for tiny stacked segments with no room
 * to place a label along the value axis.
 */
export type AgBarSeriesLabelPlacement =
    | 'inside-center'
    | 'inside-start'
    | 'inside-end'
    | 'outside-start'
    | 'outside-end'
    | 'beside-before-start'
    | 'beside-before-center'
    | 'beside-before-end'
    | 'beside-after-start'
    | 'beside-after-center'
    | 'beside-after-end';

/**
 * Where a funnel or pyramid value label is placed relative to its bar or stage.
 *
 * `inside-*` places the label within the shape, `outside-*` clear of it. `before`/`after` run along
 * the category axis, perpendicular to the value axis: on a vertical funnel they are above and below
 * the bar, on a horizontal one to its left and right. A reversed category axis swaps them, so the
 * placement always follows the axis rather than the screen. The same physical direction is spelt
 * `beside-before-center` / `beside-after-center` in {@link AgBarSeriesLabelPlacement}.
 */
export type AgFunnelSeriesLabelPlacement =
    | 'inside-center'
    | 'inside-before'
    | 'inside-after'
    | 'outside-before'
    | 'outside-after';

/**
 * Where a cone funnel label is placed relative to its divider. Cone funnel labels are always drawn
 * clear of the divider itself, so placement combines two axes: `start`/`middle`/`end` choose the
 * side of the divider (`middle` sits on it), while `before`/`center`/`after` position the label along
 * its length.
 *
 * `before` and `after` follow text-alignment semantics and are direction-aware: where the divider spans
 * the horizontal axis, `before` is its left end in a left-to-right chart and its right end in a
 * right-to-left one. Where the divider spans the vertical axis, `before` is always its top end.
 *
 * `start` and `end` are direction-aware in the same way: where the divider spans the vertical axis,
 * `start` is its left side in a left-to-right chart and its right side in a right-to-left one.
 */
export type AgConeFunnelSeriesLabelPlacement =
    | 'start-before'
    | 'start-center'
    | 'start-after'
    | 'middle-before'
    | 'middle-center'
    | 'middle-after'
    | 'end-before'
    | 'end-center'
    | 'end-after';

/** @deprecated Use the `*-center` values of {@link AgConeFunnelSeriesLabelPlacement} instead. */
export type AgConeFunnelSeriesLabelPlacementAlias = 'before' | 'middle' | 'after';

/** Configuration controlling how a label behaves when it cannot be placed clear of every obstacle. */
export interface AgChartLabelCollisionOptions {
    /**
     * Collision threshold in pixels. A positive value triggers avoidance strategies when labels are further away, a negative value allows labels to overlap without triggering avoidance.
     */
    threshold?: PixelSize;
    /**
     * Whether to keep a colliding label visible when a collision remains after every avoidance strategy has been applied. When `true` the label stays at the best available position; when `false` it is hidden instead.
     */
    alwaysShow?: boolean;
}
