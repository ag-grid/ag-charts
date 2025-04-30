import { findMaxIndex, findMinIndex } from 'ag-charts-core';

import { TimeInterval } from '../util/time';
import { normalizeContinuousDomains } from './continuousScale';
import { DiscreteTimeScale } from './discreteTimeScale';
import type { NormalizedDomain, ScaleFormatParams, ScaleTickParams, ScaleTickResult } from './scale';

export class UnitTimeScale extends DiscreteTimeScale {
    static readonly defaultTickCount = 12;

    static override is(value: unknown): value is UnitTimeScale {
        return value instanceof UnitTimeScale;
    }

    override readonly type = 'unit-time';

    private _domain: Date[] = [];
    override set domain(domain: Date[]) {
        if (domain === this._domain) return;

        this._domain = domain;
        this._bands = undefined;
    }
    override get domain(): Date[] {
        return this._domain;
    }

    private _interval: TimeInterval | undefined;
    get interval(): TimeInterval | undefined {
        return this._interval;
    }
    set interval(interval: TimeInterval | undefined) {
        if (this._interval === interval) return;

        this._interval = interval;
        this._bands = undefined;
    }

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
            if (t < d0 || t >= d1 + interval.milliseconds) return NaN;
        }
        return super.convert(d, options);
    }

    private calculateBandRange(domain: Date[], interval: TimeInterval) {
        const start = interval.floor(domain[0]);
        const stop = interval.floor(domain[1]);
        return [start, stop] as const;
    }

    private calculateBands(domain: Date[], visibleRange: [number, number], extend: boolean = false) {
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
        return interval.range(start, stop, { visibleRange, extend });
    }

    override ticks(
        { interval }: ScaleTickParams<TimeInterval | number>,
        domain: Date[] = this.domain,
        visibleRange: [number, number] = [0, 1],
        extend = false
    ): ScaleTickResult<Date> | undefined {
        if (domain.length < 2) return;

        const bands = this.calculateBands(domain, visibleRange, extend);

        if (interval == null) return { ticks: bands, count: undefined };

        const d0 = Math.min(domain[0].valueOf(), domain[1].valueOf());
        const d1 = Math.max(domain[0].valueOf(), domain[1].valueOf());
        const ticks: Date[] = [];

        let intervalTicks: Date[];
        if (interval instanceof TimeInterval) {
            intervalTicks = interval.range(domain[0], domain[1], { extend: true, visibleRange });
        } else {
            const i0Index = findMaxIndex(0, bands.length - 1, (index) => bands[index].valueOf() <= d0);
            const i1Index = findMaxIndex(0, bands.length - 1, (index) => bands[index].valueOf() <= d1);
            if (i0Index == null || i1Index == null) return;
            intervalTicks = bands.slice(i0Index, i1Index + 1);
        }

        let lastIndex: number | undefined;
        for (const intervalTick of intervalTicks) {
            const intervalTickValue = intervalTick.valueOf();
            const bandIndex = findMaxIndex(0, bands.length - 1, (index) => bands[index].valueOf() <= intervalTickValue);
            const tick = bandIndex != null && bandIndex != lastIndex ? bands[bandIndex] : undefined;
            lastIndex = bandIndex;

            if (tick != null) ticks.push(tick);
        }

        let firstTickIndex = findMinIndex(0, ticks.length - 1, (i) => ticks[i].valueOf() >= d0) ?? 0;
        let lastTickIndex = findMaxIndex(0, ticks.length - 1, (i) => ticks[i].valueOf() <= d1) ?? ticks.length - 1;

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
