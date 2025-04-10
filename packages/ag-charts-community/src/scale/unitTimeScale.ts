import { findMaxIndex, findMinIndex } from 'ag-charts-core';

import { compareDates } from '../util/date';
import { findMinMax } from '../util/number';
import { TimeInterval } from '../util/time';
import { buildFormatter } from '../util/timeFormat';
import { defaultTimeTickFormat } from '../util/timeFormatDefaults';
import { BandScale } from './bandScale';
import { normalizeContinuousDomains } from './continuousScale';
import type { NormalizedDomain, ScaleFormatParams, ScaleTickParams } from './scale';

export class UnitTimeScale extends BandScale<Date, TimeInterval | number> {
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

    override toDomain(value: number): Date {
        return new Date(value);
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

        const { bands } = this;

        const d0 = domain[0].valueOf();
        const d1 = domain[1].valueOf();

        const ticks: Date[] = [];
        if (interval instanceof TimeInterval) {
            const intervalTicks = interval.range(domain[0], domain[1], { extend: true, visibleRange });

            let lastIndex: number | undefined;
            for (const intervalTick of intervalTicks) {
                if (interpolate) {
                    ticks.push(intervalTick);
                    continue;
                }

                const intervalTickTime = intervalTick.valueOf();
                if (intervalTickTime < d0 || intervalTickTime > d1) continue;
                const bandIndex = findMinIndex(0, bands.length - 1, (index) => {
                    return compareDates(bands[index], intervalTick) >= 0;
                });
                const tick = bandIndex != null && bandIndex != lastIndex ? bands[bandIndex] : undefined;
                lastIndex = bandIndex;

                if (tick != null && tick.valueOf() <= d1) ticks.push(tick);
            }

            // If there's a better candidate for the first tick, remove it
            if (!interpolate && ticks.length !== 0) {
                const index = this.findIndex(ticks[0]);
                const previousTick = index != null && index > 0 ? bands[index - 1] : undefined;
                if (previousTick != null && compareDates(previousTick, ticks[0]) >= 0) {
                    ticks.shift();
                }
            }
        } else {
            let lastIndex: number | undefined;
            for (let intervalTickTime = d0; intervalTickTime <= d1; intervalTickTime += interval) {
                const intervalTick = new Date(intervalTickTime);
                if (interpolate) {
                    ticks.push(intervalTick);
                    continue;
                }

                const bandIndex = findMinIndex(0, bands.length - 1, (index) => {
                    return compareDates(bands[index], intervalTick) >= 0;
                });
                const tick = bandIndex != null && bandIndex != lastIndex ? bands[bandIndex] : undefined;
                lastIndex = bandIndex;

                if (tick != null && tick.valueOf() <= d1) ticks.push(tick);
            }
        }

        return ticks;
    }

    override invert(position: number, nearest = false): Date | undefined {
        this.refresh();

        const offset = nearest ? this.bandwidth / 2 : 0;
        const index = this.invertNearestIndex(Math.max(0, position - offset));
        const matches = nearest || position === this.ordinalRange(index);

        return matches ? this.domain[index] : undefined;
    }

    override convert(d: Date, options?: { clamp?: boolean; interpolate?: boolean }): number {
        const interpolate = options?.interpolate ?? false;
        if (!interpolate) return super.convert(d, options);

        const d0 = this.domain[0].getTime();
        const d1 = this.domain[1].getTime();

        const clamp = options?.clamp ?? false;
        let v = d.getTime();
        if (clamp) v = Math.min(Math.max(v, d0), d1);

        const [r0, r1] = findMinMax(this.range);

        return ((v - d0) / (d1 - d0)) * (r1 - r0) + r0;
    }

    override findIndex(value: Date): number | undefined {
        const { bands } = this;
        const target = value.valueOf();
        return findMaxIndex(0, bands.length - 1, (index) => {
            return bands[index].valueOf() <= target;
        });
    }

    private _tickFormatter({ domain, ticks, specifier }: ScaleFormatParams<Date>, formatOffset?: number) {
        return specifier != null ? buildFormatter(specifier) : defaultTimeTickFormat(ticks, domain, formatOffset);
    }

    /**
     * Returns a time format function suitable for displaying tick values.
     *
     * @param ticks Optional array of tick values for custom formatting.
     * @param domain Optional array representing the [min, max] values of the time axis.
     * @param specifier Optional format specifier string for custom date formatting (e.g., `%Y`, `%m`, `%d`).
     * @param formatOffset Optional number for applying an offset to the format (e.g., timezone shifts).
     * @returns A function that formats a `Date` object into a string based on the provided specifier or default format.
     */
    override tickFormatter(params: ScaleFormatParams<Date>): (date: Date) => string {
        return this._tickFormatter(params);
    }

    override datumFormatter(params: ScaleFormatParams<Date>): (date: Date) => string {
        return this._tickFormatter(params, 1);
    }
}
