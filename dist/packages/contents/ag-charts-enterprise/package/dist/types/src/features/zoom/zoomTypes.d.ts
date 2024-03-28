import type { _ModuleSupport } from 'ag-charts-community';
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
