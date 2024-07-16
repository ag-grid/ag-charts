import { BBox } from '../bbox';
import { SectorBox } from '../sectorBox';
import { Path } from './path';
export declare class Sector extends Path {
    static readonly className = "Sector";
    centerX: number;
    centerY: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    clipSector: SectorBox | undefined;
    concentricEdgeInset: number;
    radialEdgeInset: number;
    startOuterCornerRadius: number;
    endOuterCornerRadius: number;
    startInnerCornerRadius: number;
    endInnerCornerRadius: number;
    set inset(value: number);
    set cornerRadius(value: number);
    computeBBox(): BBox;
    private normalizedRadii;
    private normalizedClipSector;
    private getAngleOffset;
    private arc;
    updatePath(): void;
    isPointInPath(x: number, y: number): boolean;
}
