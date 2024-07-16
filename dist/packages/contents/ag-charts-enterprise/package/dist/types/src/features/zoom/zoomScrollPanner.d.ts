import type { _Scene } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { AxisZoomStates } from './zoomTypes';
export declare class ZoomScrollPanner {
    update(event: _ModuleSupport.PointerInteractionEvent<'wheel'>, step: number, bbox: _Scene.BBox, zooms: AxisZoomStates): AxisZoomStates;
    private translateZooms;
}
