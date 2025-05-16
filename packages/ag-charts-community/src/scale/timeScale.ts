import { findMaxIndex, findMinIndex, isPlainObject } from 'ag-charts-core';
import type { TimeInterval, TimeIntervalUnit } from 'ag-charts-types';

import { intervalFloor, intervalMilliseconds, intervalRange } from '../util/time';
import { normalizeContinuousDomains } from './continuousScale';
import { DiscreteTimeScale } from './discreteTimeScale';
import type { NormalizedDomain, ScaleFormatParams, ScaleTickParams, ScaleTickResult } from './scale';

export class TimeScale extends DiscreteTimeScale {
    static readonly defaultTickCount = 12;

    static override is(value: unknown): value is TimeScale {
        return value instanceof TimeScale;
    }

    override readonly type = 'time';

    private _domain: Date[] = [];
    override set domain(domain: Date[]) {
        if (domain === this._domain) return;

        this._domain = domain;
        this._bands = undefined;
    }
    override get domain(): Date[] {
        return this._domain;
    }

    /* eslint-disable sonarjs/use-type-alias */
    private _interval: TimeInterval | TimeIntervalUnit | undefined;
    get interval(): TimeInterval | TimeIntervalUnit | undefined {
        return this._interval;
    }
    set interval(interval: TimeInterval | TimeIntervalUnit | undefined) {
        if (this._interval === interval) return;

        this._interval = interval;
        this._bands = undefined;
    }
    /* eslint-enable */

    private _bands: Date[] | undefined = undefined;
    get bands(): readonly Date[] {
        this._bands ??= this.calculateBands(this._domain, [0, 1]);
        return this._bands;
    }

    override normalizeDomains(...domains: Date[][]): NormalizedDomain<Date> {
        return normalizeContinuousDomains(...domains);
    }

    override convert(d: Date, options?: { interpolate?: boolean }): number {
        const { domain, interval } = this;
        if (domain.length < 2) return NaN;
        if (interval != null) {
            const t = d.valueOf();
            const [start, stop] = this.calculateBandRange(domain, interval);
            const d0 = Math.min(start.valueOf(), stop.valueOf());
            const d1 = Math.max(start.valueOf(), stop.valueOf());
            if (t < d0 || t >= d1 + intervalMilliseconds(interval)) return NaN;
        }
        return super.convert(d, options);
    }

    private calculateBandRange(domain: Date[], interval: TimeInterval | TimeIntervalUnit): [Date, Date] {
        const start = intervalFloor(interval, domain[0]);
        const stop = intervalFloor(interval, domain[1]);
        return [start, stop];
    }

    private calculateBands(domain: Date[], visibleRange: [number, number], extend: boolean = false): Date[] {
        if (
            domain === this.domain &&
            visibleRange[0] === 0 &&
            visibleRange[1] === 1 &&
            !extend &&
            this._bands != null
        ) {
            return this._bands;
        }

        if (domain.length < 2) return [];

        const { interval } = this;
        if (interval == null) return [];

        const [start, stop] = this.calculateBandRange(domain, interval);
        return intervalRange(interval, start, stop, { visibleRange, extend });
    }

    override ticks(
        { interval }: ScaleTickParams<TimeInterval | TimeIntervalUnit | number>,
        domain: Date[] = this.domain,
        visibleRange: [number, number] = [0, 1],
        extend = false
    ): ScaleTickResult<Date> | undefined {
        if (domain.length < 2) return;

        const bands = this.calculateBands(domain, visibleRange, extend);
        const milliseconds = this.interval ? intervalMilliseconds(this.interval) : Infinity;

        if (interval == null) return { ticks: bands, count: undefined };

        const d0 = Math.min(domain[0].valueOf(), domain[1].valueOf());
        const d1 = Math.max(domain[0].valueOf(), domain[1].valueOf());

        let intervalTicks: Date[];
        let intervalStartIndex: number;
        let intervalEndIndex: number;
        if (isPlainObject(interval) || typeof interval === 'string') {
            intervalTicks = intervalRange(interval, domain[0], domain[1], { extend: true, visibleRange });
            intervalStartIndex = 0;
            intervalEndIndex = intervalTicks.length - 1;
        } else {
            intervalTicks = bands; // Could be large array - avoid copying
            intervalStartIndex = findMaxIndex(0, bands.length - 1, (index) => bands[index].valueOf() <= d0) ?? 0;
            intervalEndIndex =
                findMaxIndex(0, bands.length - 1, (index) => bands[index].valueOf() <= d1) ?? bands.length - 1;
        }

        const ticks: Date[] = [];
        let lastIndex: number | undefined;
        for (let i = intervalStartIndex; i <= intervalEndIndex; i++) {
            const intervalTickValue = intervalTicks[i].valueOf();
            const bandIndex = findMaxIndex(0, bands.length - 1, (index) => bands[index].valueOf() <= intervalTickValue);
            const tick = bandIndex != null && bandIndex != lastIndex ? bands[bandIndex] : undefined;
            lastIndex = bandIndex;

            if (tick != null && intervalTickValue - tick.getTime() <= milliseconds) ticks.push(tick);
        }

        let bandStart: number;
        let bandEnd: number;
        if (this.interval) {
            const bandRange = this.calculateBandRange([new Date(d0), new Date(d1)], this.interval);
            bandStart = bandRange[0].valueOf();
            bandEnd = bandRange[1].valueOf();
        } else {
            bandStart = d0;
            bandEnd = d1;
        }
        let firstTickIndex = findMinIndex(0, ticks.length - 1, (i) => ticks[i].valueOf() >= bandStart) ?? 0;
        let lastTickIndex = findMaxIndex(0, ticks.length - 1, (i) => ticks[i].valueOf() <= bandEnd) ?? ticks.length - 1;

        if (extend) {
            firstTickIndex = Math.max(firstTickIndex - 1, 0);
            lastTickIndex = Math.min(lastTickIndex + 1, ticks.length - 1);
        }

        return {
            ticks: ticks.slice(firstTickIndex, lastTickIndex + 1),
            count: ticks.length,
        };
    }

    override findIndex(value: Date): number | undefined {
        const { bands } = this;
        const target = value.valueOf();
        return findMaxIndex(0, bands.length - 1, (index) => bands[index].valueOf() <= target);
    }

    override datumFormatter(params: ScaleFormatParams<Date>): (date: Date) => string {
        const formatter = this.tickFormatter(params, 1);
        return (date: Date) => {
            const index = this.findIndex(date);
            return index != null ? formatter(this.bands[index]) : formatter(date);
        };
    }
}
