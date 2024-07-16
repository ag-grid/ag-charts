import type { Scale } from '../../../scale/scale';
import { BBox } from '../../../scene/bbox';
import type { Position } from './geojson';
type XY = [x: number, y: number];
export declare class MercatorScale implements Scale<Position, XY> {
    readonly domain: Position[];
    readonly range: XY[];
    readonly type = "mercator";
    readonly bounds: BBox;
    static bounds(domain: Position[]): BBox;
    static fixedScale(): MercatorScale;
    constructor(domain: Position[], range: XY[]);
    convert([lon, lat]: Position): XY;
    invert([x, y]: XY): Position;
}
export {};
