import { findMinIndex } from 'ag-charts-core';

import { compareDates } from '../util/date';
import { TimeInterval } from '../util/time';
import { normalizeContinuousDomains } from './continuousScale';
import { DiscreteTimeScale } from './discreteTimeScale';
import type { NormalizedDomain, ScaleFormatParams, ScaleTickParams } from './scale';

export class UnitTimeScale extends DiscreteTimeScale {
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
        this._bands ??= this.calculateBands(this._domain, this._interval);
        return this._bands;
    }

    override normalizeDomains(...domains: Date[][]): NormalizedDomain<Date> {
        return normalizeContinuousDomains(...domains);
    }

    private calculateBands(domain: Date[], interval: TimeInterval | undefined, visibleRange?: [number, number]) {
        if (!domain.length || interval == null) return [];

        const start = interval.floor(domain[0]);
        const stop = interval.floor(domain[1]);
        return interval.range(start, stop, { visibleRange });
    }

    override ticks(
        { interval }: ScaleTickParams<TimeInterval | number>,
        domain: Date[] = this.domain,
        visibleRange: [number, number] = [0, 1],
        // This parameter is only used for UnitTimeScale
        interpolate = false
    ): Date[] {
        if (interval == null) return this.calculateBands(domain, this.interval, visibleRange);

        const bands = interpolate ? undefined : this.calculateBands(domain, this.interval, visibleRange);

        const d0 = domain[0].valueOf();
        const d1 = domain[1].valueOf();

        if (interval instanceof TimeInterval) {
            if (bands == null) {
                return interval.range(domain[0], domain[1], { visibleRange }).filter((intervalTick) => {
                    const intervalTickTime = intervalTick.valueOf();
                    return intervalTickTime >= d0 && intervalTickTime <= d1;
                });
            }

            const intervalTicks = interval.range(domain[0], domain[1], { extend: true, visibleRange });
            const ticks: Date[] = [];
            let lastIndex: number | undefined;
            for (const intervalTick of intervalTicks) {
                const bandIndex = findMinIndex(0, bands.length - 1, (index) => {
                    return compareDates(bands[index], intervalTick) >= 0;
                });
                const tick = bandIndex != null && bandIndex != lastIndex ? bands[bandIndex] : undefined;
                lastIndex = bandIndex;

                if (tick != null && tick.valueOf() >= d0 && tick.valueOf() <= d1) ticks.push(tick);
            }

            return ticks;
        } else {
            const ticks: Date[] = [];
            let lastIndex: number | undefined;
            for (let intervalTickTime = d0; intervalTickTime <= d1; intervalTickTime += interval) {
                const intervalTick = new Date(intervalTickTime);
                if (bands == null) {
                    ticks.push(intervalTick);
                    continue;
                }

                const bandIndex = findMinIndex(0, bands.length - 1, (index) => {
                    return compareDates(bands[index], intervalTick) >= 0;
                });
                const tick = bandIndex != null && bandIndex != lastIndex ? bands[bandIndex] : undefined;
                lastIndex = bandIndex;

                if (tick != null && tick.valueOf() >= d0 && tick.valueOf() <= d1) ticks.push(tick);
            }

            return ticks;
        }
    }

    override findIndex(value: Date): number | undefined {
        const { bands } = this;
        const target = value.valueOf();
        return findMinIndex(0, bands.length - 1, (index) => bands[index].valueOf() >= target);
    }

    override datumFormatter(params: ScaleFormatParams<Date>): (date: Date) => string {
        return this.tickFormatter(params, 1);
    }

    override tickIsFirstAfter(tick: Date, reference: Date) {
        const milliseconds = this.interval?.milliseconds;
        if (milliseconds == null) return super.tickIsFirstAfter(tick, reference);

        return tick.getTime() - milliseconds <= reference.getTime();
    }
}
