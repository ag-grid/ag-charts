import type { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { DefinedZoomState, ZoomProperties } from './zoomTypes';
export declare class ZoomContextMenu {
    private readonly contextMenuRegistry;
    private readonly zoomManager;
    private readonly updateZoom;
    rect?: _Scene.BBox;
    constructor(contextMenuRegistry: _ModuleSupport.ContextMenuRegistry, zoomManager: _ModuleSupport.ZoomManager, updateZoom: (zoom: DefinedZoomState) => void);
    registerActions(enabled: boolean | undefined, zoom: DefinedZoomState, props: ZoomProperties): void;
    toggleActions(zoom: DefinedZoomState, props: ZoomProperties): void;
    private onZoomToHere;
    private onPanToHere;
}
