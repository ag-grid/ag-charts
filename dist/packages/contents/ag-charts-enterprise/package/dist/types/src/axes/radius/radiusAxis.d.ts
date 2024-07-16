import type { _Scale } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
declare class RadiusAxisTick extends _ModuleSupport.AxisTick<_Scale.LinearScale, number> {
    minSpacing: number;
    maxSpacing: number;
}
declare class RadiusAxisLabel extends _ModuleSupport.AxisLabel {
    autoRotate?: boolean;
    autoRotateAngle: number;
}
export declare abstract class RadiusAxis extends _ModuleSupport.PolarAxis {
    positionAngle: number;
    protected readonly gridPathGroup: _Scene.Group;
    protected gridPathSelection: _Scene.Selection<_Scene.Path, any>;
    constructor(moduleCtx: _ModuleSupport.ModuleContext, scale: _Scale.Scale<any, any>);
    get direction(): _ModuleSupport.ChartAxisDirection;
    protected assignCrossLineArrayConstructor(crossLines: _ModuleSupport.CrossLine[]): void;
    protected getAxisTransform(): {
        translationX: number;
        translationY: number;
        rotation: number;
        rotationCenterX: number;
        rotationCenterY: number;
    };
    protected abstract prepareTickData(tickData: _ModuleSupport.TickDatum[]): _ModuleSupport.TickDatum[];
    protected abstract getTickRadius(tickDatum: _ModuleSupport.TickDatum): number;
    protected updateSelections(lineData: _ModuleSupport.AxisLineDatum, data: _ModuleSupport.TickDatum[], params: {
        combinedRotation: number;
        textBaseline: CanvasTextBaseline;
        textAlign: CanvasTextAlign;
        range: number[];
    }): void;
    protected updateTitle(): void;
    protected createTick(): RadiusAxisTick;
    protected updateCrossLines(): void;
    protected createLabel(): RadiusAxisLabel;
}
export {};
