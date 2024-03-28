import { Path2D } from '../path2D';
import { Path } from './path';
export declare class RadialColumnShape extends Path {
    static readonly className = "RadialColumnShape";
    readonly borderPath: Path2D;
    isBeveled: boolean;
    columnWidth: number;
    startAngle: number;
    endAngle: number;
    outerRadius: number;
    innerRadius: number;
    axisInnerRadius: number;
    axisOuterRadius: number;
    isRadiusAxisReversed?: boolean;
    private getRotation;
    updatePath(): void;
    private updateRectangularPath;
    private updateBeveledPath;
}
export declare function getRadialColumnWidth(startAngle: number, endAngle: number, axisOuterRadius: number, columnWidthRatio: number, maxColumnWidthRatio: number): number;
