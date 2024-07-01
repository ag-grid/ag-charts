import { BBox } from '../bbox';
import { Path } from './path';
export declare class RadialColumnShape extends Path {
    static readonly className = "RadialColumnShape";
    isBeveled: boolean;
    columnWidth: number;
    startAngle: number;
    endAngle: number;
    outerRadius: number;
    innerRadius: number;
    axisInnerRadius: number;
    axisOuterRadius: number;
    isRadiusAxisReversed?: boolean;
    set cornerRadius(_value: number);
    computeBBox(): BBox;
    private getRotation;
    updatePath(): void;
    private updateRectangularPath;
    private updateBeveledPath;
}
export declare function getRadialColumnWidth(startAngle: number, endAngle: number, axisOuterRadius: number, columnWidthRatio: number, maxColumnWidthRatio: number): number;
