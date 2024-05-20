import { clamp } from '../../util/number';
import { type OKLCH, oklchToRgba, rgbaToOklch, stringToRgba } from '../util/colors.util';
import { interpolateColor } from '../util/interpolate.util';
import { BaseScale } from './baseScale';

export class ColorScale extends BaseScale<number, string> {
    private readonly oklchRange: OKLCH[];

    constructor(domain: number[], range: string[]) {
        if (domain.length < 2) {
            throw new Error('Color scale domain must contain at least 2 values.');
        }
        if (domain.length !== range.length) {
            throw new Error('Color scale range size must match the provided domain size.');
        }
        super(domain, range);
        this.oklchRange = range.map((value) => {
            const { r, g, b, a } = stringToRgba(value);
            return rgbaToOklch(r, g, b, a);
        });
    }

    convert(value: number) {
        const { domain, oklchRange } = this;
        const i = this.findBoundingDomainIndex(value);
        const d = clamp(0, (value - domain[i]) / (domain[i + 1] - domain[i]), 1);
        const interpolator = interpolateColor(oklchRange[i], oklchRange[i + 1]);
        const { l, c, h, a } = interpolator(d);
        const { r, g, b } = oklchToRgba(l, c, h, a);
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
