import type { _Scene } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { AxisZoomStates } from './zoomTypes';
export declare class ZoomPanner {
    private coords?;
    update(event: _ModuleSupport.InteractionEvent<'drag'>, bbox: _Scene.BBox, zooms: AxisZoomStates): AxisZoomStates;
    stop(): void;
    private updateCoords;
    private translateZooms;
}
