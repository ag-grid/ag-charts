import type { _Scene } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { AxisZoomStates } from './zoomTypes';
export interface ZoomPanUpdate {
    type: 'update';
    deltaX: number;
    deltaY: number;
}
export declare class ZoomPanner {
    deceleration: number;
    private onUpdate;
    private coords?;
    private coordsMonitorTimeout;
    private zoomCoordsHistoryIndex;
    private coordsHistory;
    private inertiaHandle;
    addListener(_type: 'update', fn: (e: ZoomPanUpdate) => void): () => void;
    stopInteractions(): void;
    update(event: _ModuleSupport.PointerInteractionEvent<'drag'>): void;
    start(): void;
    stop(): void;
    private recordCurrentZoomCoords;
    private animateInertia;
    private updateCoords;
    translateZooms(bbox: _Scene.BBox, currentZooms: AxisZoomStates, deltaX: number, deltaY: number): AxisZoomStates;
}
