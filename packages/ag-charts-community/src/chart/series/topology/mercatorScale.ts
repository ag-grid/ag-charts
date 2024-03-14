import type { Scale } from '../../../scale/scale';
import type { Position } from './geojson';

type XY = [x: number, y: number];

const radsInDeg = Math.PI / 180;
const lonX = (lon: number) => lon * radsInDeg;
const latY = (lat: number) => -Math.log(Math.tan(Math.PI * 0.25 + lat * radsInDeg * 0.5));

export class MercatorScale implements Scale<Position, XY> {
    scale: number;
    originX: number;
    originY: number;

    static fixedScale(scale = 1) {
        const out = Object.create(MercatorScale.prototype);
        out.scale = scale;
        out.originX = 0;
        out.originY = 0;
        return out;
    }

    constructor(
        public readonly domain: Position[],
        public readonly range: XY[]
    ) {
        const [[lon0, lat0], [lon1, lat1]] = domain;
        const [[x, y], [x1, y1]] = range;
        const width = x1 - x;
        const height = y1 - y;

        const viewBoxRawWidth = Math.abs(lonX(lon1) - lonX(lon0));
        const viewBoxRawHeight = Math.abs(latY(lat1) - latY(lat0));

        const scale = Math.min(width / viewBoxRawWidth, height / viewBoxRawHeight);

        const viewBoxWidth = viewBoxRawWidth * scale;
        const viewBoxHeight = viewBoxRawHeight * scale;

        const viewBoxOriginX = viewBoxWidth - Math.max(lonX(lon0), lonX(lon1)) * scale;
        const viewBoxOriginY = viewBoxHeight - Math.max(latY(lat0), latY(lat1)) * scale;

        this.scale = scale;
        this.originX = -(x + viewBoxOriginX + (width - viewBoxWidth) / 2);
        this.originY = -(y + viewBoxOriginY + (height - viewBoxHeight) / 2);
    }

    convert([lon, lat]: Position): XY {
        const { scale, originX, originY } = this;
        return [lonX(lon) * scale - originX, latY(lat) * scale - originY];
    }
}
