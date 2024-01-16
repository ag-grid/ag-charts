import type { _Scene } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
export declare class ZoomPanner {
    isPanning: boolean;
    private coords?;
    update(event: _ModuleSupport.InteractionEvent<'drag'>, bbox: _Scene.BBox, zooms: Record<string, {
        direction: _ModuleSupport.ChartAxisDirection;
        zoom: _ModuleSupport.ZoomState | undefined;
    }>): Record<string, {
        direction: _ModuleSupport.ChartAxisDirection;
        zoom: _ModuleSupport.ZoomState;
    }>;
    stop(): void;
    private updateCoords;
    private translateZooms;
}
