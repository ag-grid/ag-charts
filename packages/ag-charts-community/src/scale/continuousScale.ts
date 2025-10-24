import type { NormalizedDomain } from 'ag-charts-core';

import { findMinMax } from 'ag-charts-core/utils/numberArray';
import { AbstractScale } from './abstractScale';

export abstract class ContinuousScale<D extends number | Date, I = number> extends AbstractScale<D, number, I> {
    static is(value: unknown): value is ContinuousScale<any, any> {
        return value instanceof ContinuousScale;
    }

    static readonly defaultTickCount = 5;

    readonly defaultTickCount = ContinuousScale.defaultTickCount;

    protected defaultClamp = false;
    protected transform?(x: number): number;
    protected transformInvert?(x: number): D;

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

    convert(value: D | number, options?: { clamp?: boolean }) {
        const { domain } = this;
        if (!domain || domain.length < 2 || value == null) {
            return Number.NaN;
        }

        const { range } = this;
        const clamp = options?.clamp ?? this.defaultClamp;

        let d0: number = domain[0].valueOf();
        let d1: number = domain[1].valueOf();
        let x = value.valueOf();
        if (this.transform) {
            d0 = this.transform(d0);
            d1 = this.transform(d1);
            x = this.transform(x);
        }

        if (clamp) {
            const [start, stop] = findMinMax([d0, d1]);
            if (x < start) {
                return range[0];
            } else if (x > stop) {
                return range[1];
            }
        }

        if (d0 === d1) {
            return (range[0] + range[1]) / 2;
        } else if (x === d0) {
            return range[0];
        } else if (x === d1) {
            return range[1];
        }

        const r0 = range[0];
        return r0 + ((x - d0) / (d1 - d0)) * (range[1] - r0);
    }

    invert(x: number, _nearest?: boolean) {
        const { domain } = this;
        if (domain.length < 2) return;

        let d0: number = domain[0].valueOf();
        let d1: number = domain[1].valueOf();
        if (this.transform) {
            d0 = this.transform(d0);
            d1 = this.transform(d1);
        }

        const { range } = this;
        const [r0, r1] = range;

        let d: any;
        if (r0 === r1) {
            d = this.toDomain((d0 + d1) / 2);
        } else {
            d = this.toDomain(d0 + ((x - r0) / (r1 - r0)) * (d1 - d0));
        }

        return this.transformInvert ? this.transformInvert(d) : d;
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
