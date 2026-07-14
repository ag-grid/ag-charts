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

/**
 * Rotation of a label rendered inside a bounded region (bar, waterfall, range-bar, range-area).
 * `horizontal` renders the label upright in the normal reading direction; the two `vertical`
 * variants rotate it a quarter-turn in opposite directions.
 */
export type AgChartLabelOrientation = 'horizontal' | 'vertical' | 'vertical-reversed';

/** Where a bar-family label is placed relative to its bar segment. */
export type AgBarSeriesLabelPlacement =
    | 'inside-center'
    | 'inside-start'
    | 'inside-end'
    | 'outside-start'
    | 'outside-end';

/** Avoidance configuration for a single category of obstacle. */
export interface AgChartLabelCollideWithCategoryOptions {
    /** Whether labels avoid this category of obstacle. */
    enabled?: boolean;
    /** Extra spacing, in pixels, kept between the label and this category of obstacle. */
    minSpacing?: PixelSize;
}

/** Per-category configuration for the obstacles a label avoids. */
export interface AgChartLabelCollideWithOptions {
    /** Avoidance of series markers. */
    markers?: AgChartLabelCollideWithCategoryOptions;
    /** Avoidance of other labels. */
    labels?: AgChartLabelCollideWithCategoryOptions;
    /** Avoidance of rendered series geometry contributed by other series, such as bars. */
    seriesItems?: AgChartLabelCollideWithCategoryOptions;
}

/** Configuration controlling how a label is repositioned or dropped to avoid overlapping obstacles. */
export interface AgChartLabelCollisionAvoidanceOptions {
    /** Whether collision avoidance runs for this label. */
    enabled?: boolean;
    /** Proximity threshold, in pixels, added to each obstacle before testing for overlap. */
    minSpacing?: PixelSize;
    /** Per-category configuration for the obstacles the label avoids. */
    collideWith?: AgChartLabelCollideWithOptions;
}
