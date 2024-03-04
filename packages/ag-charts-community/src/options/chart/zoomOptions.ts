import type { Ratio } from './types';

export type AgZoomAnchorPoint = 'pointer' | 'start' | 'middle' | 'end';
export type AgZoomAxes = 'x' | 'y' | 'xy';
export type AgZoomPanKey = 'alt' | 'ctrl' | 'meta' | 'shift';

export interface AgZoomRange {
    /** The start of the axis zoom range. */
    start?: Date | number;
    /** The end of the axis zoom range. */
    end?: Date | number;
}

export interface AgZoomRatio {
    /** The minimum value of the axis zoom ratio. */
    min?: number;
    /** The maximum value of the axis zoom ratio. */
    max?: number;
}

export interface AgZoomOptions {
    /**
     * The anchor point for the x-axis about which to zoom into when scrolling.
     * Default: `end`
     */
    anchorPointX?: AgZoomAnchorPoint;
    /**
     * The anchor point for the y-axis about which to zoom into when scrolling.
     * Default: `middle`
     */
    anchorPointY?: AgZoomAnchorPoint;
    /**
     * The axes on which to zoom, one of `xy`, `x`, or `y`.
     * Default: `x`
     */
    axes?: AgZoomAxes;
    /**
     *  Set to `true` to enable the zoom module.
     * Default: `false`
     */
    enabled?: boolean;
    /**
     * Set to `true` to enable dragging an axis to zoom series attached to that axis.
     * Default: `true`
     */
    enableAxisDragging?: boolean;
    /**
     * Set to `true` to enable double-clicking to reset the chart to fully zoomed out.
     * Default: `true`
     */
    enableDoubleClickToReset?: boolean;
    /**
     * Set to `true` to enable panning while zoomed.
     * Default: `true`
     */
    enablePanning?: boolean;
    /**
     * Set to `true` to enable zooming with the mouse wheel.
     * Default: `true`
     */
    enableScrolling?: boolean;
    /**
     * Set to `true` to enable selecting an area of the chart to zoom into.
     * Default: `false`
     */
    enableSelecting?: boolean;
    /**
     * The minimum number of x-axis items to be shown, beyond which zooming is stopped.
     * Default: `2`
     */
    minVisibleItemsX?: number;
    /**
     * The minimum number of y-axis items to be shown, beyond which zooming is stopped.
     * Default: `2`
     */
    minVisibleItemsY?: number;
    /**
     * @deprecated v9.2.0 Use `ratioX.min` instead.
     * The initial minimum x-axis position of the zoom, as a ratio of the full chart.
     * Default: `0`
     */
    minX?: number;
    /**
     * @deprecated v9.2.0 Use `ratioX.max` instead.
     * The initial maximum x-axis position of the zoom, as a ratio of the full chart.
     * Default: `1`
     */
    maxX?: number;
    /**
     * @deprecated v9.2.0 Use `ratioY.min` instead.
     * The initial minimum y-axis position of the zoom, as a ratio of the full chart.
     * Default: `0`
     */
    minY?: number;
    /**
     * @deprecated v9.2.0 Use `ratioY.max` instead.
     * The initial maximum y-axis position of the zoom, as a ratio of the full chart.
     * Default: `1`
     */
    maxY?: number;
    /**
     * The key that should be pressed to allow dragging to pan around while zoomed, one of `alt`, `ctrl`, `meta` or `shift`.
     * Default: `alt`
     */
    panKey?: AgZoomPanKey;
    /** The initial x-axis range of the zoom, as values of the axis type. */
    rangeX?: AgZoomRange;
    /** The initial y-axis range of the zoom, as values of the axis type. */
    rangeY?: AgZoomRange;
    /** The initial x-axis range of the zoom, as a ratio between 0 to 1. */
    ratioX?: AgZoomRatio;
    /** The initial y-axis range of the zoom, as a ratio between 0 to 1. */
    ratioY?: AgZoomRatio;
    /**
     * The amount to zoom when scrolling with the mouse wheel, as a ratio of the full chart.
     * Default: `0.1`
     */
    scrollingStep?: Ratio;
}
