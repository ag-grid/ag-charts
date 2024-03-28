import type { Scale } from '../../../scale/scale';
import type { Position } from './geojson';
type XY = [x: number, y: number];
export declare class MercatorScale implements Scale<Position, XY> {
    readonly domain: Position[];
    readonly range: XY[];
    scale: number;
    originX: number;
    originY: number;
    static fixedScale(scale?: number): any;
    constructor(domain: Position[], range: XY[]);
    convert([lon, lat]: Position): XY;
}
export {};
