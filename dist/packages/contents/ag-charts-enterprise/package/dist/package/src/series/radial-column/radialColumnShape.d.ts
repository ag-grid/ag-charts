import { _Scene } from 'ag-charts-community';
declare const Path: typeof _Scene.Path;
export declare class RadialColumnShape extends Path {
    static className: string;
    readonly borderPath: _Scene.Path2D;
    isBeveled: boolean;
    columnWidth: number;
    startAngle: number;
    endAngle: number;
    outerRadius: number;
    innerRadius: number;
    axisInnerRadius: number;
    axisOuterRadius: number;
    private getRotation;
    updatePath(): void;
    private updateRectangularPath;
    private updateBeveledPath;
}
export declare function getRadialColumnWidth(startAngle: number, endAngle: number, axisOuterRadius: number, columnWidthRatio: number, maxColumnWidthRatio: number): number;
export {};
