import type { _Scene } from 'ag-charts-community';
import type { AxisZoomStates } from './zoomTypes';
export declare class ZoomScrollPanner {
    update(event: {
        deltaX: number;
    }, step: number, bbox: _Scene.BBox, zooms: AxisZoomStates): AxisZoomStates;
    private translateZooms;
}
