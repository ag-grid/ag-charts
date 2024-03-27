import type { Scale } from '../../../scale/scale';
import { BBox } from '../../../scene/bbox';
import type { Position } from './geojson';

type XY = [x: number, y: number];

const radsInDeg = Math.PI / 180;
const lonX = (lon: number) => lon * radsInDeg;
const latY = (lat: number) => -Math.log(Math.tan(Math.PI * 0.25 + lat * radsInDeg * 0.5));

export class MercatorScale implements Scale<Position, XY> {
    private bounds: BBox;

    static bounds(domain: Position[]): BBox {
        const [[lon0, lat0], [lon1, lat1]] = domain;

        const x0 = lonX(lon0);
        const y0 = latY(lat0);
        const x1 = lonX(lon1);
        const y1 = latY(lat1);

        return new BBox(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
    }

    static fixedScale() {
        const domain: Position[] = [
            [-180, 90],
            [180, -90],
        ];
        const { x, y, width, height } = MercatorScale.bounds(domain);
        return new MercatorScale(domain, [
            [x, y],
            [x + width, y + height],
        ]);
    }

    constructor(
        public readonly domain: Position[],
        public readonly range: XY[]
    ) {
        this.bounds = MercatorScale.bounds(domain);
    }

    convert([lon, lat]: Position): XY {
        const x = lonX(lon);
        const y = latY(lat);
        const [[x0, y0], [x1, y1]] = this.range;
        const xScale = (x1 - x0) / this.bounds.width;
        const yScale = (y1 - y0) / this.bounds.height;
        return [(x - this.bounds.x) * xScale + x0, (y - this.bounds.y) * yScale + y0];
    }
}
