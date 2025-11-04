import type { AgZoomAnchorPoint, _ModuleSupport } from 'ag-charts-community';
import type { AxisID } from 'ag-charts-core';

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

export type AxisZoomStates = Record<
    AxisID,
    { direction: _ModuleSupport.ChartAxisDirection; zoom: _ModuleSupport.ZoomState }
>;

export interface ZoomProperties {
    anchorPointX: AgZoomAnchorPoint;
    anchorPointY: AgZoomAnchorPoint;
    enabled: boolean;
    independentAxes: boolean;
    isScalingX: boolean;
    isScalingY: boolean;
    keepAspectRatio: boolean;
    scrollingStep: number;
}
