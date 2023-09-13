import { Logger } from '../util/logger';
import type { TimeInterval } from '../util/time/interval';
import type { Scale, ScaleConvertParams } from './scale';

export abstract class ContinuousScale<D extends number | Date, I = number> implements Scale<D, number, I> {
    static readonly defaultTickCount = 5;
    static readonly defaultMaxTickCount = 6;

    nice = false;
    interval?: I;
    tickCount = ContinuousScale.defaultTickCount;
    minTickCount = 0;
    maxTickCount = Infinity;
    niceDomain: any[] = null as any;

    smallestBandwidthInterval?: number;

    protected constructor(public domain: D[], public range: number[]) {}

    protected transform(x: D) {
        return x;
    }
    protected transformInvert(x: D) {
        return x;
    }

    calcBandwidth(smallestInterval = 1) {
        const domain = this.getDomain();
        const maxRange = Math.max(...this.range);
        const intervals = (domain[1] - domain[0]) / smallestInterval + 1;

        // The number of intervals/bands is used to determine the width of individual bands by dividing the available range.
        // Allow a maximum number of bands to ensure the step does not fall below 1 pixel.
        // This means there could be some overlap of the bands in the chart.
        const maxBands = Math.floor(maxRange); // A minimum of 1px per bar/column means the maximum number of bands will equal the available range
        const bands = Math.min(intervals, maxBands);

        return maxRange / Math.max(1, bands);
    }

    fromDomain(d: D): number {
        if (typeof d === 'number') {
            return d;
        } else if (d instanceof Date) {
            return d.getTime();
        }

        return NaN;
    }

    abstract toDomain(d: number): D;

    getDomain() {
        if (this.nice) {
            this.refresh();
            if (this.niceDomain) {
                return this.niceDomain;
            }
        }
        return this.domain;
    }

    defaultClampMode: ScaleConvertParams['clampMode'] = 'raw';

    convert(x: D, opts?: ScaleConvertParams) {
        const clampMode = opts?.clampMode ?? this.defaultClampMode;
        if (!this.domain || this.domain.length < 2) {
            return NaN;
        }
        this.refresh();

        const domain = this.getDomain().map((d) => this.transform(d));
        const [d0, d1] = domain;

        const { range } = this;
        const [r0, r1] = range;

        x = this.transform(x);

        if (clampMode === 'clamped') {
            if (x < d0) {
                return r0;
            } else if (x > d1) {
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

        return (
            r0 + ((this.fromDomain(x) - this.fromDomain(d0)) / (this.fromDomain(d1) - this.fromDomain(d0))) * (r1 - r0)
        );
    }

    invert(x: number) {
        this.refresh();
        const domain = this.getDomain().map((d) => this.transform(d));
        const [d0, d1] = domain;

        const { range } = this;
        const [r0, r1] = range;

        const isReversed = r0 > r1;

        const rMin = isReversed ? r1 : r0;
        const rMax = isReversed ? r0 : r1;

        let d: any;
        if (x < rMin) {
            return isReversed ? d1 : d0;
        } else if (x > rMax) {
            return isReversed ? d0 : d1;
        } else if (r0 === r1) {
            d = this.toDomain((this.fromDomain(d0) + this.fromDomain(d1)) / 2);
        } else {
            d = this.toDomain(
                this.fromDomain(d0) + ((x - r0) / (r1 - r0)) * (this.fromDomain(d1) - this.fromDomain(d0))
            );
        }

        return this.transformInvert(d);
    }

    protected cache: any = null;
    protected cacheProps: Array<keyof this> = ['domain', 'range', 'nice', 'tickCount', 'minTickCount', 'maxTickCount'];
    protected didChange() {
        const { cache } = this;
        const didChange = !cache || this.cacheProps.some((p) => this[p] !== cache[p]);
        if (didChange) {
            this.cache = {};
            this.cacheProps.forEach((p) => (this.cache[p] = this[p]));
            return true;
        }
        return false;
    }

    abstract update(): void;
    protected abstract updateNiceDomain(): void;

    protected refresh() {
        if (this.didChange()) {
            this.update();
        }
    }

    protected isDenseInterval({
        start,
        stop,
        interval,
        count,
    }: {
        start: number;
        stop: number;
        interval: number | TimeInterval;
        count?: number;
    }): boolean {
        const { range } = this;
        const domain = stop - start;

        const min = Math.min(range[0], range[1]);
        const max = Math.max(range[0], range[1]);

        const availableRange = max - min;
        const step = typeof interval === 'number' ? interval : 1;
        count ??= domain / step;
        if (count >= availableRange) {
            Logger.warn(
                `the configured tick interval results in more than 1 tick per pixel, ignoring. Supply a larger tick interval or omit this configuration.`
            );
            return true;
        }

        return false;
    }
}
