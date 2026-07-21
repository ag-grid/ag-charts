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

/** Per-category toggle for the obstacles a label avoids. */
export interface AgChartLabelCollideWithOptions {
    /** Whether labels avoid series markers. */
    markers?: boolean;
    /** Whether labels avoid other labels. */
    labels?: boolean;
    /** Whether labels avoid rendered series geometry contributed by other series, such as bars. */
    seriesItems?: boolean;
}

/** Configuration controlling how a label behaves when it cannot be placed clear of every obstacle. */
export interface AgChartLabelCollisionOptions {
    /**
     * Collision-detection threshold, in pixels, applied to the label's own collision box before it is
     * tested against obstacles. `0` (the default) is a no-op; a positive value grows the box so labels
     * keep more clearance; a negative value shrinks it so labels tolerate overlap up to `|threshold|` px.
     */
    threshold?: PixelSize;
    /**
     * Whether to keep a label visible when no placement clears every obstacle. When `true` the label
     * stays at its least-overflowing placement; when `false` it is hidden instead.
     */
    suppressHide?: boolean;
    // Undocumented: per-category toggle for the obstacles the label avoids. Accepted at runtime via
    // the `collideWith` validator but kept off the public type contract.
    // collideWith?: AgChartLabelCollideWithOptions;
}
