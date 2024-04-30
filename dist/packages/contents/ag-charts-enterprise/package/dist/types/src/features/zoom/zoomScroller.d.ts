import type { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { DefinedZoomState, ZoomProperties } from './zoomTypes';
export declare class ZoomScroller {
    update(event: _ModuleSupport.PointerInteractionEvent<'wheel'>, props: ZoomProperties, bbox: _Scene.BBox, oldZoom: DefinedZoomState): DefinedZoomState;
    private scaleZoomToPointer;
}
