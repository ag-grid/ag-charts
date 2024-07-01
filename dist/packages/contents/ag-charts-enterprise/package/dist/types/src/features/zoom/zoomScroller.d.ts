import { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { AxisZoomStates, DefinedZoomState, ZoomProperties } from './zoomTypes';
export declare class ZoomScroller {
    updateAxes(event: _ModuleSupport.PointerInteractionEvent<'wheel'>, props: ZoomProperties, bbox: _Scene.BBox, zooms: AxisZoomStates): AxisZoomStates;
    update(event: _ModuleSupport.PointerInteractionEvent<'wheel'>, props: ZoomProperties, bbox: _Scene.BBox, oldZoom: DefinedZoomState): DefinedZoomState;
    updateDelta(delta: number, props: ZoomProperties, oldZoom: DefinedZoomState): DefinedZoomState;
}
