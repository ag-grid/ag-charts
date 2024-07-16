import type { AgZoomAnchorPoint, _ModuleSupport } from 'ag-charts-community';
import type { ZoomRange } from './zoomRange';
export interface DefinedZoomState extends _ModuleSupport.AxisZoomState {
    x: _ModuleSupport.ZoomState;
    y: _ModuleSupport.ZoomState;
}
export type ZoomCoords = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
};
export type AxisZoomStates = Record<string, {
    direction: _ModuleSupport.ChartAxisDirection;
    zoom: _ModuleSupport.ZoomState | undefined;
}>;
export interface ZoomProperties {
    anchorPointX: AgZoomAnchorPoint;
    anchorPointY: AgZoomAnchorPoint;
    enabled: boolean;
    isScalingX: boolean;
    isScalingY: boolean;
    minRatioX: number;
    minRatioY: number;
    rangeX: ZoomRange;
    scrollingStep: number;
}
