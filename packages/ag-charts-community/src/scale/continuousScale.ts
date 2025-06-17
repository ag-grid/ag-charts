import { findMinMax } from '../util/number';
import { AbstractScale } from './abstractScale';
import type { NormalizedDomain } from './scale';

export abstract class ContinuousScale<D extends number | Date, I = number> extends AbstractScale<D, number, I> {
    static is(value: unknown): value is ContinuousScale<any, any> {
        return value instanceof ContinuousScale;
    }

    static readonly defaultTickCount = 5;

    readonly defaultTickCount = ContinuousScale.defaultTickCount;

    protected defaultClamp = false;

    protected constructor(
        public domain: D[] = [],
        public range: number[] = []
    ) {
        super();
    }

    abstract override toDomain(value: number): D;

    normalizeDomains(...domains: D[][]): NormalizedDomain<D> {
        return normalizeContinuousDomains(...domains);
    }

    protected transform(x: D) {
        return x;
    }

    protected transformInvert(x: D) {
        return x;
    }

    calcBandwidth(smallestInterval = 1, minWidth: 1 | 0 = 1) {
        const { domain } = this;

        const rangeDistance = this.getPixelRange();
        if (domain.length === 0) return rangeDistance;

        const intervals = Math.abs(domain[1].valueOf() - domain[0].valueOf()) / smallestInterval + 1;

        // The number of intervals/bands is used to determine the width of individual bands by dividing the available range.
        let bands = intervals;

        // Allow a maximum number of bands to ensure the step does not fall below 1 pixel.
        // This means there could be some overlap of the bands in the chart.
        if (minWidth !== 0) {
            const maxBands = Math.floor(rangeDistance); // A minimum of 1px per bar/column means the maximum number of bands will equal the available range
            bands = Math.min(bands, maxBands);
        }

        return rangeDistance / Math.max(1, bands);
    }

    convert(value: D, options?: { clamp?: boolean }) {
        const { domain } = this;
        if (!domain || domain.length < 2) {
            return NaN;
        }

        const clamp = options?.clamp ?? this.defaultClamp;
        const d0 = Number(this.transform(domain[0]));
        const d1 = Number(this.transform(domain[1]));
        const x = Number(this.transform(value));

        if (clamp) {
            const [start, stop] = findMinMax([d0, d1]);
            if (x < start) {
                return this.range[0];
            } else if (x > stop) {
                return this.range[1];
            }
        }

        if (d0 === d1) {
            return (this.range[0] + this.range[1]) / 2;
        } else if (x === d0) {
            return this.range[0];
        } else if (x === d1) {
            return this.range[1];
        }

        const r0 = this.range[0];
        return r0 + ((x - d0) / (d1 - d0)) * (this.range[1] - r0);
    }

    invert(x: number, _nearest?: boolean) {
        const domain = this.domain.map((d) => this.transform(d));
        const [d0, d1] = domain;

        const { range } = this;
        const [r0, r1] = range;

        let d: any;
        if (r0 === r1) {
            d = this.toDomain((Number(d0) + Number(d1)) / 2);
        } else {
            d = this.toDomain(Number(d0) + ((x - r0) / (r1 - r0)) * (Number(d1) - Number(d0)));
        }

        return this.transformInvert(d);
    }

    protected getPixelRange() {
        const [a, b] = this.range;
        return Math.abs(b - a);
    }
}

export function normalizeContinuousDomains<D extends number | Date>(...domains: D[][]): NormalizedDomain<D> {
    let min: D | undefined;
    let minValue = Infinity;
    let max: D | undefined;
    let maxValue = -Infinity;

    for (const domain of domains) {
        for (const d of domain) {
            const value = d.valueOf();
            if (value < minValue) {
                minValue = value;
                min = d;
            }
            if (value > maxValue) {
                maxValue = value;
                max = d;
            }
        }
    }

    if (min != null && max != null) {
        const domain = [min, max];
        return { domain, animatable: true };
    } else {
        return { domain: [], animatable: false };
    }
}
