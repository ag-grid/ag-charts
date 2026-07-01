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
 * A single collision-resolution step. Only `reposition` is currently implemented; further strategies
 * (`rotate`, `wrap`, `shrink`, `truncate`) are reserved for later drops of the collision-avoidance model.
 */
export interface AgChartLabelRepositionStrategy {
    type: 'reposition';
    /** Ordered fallback placements, tried in turn until one fits; the label is dropped if none do. */
    placements?: AgChartLabelCollisionPlacement[];
}

export type AgChartLabelCollisionStrategy = AgChartLabelRepositionStrategy;

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
    /** Ordered collision-resolution strategies to apply. */
    strategy?: AgChartLabelCollisionStrategy[];
    /** Proximity threshold, in pixels, added to each obstacle before testing for overlap. */
    minSpacing?: PixelSize;
    /** Per-category configuration for the obstacles the label avoids. */
    collideWith?: AgChartLabelCollideWithOptions;
}
