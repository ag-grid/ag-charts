import { findMaxIndex } from 'ag-charts-core';

import type { TimeInterval } from '../util/time';
import { buildFormatter } from '../util/timeFormat';
import { defaultTimeTickFormat } from '../util/timeFormatDefaults';
import { BandScale } from './bandScale';
import { normalizeContinuousDomains } from './continuousScale';
import type { NormalizedDomain, ScaleFormatParams, ScaleTickParams } from './scale';
import { filterVisibleTicks } from './scaleUtil';

export class UnitTimeScale extends BandScale<Date, TimeInterval> {
    override readonly type = 'unit-time';

    static override is(value: unknown): value is UnitTimeScale {
        return value instanceof UnitTimeScale;
    }

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

    get bandCount() {
        return this.bands.length;
    }

    override normalizeDomains(...domains: Date[][]): NormalizedDomain<Date> {
        return normalizeContinuousDomains(...domains);
    }

    override toDomain(value: number): Date {
        return new Date(value);
    }

    private calculateBands(domain: Date[], interval: TimeInterval | undefined) {
        if (!domain.length || interval == null) return [];

        const start = interval.floor(domain[0]);
        const stop = interval.floor(domain[1]);
        return interval.range(start, stop);
    }

    override ticks(
        _: ScaleTickParams<TimeInterval>,
        domain: Date[] = this.domain,
        visibleRange: [number, number] = [0, 1]
    ): Date[] {
        return filterVisibleTicks(this.calculateBands(domain, this.interval), false, visibleRange);
    }

    override invert(position: number, nearest = false): Date | undefined {
        this.refresh();

        const offset = nearest ? this.bandwidth / 2 : 0;
        const index = this.invertNearestIndex(Math.max(0, position - offset));
        const matches = nearest || position === this.ordinalRange(index);

        return matches ? this.domain[index] : undefined;
    }

    protected override getIndex(value: Date): number | undefined {
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
