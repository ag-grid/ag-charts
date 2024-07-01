import { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { Coords } from './annotationTypes';
declare const BaseModuleInstance: typeof _ModuleSupport.BaseModuleInstance;
export declare const DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS = "ag-charts-annotations__axis-button";
export declare class AxisButton extends BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    private readonly ctx;
    private readonly axisCtx;
    private readonly onButtonClick;
    private seriesRect;
    enabled: boolean;
    private readonly button;
    private readonly wrapper;
    private readonly snap;
    private padding;
    private coords?;
    constructor(ctx: _ModuleSupport.ModuleContext, axisCtx: _ModuleSupport.AxisContext, onButtonClick: (coords?: Coords) => void, seriesRect: _Scene.BBox);
    update(seriesRect: _Scene.BBox, padding: number): void;
    private setup;
    private destroyElements;
    private onMouseMove;
    private onLeave;
    private getButtonCoordinates;
    private getAxisCoordinates;
    private toggleVisibility;
    private toggleClass;
    private updatePosition;
    private updateButtonElement;
}
export {};
