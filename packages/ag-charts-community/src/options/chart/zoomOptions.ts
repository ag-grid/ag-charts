export type AgZoomAnchorPoint = 'pointer' | 'start' | 'end';
export type AgZoomAxes = 'x' | 'y' | 'xy';
export type AgZoomPanKey = 'alt' | 'ctrl' | 'meta' | 'shift';

export interface AgZoomOptions {
    /** The anchor point about which to zoom into when scrolling, defaults to `end`. */
    anchorPoint?: AgZoomAnchorPoint;
    /** The axes on which to zoom, one of 'xy', 'x', or 'y'. */
    axes?: AgZoomAxes;
    /** Set to true to enable the zoom module. */
    enabled?: boolean;
    /** Set to true to enable dragging an axis to zoom series attached to that axis, defaults to true. */
    enableAxisDragging?: boolean;
    /** Set to true to enable panning while zoomed, defaults to true. */
    enablePanning?: boolean;
    /** Set to true to enable zooming with the mouse wheel, defaults to true. */
    enableScrolling?: boolean;
    /** Set to true to enable selecting an area of the chart to zoom into, defaults to false. */
    enableSelecting?: boolean;
    /** The minimum amount of the chart to show in the x-axis as a ratio of the full chart, defaults to `0.2`. */
    minXRatio?: number;
    /** The minimum amount of the chart to show in the y-axis as a ratio of the full chart, defaults to `0.2`. */
    minYRatio?: number;
    /** The key that should be pressed to allow dragging to pan around while zoomed, one of `alt`, `ctrl`, `meta` or `shift, defaults to `alt`. */
    panKey?: AgZoomPanKey;
    /** The amount to zoom when scrolling with the mouse wheel, as a ratio of the full chart, defaults to `0.1`. */
    scrollingStep?: number;
}
