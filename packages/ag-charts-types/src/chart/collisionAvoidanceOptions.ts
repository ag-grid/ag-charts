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

/** Per-category toggle for the obstacles a label avoids. */
export interface AgChartLabelCollideWithOptions {
    /** Whether labels avoid series markers. */
    markers?: boolean;
    /** Whether labels avoid other labels. */
    labels?: boolean;
    /** Whether labels avoid rendered series geometry contributed by other series, such as bars. */
    seriesItems?: boolean;
    /** Whether labels must stay inside the series plotting area, treating an overflow past it as a collision. */
    seriesArea?: boolean;
}

/** Configuration controlling how a label behaves when it cannot be placed clear of every obstacle. */
export interface AgChartLabelCollisionOptions {
    /**
     * Collision threshold in pixels. A positive value triggers avoidance strategies when labels are further away, a negative value allows labels to overlap without triggering avoidance.
     *
     * Default: `0`
     */
    threshold?: PixelSize;
    /**
     * Whether to keep a colliding label visible when a collision remains after every avoidance strategy has been applied. When `true` the label stays at the best available position; when `false` it is hidden instead.
     */
    alwaysShow?: boolean;
    // Undocumented: per-category toggle for the obstacles the label avoids. Accepted at runtime via
    // the `collideWith` validator but kept off the public type contract.
    // collideWith?: AgChartLabelCollideWithOptions;
}
