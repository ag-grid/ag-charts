import type { AgZoomAnchorPoint, _ModuleSupport, _Scene } from 'ag-charts-community';
import type { DefinedZoomState } from './zoomTypes';
export declare class ZoomScroller {
    update(event: _ModuleSupport.InteractionEvent<'wheel'>, step: number, anchorPointX: AgZoomAnchorPoint, anchorPointY: AgZoomAnchorPoint, isScalingX: boolean, isScalingY: boolean, bbox: _Scene.BBox, currentZoom?: _ModuleSupport.AxisZoomState): DefinedZoomState;
    private scaleZoomToPointer;
}
