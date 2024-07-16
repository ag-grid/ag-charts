import { Interpolating, interpolate } from '../util/interpolating';
export declare class SectorBox implements Interpolating<SectorBox> {
    startAngle: number;
    endAngle: number;
    innerRadius: number;
    outerRadius: number;
    constructor(startAngle: number, endAngle: number, innerRadius: number, outerRadius: number);
    clone(): SectorBox;
    [interpolate](other: SectorBox, d: number): SectorBox;
}
