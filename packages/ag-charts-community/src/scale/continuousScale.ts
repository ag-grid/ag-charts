import { Logger } from '../util/logger';
import { findMinMax } from '../util/number';
import { Invalidating } from './invalidating';
import type { Scale } from './scale';

export abstract class ContinuousScale<D extends number | Date, I = number> implements Scale<D, number, I> {
    static is(value: unknown): value is ContinuousScale<any, any> {
        return value instanceof ContinuousScale;
    }

    static readonly defaultTickCount = 5;
    static readonly defaultMaxTickCount = 6;

    abstract type: Scale<D, number, I>['type'];

    protected invalid = true;

    @Invalidating
    domain: D[];
    @Invalidating
    range: number[];
    @Invalidating
    nice = false;
    @Invalidating
    interval?: I = undefined;
    @Invalidating
    tickCount = ContinuousScale.defaultTickCount;
    @Invalidating
    minTickCount = 0;
    @Invalidating
    maxTickCount = Infinity;

    // TODO(olegat) should be of type D[]
    niceDomain: any[] = [];

    protected defaultClamp = false;

    protected constructor(domain: D[], range: number[]) {
        this.domain = domain;
        this.range = range;
    }

    protected transform(x: D) {
        return x;
    }
    protected transformInvert(x: D) {
        return x;
    }

    calcBandwidth(smallestInterval = 1) {
        const domain = this.getDomain();
        const rangeDistance = this.getPixelRange();
        const intervals = Math.abs(domain[1] - domain[0]) / smallestInterval + 1;

        // The number of intervals/bands is used to determine the width of individual bands by dividing the available range.
        // Allow a maximum number of bands to ensure the step does not fall below 1 pixel.
        // This means there could be some overlap of the bands in the chart.
        const maxBands = Math.floor(rangeDistance); // A minimum of 1px per bar/column means the maximum number of bands will equal the available range
        const bands = Math.min(intervals, maxBands);

        return rangeDistance / Math.max(1, bands);
    }

    abstract toDomain(d: number): D;

    getDomain() {
        if (this.nice) {
            this.refresh();
            if (this.niceDomain.length) {
                return this.niceDomain;
            }
        }
        return this.domain;
    }

    convert(x: D, clamp?: boolean) {
        if (!this.domain || this.domain.length < 2) {
            return NaN;
        }
        this.refresh();

        const domain = this.getDomain().map((d) => this.transform(d));
        const [d0, d1] = domain;

        const { range } = this;
        const [r0, r1] = range;

        x = this.transform(x);

        if (clamp ?? this.defaultClamp) {
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

    invert(x: number, clamp?: boolean) {
        this.refresh();
        const domain = this.getDomain().map((d) => this.transform(d));
        const [d0, d1] = domain;

        const { range } = this;
        const [r0, r1] = range;

        const isReversed = r0 > r1;

        const rMin = isReversed ? r1 : r0;
        const rMax = isReversed ? r0 : r1;

        if (clamp ?? this.defaultClamp) {
            if (x < rMin) {
                return isReversed ? d1 : d0;
            } else if (x > rMax) {
                return isReversed ? d0 : d1;
            }
        }

        let d: any;
        if (r0 === r1) {
            d = this.toDomain((Number(d0) + Number(d1)) / 2);
        } else {
            d = this.toDomain(Number(d0) + ((x - r0) / (r1 - r0)) * (Number(d1) - Number(d0)));
        }

        return this.transformInvert(d);
    }

    abstract update(): void;
    protected abstract updateNiceDomain(): void;

    protected refresh() {
        if (!this.invalid) return;

        this.invalid = false;
        this.update();

        if (this.invalid) {
            Logger.warnOnce('Expected update to not invalidate scale');
        }
    }

    protected getPixelRange() {
        const [a, b] = this.range;
        return Math.abs(b - a);
    }
}
