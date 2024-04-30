import { AgZoomAnchorPoint, _ModuleSupport, _Scene } from 'ag-charts-community';
import type { DefinedZoomState } from './zoomTypes';
export declare const UNIT: {
    min: number;
    max: number;
};
export declare const DEFAULT_ANCHOR_POINT_X: AgZoomAnchorPoint;
export declare const DEFAULT_ANCHOR_POINT_Y: AgZoomAnchorPoint;
export declare function unitZoomState(): DefinedZoomState;
export declare function dx(zoom: DefinedZoomState): number;
export declare function dy(zoom: DefinedZoomState): number;
export declare function isZoomEqual(left: DefinedZoomState, right: DefinedZoomState, epsilon?: number): boolean;
export declare function isZoomLess(zoom: DefinedZoomState, minRatioX: number, minRatioY: number): boolean;
export declare function definedZoomState(zoom?: _ModuleSupport.AxisZoomState): DefinedZoomState;
/**
 * Calculate the position on the series rect as a ratio from the top left corner. Invert the ratio on the y-axis to
 * cater for conflicting direction between screen and chart axis systems. Constrains the point to the series
 * rect so the zoom is pinned to the edges if the point is over the legends, axes, etc.
 */
export declare function pointToRatio(bbox: _Scene.BBox, x: number, y: number): {
    x: number;
    y: number;
};
/**
 * Translate a zoom bounding box by shifting all points by the given x & y amounts.
 */
export declare function translateZoom(zoom: DefinedZoomState, x: number, y: number): DefinedZoomState;
/**
 * Scale a zoom bounding box from the top left corner.
 */
export declare function scaleZoom(zoom: DefinedZoomState, sx: number, sy: number): DefinedZoomState;
/**
 * Scale a zoom bounding box from the center.
 */
export declare function scaleZoomCenter(zoom: DefinedZoomState, sx: number, sy: number): DefinedZoomState;
/**
 * Scale a single zoom axis about its anchor.
 */
export declare function scaleZoomAxisWithAnchor(newState: _ModuleSupport.ZoomState, oldState: _ModuleSupport.ZoomState, anchor: AgZoomAnchorPoint, origin?: number): _ModuleSupport.ZoomState;
export declare function scaleZoomAxisWithPoint(newState: _ModuleSupport.ZoomState, oldState: _ModuleSupport.ZoomState, origin: number): {
    min: number;
    max: number;
};
export declare function multiplyZoom(zoom: DefinedZoomState, nx: number, ny: number): {
    x: {
        min: number;
        max: number;
    };
    y: {
        min: number;
        max: number;
    };
};
/**
 * Constrain a zoom bounding box such that no corner exceeds an edge while maintaining the same width and height.
 */
export declare function constrainZoom(zoom: DefinedZoomState): DefinedZoomState;
export declare function constrainAxisWithOld({ min, max }: {
    min: number;
    max: number;
}, old: {
    min: number;
    max: number;
}, minRatio: number): {
    min: number;
    max: number;
};
