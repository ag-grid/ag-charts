import { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { RadialColumnNodeDatum } from './radialColumnSeriesBase';
import { RadialColumnSeriesBase } from './radialColumnSeriesBase';
import { RadialColumnSeriesProperties } from './radialColumnSeriesProperties';
export declare class RadialColumnSeries extends RadialColumnSeriesBase<_Scene.RadialColumnShape> {
    static className: string;
    static type: "radial-column";
    properties: RadialColumnSeriesProperties<import("ag-charts-community").AgBaseRadialColumnSeriesOptions<any>>;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    protected getStackId(): string;
    protected nodeFactory(): _Scene.RadialColumnShape;
    protected getColumnTransitionFunctions(): {
        toFn: (node: _Scene.RadialColumnShape, datum: import("./radialColumnUtil").AnimatableRadialColumnDatum, status: _ModuleSupport.NodeUpdateState) => {
            innerRadius: number;
            outerRadius: number;
            columnWidth: number;
            axisInnerRadius: number;
            axisOuterRadius: number;
            startAngle: number;
            endAngle: number;
        };
        fromFn: (node: _Scene.RadialColumnShape, datum: import("./radialColumnUtil").AnimatableRadialColumnDatum, status: _ModuleSupport.NodeUpdateState) => {
            innerRadius: number;
            outerRadius: number;
            columnWidth: number;
            axisInnerRadius: number;
            axisOuterRadius: number;
            startAngle: number;
            endAngle: number;
            phase: "end" | "initial" | "update" | "trailing" | "remove" | "add";
        };
    };
    protected isRadiusAxisCircle(): boolean;
    protected updateItemPath(node: _Scene.RadialColumnShape, datum: RadialColumnNodeDatum, highlight: boolean): void;
    protected getColumnWidth(startAngle: number, endAngle: number): number;
}
