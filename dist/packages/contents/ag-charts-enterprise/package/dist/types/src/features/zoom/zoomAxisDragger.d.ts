import type { AgZoomAnchorPoint, _Scene } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
export declare class ZoomAxisDragger {
    private coords?;
    private oldZoom?;
    update(event: _ModuleSupport.PointerInteractionEvent<'drag'>, direction: _ModuleSupport.ChartAxisDirection, anchor: AgZoomAnchorPoint, bbox: _Scene.BBox, zoom?: _ModuleSupport.AxisZoomState, axisZoom?: _ModuleSupport.ZoomState): _ModuleSupport.ZoomState;
    stop(): void;
    private updateCoords;
    private updateZoom;
}
