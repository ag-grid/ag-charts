import type { PixelSize } from './types';

/**
 * Placement of a label relative to its anchor, including the diagonal corners.
 */
export type AgChartLabelCollisionPlacement =
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';

/**
 * Rotation of a label relative to the shape it is rendered inside, for series whose label occupies a
 * bounded region (bar, waterfall, range-bar, range-area). Independent of the series' own
 * horizontal/vertical `direction`: `parallel` runs along the shape's length, while the two
 * `perpendicular` variants run across it, reading in opposite directions.
 */
export type AgChartLabelOrientation = 'parallel' | 'perpendicular' | 'perpendicular-reversed';

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
