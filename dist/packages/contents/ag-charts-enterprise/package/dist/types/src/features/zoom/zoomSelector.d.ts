import type { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { ZoomRect } from './scenes/zoomRect';
import type { DefinedZoomState, ZoomProperties } from './zoomTypes';
export declare class ZoomSelector {
    private rect;
    private coords?;
    constructor(rect: ZoomRect);
    update(event: _ModuleSupport.PointerInteractionEvent<'drag' | 'hover'>, props: ZoomProperties, bbox?: _Scene.BBox, currentZoom?: _ModuleSupport.AxisZoomState): void;
    stop(innerBBox?: _Scene.BBox, bbox?: _Scene.BBox, currentZoom?: _ModuleSupport.AxisZoomState): DefinedZoomState;
    reset(): void;
    didUpdate(): boolean;
    private updateCoords;
    private updateRect;
    private createZoomFromCoords;
    private getNormalisedDimensions;
}
