import { findMinMax } from '../util/number';
import { AbstractScale } from './abstractScale';
import type { NormalizedDomain } from './scale';

export abstract class ContinuousScale<D extends number | Date, I = number> extends AbstractScale<D, number, I> {
    static is(value: unknown): value is ContinuousScale<any, any> {
        return value instanceof ContinuousScale;
    }

    static readonly defaultTickCount = 5;

    protected defaultClamp = false;

    protected constructor(
        public domain: D[] = [],
        public range: number[] = []
    ) {
        super();
    }

    abstract override toDomain(value: number): D;

    normalizeDomains(...domains: D[][]): NormalizedDomain<D> {
        let min: D | undefined;
        let minValue = -Infinity;
        let max: D | undefined;
        let maxValue = +Infinity;

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
            const domain = [this.toDomain(NaN), this.toDomain(NaN)];
            return { domain, animatable: false };
        }
    }

    protected transform(x: D) {
        return x;
    }

    protected transformInvert(x: D) {
        return x;
    }

    calcBandwidth(smallestInterval = 1) {
        const { domain } = this;

        const rangeDistance = this.getPixelRange();
        if (domain.length === 0) return rangeDistance;

        const intervals = Math.abs(domain[1].valueOf() - domain[0].valueOf()) / smallestInterval + 1;

        // The number of intervals/bands is used to determine the width of individual bands by dividing the available range.
        // Allow a maximum number of bands to ensure the step does not fall below 1 pixel.
        // This means there could be some overlap of the bands in the chart.
        const maxBands = Math.floor(rangeDistance); // A minimum of 1px per bar/column means the maximum number of bands will equal the available range
        const bands = Math.min(intervals, maxBands);

        return rangeDistance / Math.max(1, bands);
    }

    convert(x: D, clamp = this.defaultClamp) {
        if (!this.domain || this.domain.length < 2) {
            return NaN;
        }

        const domain = this.domain.map((d) => this.transform(d));
        const [d0, d1] = domain;

        const { range } = this;
        const [r0, r1] = range;

        x = this.transform(x);

        if (clamp) {
            const [start, stop] = findMinMax(domain.map(Number));
            if (Number(x) < start) {
                return r0;
            } else if (Number(x) > stop) {
                return r1;
            }
        }

        if (d0 === d1) {
            return (r0 + r1) / 2;
        } else if (x === d0) {
            return r0;
        } else if (x === d1) {
            return r1;
        }

        return r0 + ((Number(x) - Number(d0)) / (Number(d1) - Number(d0))) * (r1 - r0);
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
