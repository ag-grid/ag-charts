import { _ModuleSupport } from 'ag-charts-community';
import type { RadialColumnNodeDatum } from './radialColumnSeriesBase';
import { RadialColumnSeriesBase } from './radialColumnSeriesBase';
import { RadialColumnShape } from './radialColumnShape';
export declare class RadialColumnSeries extends RadialColumnSeriesBase<RadialColumnShape> {
    static className: string;
    static type: "radial-column";
    columnWidthRatio?: number;
    maxColumnWidthRatio?: number;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    protected getStackId(): string;
    protected nodeFactory(): RadialColumnShape;
    protected getColumnTransitionFunctions(): {
        toFn: (node: RadialColumnShape, datum: import("./radialColumnUtil").AnimatableRadialColumnDatum, status: _ModuleSupport.NodeUpdateState) => {
            innerRadius: number;
            outerRadius: number;
            columnWidth: number;
            axisInnerRadius: number;
            axisOuterRadius: number;
            startAngle: number;
            endAngle: number;
        };
        fromFn: (node: RadialColumnShape, datum: import("./radialColumnUtil").AnimatableRadialColumnDatum, status: _ModuleSupport.NodeUpdateState) => {
            animationDuration: number;
            animationDelay: number;
            innerRadius: number;
            outerRadius: number;
            columnWidth: number;
            axisInnerRadius: number;
            axisOuterRadius: number;
            startAngle: number;
            endAngle: number;
        };
    };
    protected isRadiusAxisCircle(): boolean;
    protected updateItemPath(node: RadialColumnShape, datum: RadialColumnNodeDatum, highlight: boolean): void;
    protected getColumnWidth(startAngle: number, endAngle: number): number;
}
