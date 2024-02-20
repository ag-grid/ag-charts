import type { _Scene } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
export type Zooms = ReturnType<_ModuleSupport.ZoomManager['getAxisZooms']>;
export declare class ZoomPanner {
    isPanning: boolean;
    private dragCoords?;
    private hscrollCoords;
    updateDrag(event: _ModuleSupport.InteractionEvent<'drag'>, bbox: _Scene.BBox, zooms: Zooms): Zooms;
    updateHScroll(deltaX: number, bbox: _Scene.BBox, zooms: Zooms): Zooms;
    stop(): void;
    private translateZooms;
}
