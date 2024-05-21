import { clamp } from '../../util/number';
import { type OKLCH, oklchToRgba, rgbaToOklch, stringToRgba } from '../util/colors.util';
import { interpolateColor } from '../util/interpolate.util';
import { BaseScale } from './baseScale';

export class ColorScale extends BaseScale<number, string> {
    private readonly oklchRange: OKLCH[];

    constructor(domain: number[], range: string[]) {
        if (domain.length < 2) {
            throw new Error('Color scale domain size must be greater than or equal to 2.');
        }
        if (domain.length > 2 && domain.length !== range.length) {
            throw new Error('Color scale domain size must be equal to 2 or to the provided range size.');
        }
        super(domain, range);
        this.oklchRange = range.map((value) => {
            const { r, g, b, a } = stringToRgba(value);
            return rgbaToOklch(r, g, b, a);
        });
    }

    convert(value: number) {
        const { domain, range, oklchRange } = this;

        let d: number, i: number;
        if (domain.length === range.length) {
            i = this.findBoundingDomainIndex(value);
            d = clamp(0, (value - domain[i]) / (domain[i + 1] - domain[i]), 1);
        } else {
            const step = 1 / (range.length - 1);
            const percentile = clamp(0, (value - domain[0]) / (domain[1] - domain[0]), 1);
            i = Math.min(Math.floor(percentile * (range.length - 1)), range.length - 2);
            d = (percentile - i * step) / step;
        }

        const interpolator = interpolateColor(oklchRange[i], oklchRange[i + 1]);
        const { l, c, h, a } = interpolator(d);
        const { r, g, b } = oklchToRgba(l, c, h);
        return `rgba(${r},${g},${b},${a})`;
    }

    override invert(_value: string) {
        return 0;
    }

    private findBoundingDomainIndex(value: number) {
        for (let i = 1; i < this.domain.length; i++) {
            if (value >= this.domain[i - 1] && value <= this.domain[i]) {
                return i - 1;
            }
        }
        return -1;
    }
}
