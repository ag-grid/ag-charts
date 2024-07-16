import type { AgAngleAxisLabelOrientation, _Scale } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
export interface AngleAxisLabelDatum {
    text: string;
    x: number;
    y: number;
    hidden: boolean;
    rotation: number;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    box: _Scene.BBox | undefined;
}
interface AngleAxisTickDatum<TDatum> {
    value: TDatum;
    visible: boolean;
}
declare class AngleAxisLabel extends _ModuleSupport.AxisLabel {
    orientation: AgAngleAxisLabelOrientation;
}
export declare abstract class AngleAxis<TDomain, TScale extends _Scale.Scale<TDomain, any>> extends _ModuleSupport.PolarAxis<TScale> {
    startAngle: number;
    endAngle: number | undefined;
    protected labelData: AngleAxisLabelDatum[];
    protected tickData: AngleAxisTickDatum<TDomain>[];
    protected radiusLine: _Scene.Path;
    constructor(moduleCtx: _ModuleSupport.ModuleContext, scale: TScale);
    get direction(): _ModuleSupport.ChartAxisDirection;
    protected assignCrossLineArrayConstructor(crossLines: _ModuleSupport.CrossLine[]): void;
    protected createLabel(): AngleAxisLabel;
    update(): number;
    computeRange: () => void;
    protected calculateAvailableRange(): number;
    protected abstract generateAngleTicks(): AngleAxisTickDatum<TDomain>[];
    updatePosition(): void;
    protected updateRadiusLine(): void;
    getAxisLinePoints(): {
        points: ({
            x: number;
            y: number;
            moveTo: boolean;
            radius?: undefined;
            startAngle?: undefined;
            endAngle?: undefined;
            arc?: undefined;
        } | {
            x: number;
            y: number;
            radius: number;
            startAngle: number;
            endAngle: number;
            arc: boolean;
            moveTo: boolean;
        })[];
        closePath: boolean;
    };
    protected updateGridLines(): void;
    protected updateLabels(): void;
    protected updateTickLines(): void;
    protected createLabelNodeData(ticks: any[], options: {
        hideWhenNecessary: boolean;
    }, seriesRect: _Scene.BBox): AngleAxisLabelDatum[];
    protected abstract avoidLabelCollisions(labelData: AngleAxisLabelDatum[]): void;
    computeLabelsBBox(options: {
        hideWhenNecessary: boolean;
    }, seriesRect: _Scene.BBox): _Scene.BBox | null;
    protected getLabelOrientation(): AgAngleAxisLabelOrientation;
    protected getLabelRotation(tickAngle: number): number;
    protected getLabelAlign(tickAngle: number): {
        textAlign: "center" | "left" | "right";
        textBaseline: "bottom" | "middle" | "top";
    };
    protected updateCrossLines(): void;
}
export {};
