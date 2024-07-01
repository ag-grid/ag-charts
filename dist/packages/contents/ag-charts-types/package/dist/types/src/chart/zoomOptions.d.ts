import type { AgToolbarZoomGroup } from './toolbarOptions';
import type { Ratio } from './types';
export type AgZoomAnchorPoint = 'pointer' | 'start' | 'middle' | 'end';
export type AgZoomAxes = 'x' | 'y' | 'xy';
export type AgZoomPanKey = 'alt' | 'ctrl' | 'meta' | 'shift';
export type AgZoomDeceleration = 'off' | 'short' | 'long' | Ratio;
export interface AgZoomRange {
    /** The start of the axis zoom range. */
    start?: Date | number;
    /** The end of the axis zoom range. */
    end?: Date | number;
}
export interface AgZoomRatio {
    /** The minimum value of the axis zoom ratio.
     *  Default: `0`
     */
    start?: number;
    /** The maximum value of the axis zoom ratio.
     *  Default: `1`
     */
    end?: number;
}
export interface AgZoomButtons extends Omit<AgToolbarZoomGroup, 'align' | 'position'> {
}
export interface AgZoomOptions {
    /**
     * The anchor point for the x-axis about which to zoom into when scrolling.
     *
     * Default: `end`
     */
    anchorPointX?: AgZoomAnchorPoint;
    /**
     * The anchor point for the y-axis about which to zoom into when scrolling.
     *
     * Default: `middle`
     */
    anchorPointY?: AgZoomAnchorPoint;
    /**
     * The axes on which to zoom when scrolling, one of `xy`, `x`, or `y`.
     *
     * Default: `x`
     */
    axes?: AgZoomAxes;
    /** A set of buttons to perform common zoom actions. */
    buttons?: AgZoomButtons;
    /**
     * Rate of deceleration of panning when dragging and releasing a zoomed chart.
     *
     * Default: `short`
     */
    deceleration?: AgZoomDeceleration;
    /**
     * Set to `true` to enable the zoom module.
     *
     * Default: `false`
     */
    enabled?: boolean;
    /**
     * Set to `true` to enable dragging an axis to zoom series attached to that axis.
     *
     * Default: `true`
     */
    enableAxisDragging?: boolean;
    /**
     * Set to `true` to enable double-clicking to reset the chart to fully zoomed out.
     *
     * Default: `true`
     */
    enableDoubleClickToReset?: boolean;
    /**
     * Set to `true` to enable panning while zoomed.
     *
     * Default: `true`
     */
    enablePanning?: boolean;
    /**
     * Set to `true` to enable zooming with the mouse wheel.
     *
     * Default: `true`
     */
    enableScrolling?: boolean;
    /**
     * Set to `true` to enable selecting an area of the chart to zoom into.
     *
     * Default: `false`
     */
    enableSelecting?: boolean;
    /**
     * The minimum number of x-axis items to be shown, beyond which zooming is stopped.
     *
     * Default: `2`
     */
    minVisibleItemsX?: number;
    /**
     * The minimum number of y-axis items to be shown, beyond which zooming is stopped.
     *
     * Default: `2`
     */
    minVisibleItemsY?: number;
    /**
     * The key that should be pressed to allow dragging to pan around while zoomed, one of `alt`, `ctrl`, `meta` or `shift`.
     *
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
     *
     * Default: `0.1`
     */
    scrollingStep?: Ratio;
}
