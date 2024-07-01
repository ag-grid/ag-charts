import { _ModuleSupport } from 'ag-charts-community';
import type { DefinedZoomState, ZoomProperties } from './zoomTypes';
export declare class ZoomToolbar {
    private readonly toolbarManager;
    private readonly zoomManager;
    private readonly getResetZoom;
    private readonly updateZoom;
    private readonly updateAxisZoom;
    constructor(toolbarManager: _ModuleSupport.ToolbarManager, zoomManager: _ModuleSupport.ZoomManager, getResetZoom: () => DefinedZoomState, updateZoom: (zoom: DefinedZoomState) => void, updateAxisZoom: (axisId: string, direction: _ModuleSupport.ChartAxisDirection, partialZoom: _ModuleSupport.ZoomState | undefined) => void);
    toggle(enabled: boolean | undefined, zoom: DefinedZoomState, props: ZoomProperties): void;
    toggleButtons(zoom: DefinedZoomState, props: ZoomProperties): void;
    onButtonPress(event: _ModuleSupport.ToolbarButtonPressedEvent, props: ZoomProperties): void;
    private toggleGroups;
    private onButtonPressRanges;
    private onButtonPressZoom;
    private onButtonPressZoomAxis;
    private onButtonPressZoomUnified;
}