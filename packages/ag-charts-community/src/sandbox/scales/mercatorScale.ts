import { toDegree, toRadian } from '../util/number.util';
import { BaseScale } from './baseScale';

type NumberTuple = [number, number];

export class MercatorScale extends BaseScale<NumberTuple, NumberTuple> {
    private readonly preCalculations: { minX: number; minY: number; xRatio: number; yRatio: number };

    constructor(domain: NumberTuple[], range: NumberTuple[]) {
        super(domain, range);

        const [[rx0, ry0], [rx1, ry1]] = range;
        const [x0, y0] = MercatorScale.fromGeo(domain[0]);
        const [x1, y1] = MercatorScale.fromGeo(domain[1]);

        this.preCalculations = {
            minX: Math.min(x0, x1),
            minY: Math.min(y0, y1),
            xRatio: (rx1 - rx0) / Math.abs(x1 - x0),
            yRatio: (ry1 - ry0) / Math.abs(y1 - y0),
        };
    }

    convert(data: NumberTuple): NumberTuple {
        const [[rx0, ry0]] = this.range;
        const [x1, y1] = MercatorScale.fromGeo(data);
        const { minX, minY, xRatio, yRatio } = this.preCalculations;
        return [(x1 - minX) * xRatio + rx0, (y1 - minY) * yRatio + ry0];
    }

    invert([x, y]: NumberTuple) {
        const [[rx0, ry0]] = this.range;
        const { minX, minY, xRatio, yRatio } = this.preCalculations;
        return MercatorScale.toGeo((x - rx0) / xRatio + minX, (y - ry0) / yRatio + minY);
    }

    static getFixedScale() {
        return new MercatorScale(
            [MercatorScale.toGeo(0, 0), MercatorScale.toGeo(1, 1)],
            [
                [0, 0],
                [1, 1],
            ]
        );
    }

    private static fromGeo([lon, lat]: NumberTuple): NumberTuple {
        return [toDegree(lon), -Math.log(Math.tan(Math.PI * 0.25 + toDegree(lat) * 0.5))];
    }

    private static toGeo(x: number, y: number): NumberTuple {
        return [toRadian(x), (Math.atan(Math.exp(-y)) - Math.PI * 0.25) / (Math.PI / 360)];
    }
}
