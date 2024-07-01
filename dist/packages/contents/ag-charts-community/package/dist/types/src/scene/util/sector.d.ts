import { BBox } from '../bbox';
interface SectorBoundaries {
    startAngle: number;
    endAngle: number;
    innerRadius: number;
    outerRadius: number;
}
export declare function sectorBox({ startAngle, endAngle, innerRadius, outerRadius }: SectorBoundaries): BBox;
export declare function isPointInSector(x: number, y: number, sector: SectorBoundaries): boolean;
export declare function boxCollidesSector(box: BBox, sector: SectorBoundaries): number;
export declare function radiiScalingFactor(r: number, sweep: number, a: number, b: number): number;
export declare function clockwiseAngle(angle: number, relativeToStartAngle: number): number;
export declare function clockwiseAngles(startAngle: number, endAngle: number, relativeToStartAngle?: number): {
    startAngle: number;
    endAngle: number;
};
export declare function arcRadialLineIntersectionAngle(cx: number, cy: number, r: number, startAngle: number, endAngle: number, clipAngle: number): number | undefined;
export declare function arcCircleIntersectionAngle(cx: number, cy: number, r: number, startAngle: number, endAngle: number, circleR: number): number | undefined;
export {};
