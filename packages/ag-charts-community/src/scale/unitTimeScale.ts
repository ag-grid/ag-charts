import type { NormalizedDomain, ScaleAlignment, ScaleTickParams, ScaleTickResult } from 'ag-charts-core';
import {
    Logger,
    findMaxIndex,
    findMinIndex,
    intervalFloor,
    intervalMilliseconds,
    intervalNext,
    intervalRange,
    intervalRangeCount,
    intervalRangeStartIndex,
    isPlainObject,
} from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { normalizeContinuousDomains } from './continuousScale';
import { DiscreteTimeScale } from './discreteTimeScale';
import { visibleTickSliceIndices } from './scaleUtil';

const MAX_BANDS = 50e6; // Max array length is ~4bn

export class UnitTimeScale extends DiscreteTimeScale {
    static override is(value: unknown): value is UnitTimeScale {
        return value instanceof UnitTimeScale;
    }

    override readonly type = 'unit-time';

    override readonly defaultTickCount = 12;

    static supportsInterval(domain: Date[], interval: AgTimeInterval | AgTimeIntervalUnit) {
        return supportsInterval(domain, interval);
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

    /* eslint-disable sonarjs/use-type-alias */
    private _interval: AgTimeInterval | AgTimeIntervalUnit | undefined;
    get interval(): AgTimeInterval | AgTimeIntervalUnit | undefined {
        return this._interval;
    }
    set interval(interval: AgTimeInterval | AgTimeIntervalUnit | undefined) {
        if (this._interval === interval) return;

        this._interval = interval;
        this._bands = undefined;
    }

    private _bands: Date[] | undefined = undefined;
    get bands(): readonly Date[] {
        this._bands ??= this.calculateBands(this._domain, [0, 1]).bands;
        return this._bands;
    }

    override normalizeDomains(...domains: Date[][]): NormalizedDomain<Date> {
        return normalizeContinuousDomains(...domains);
    }

    override convert(value: Date, options?: { clamp?: boolean; alignment?: ScaleAlignment }): number {
        this.refresh();

        if (!(value instanceof Date)) value = new Date(value as any);

        const { domain, interval } = this;
        if (domain.length < 2) return Number.NaN;
        if (options?.clamp !== true && interval != null) {
            const t = value.valueOf();
            const [start, stop] = calculateBandRange(domain, interval);
            const d0 = Math.min(start.valueOf(), stop.valueOf());
            const d1 = Math.max(start.valueOf(), stop.valueOf());
            const dNext = intervalNext(interval, new Date(d1)).valueOf();
            if (t < d0 || t >= dNext) return Number.NaN;
        }

        return super.convert(value, options);
    }

    private calculateBands(
        domain: Date[],
        visibleRange: [number, number],
        extend: boolean = false
    ): { bands: Date[]; firstBandIndex: number | undefined } {
        if (
            domain === this.domain &&
            visibleRange[0] === 0 &&
            visibleRange[1] === 1 &&
            !extend &&
            this._bands != null
        ) {
            return { bands: this._bands, firstBandIndex: 0 };
        }

        if (domain.length < 2) return { bands: [], firstBandIndex: undefined };

        const { interval } = this;
        if (interval == null) return { bands: [], firstBandIndex: undefined };

        const rangeParams = { visibleRange, extend };
        if (!supportsInterval(domain, interval, rangeParams)) return { bands: [], firstBandIndex: undefined };

        const [start, stop] = calculateBandRange(domain, interval);
        if (intervalRangeCount(interval, start, stop, rangeParams) > MAX_BANDS) {
            Logger.warnOnce(`the configured unit results in too many bands, ignoring. Supply a larger unit.`);
            return { bands: [], firstBandIndex: undefined };
        }

        const bands = intervalRange(interval, start, stop, rangeParams);
        const firstBandIndex = intervalRangeStartIndex(interval, start, stop, rangeParams);
        return { bands, firstBandIndex };
    }

    override ticks(
        { interval }: ScaleTickParams<AgTimeInterval | AgTimeIntervalUnit | number>,
        domain: Date[] = this.domain,
        visibleRange: [number, number] = [0, 1],
        { extend = false } = {}
    ): ScaleTickResult<Date> | undefined {
        if (domain.length < 2) return;

        let bands: Date[];
        let firstBandIndex: number | undefined;
        let bandsSliceIndices: [number, number] | undefined;

        if (domain === this.domain && !extend) {
            // Use cached values
            ({ bands } = this.calculateBands(domain, [0, 1], false));
            bandsSliceIndices = visibleTickSliceIndices(bands, false, visibleRange);
            firstBandIndex = bandsSliceIndices[0];
        } else {
            ({ bands, firstBandIndex } = this.calculateBands(domain, visibleRange, extend));
        }

        if (interval == null) {
            return { ticks: bands, count: undefined, firstTickIndex: firstBandIndex };
        }

        const milliseconds = this.interval ? intervalMilliseconds(this.interval) : Infinity;

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
            const i0 = bandsSliceIndices ? bandsSliceIndices[0] : 0;
            const i1 = bandsSliceIndices ? bandsSliceIndices[1] : bands.length - 1;
            intervalTicks = bands; // Could be large array - avoid copying
            intervalStartIndex = findMaxIndex(i0, i1, (index) => bands[index].valueOf() <= d0) ?? i0;
            intervalEndIndex = findMaxIndex(i0, i1, (index) => bands[index].valueOf() <= d1) ?? i1;
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
            const bandRange = calculateBandRange([new Date(d0), new Date(d1)], this.interval);
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
            firstTickIndex: firstBandIndex,
        };
    }
}

function supportsInterval(
    domain: Date[],
    interval: AgTimeInterval | AgTimeIntervalUnit,
    rangeParams?: { visibleRange?: [number, number]; extend?: boolean }
): boolean {
    const [start, stop] = calculateBandRange(domain, interval);
    return intervalRangeCount(interval, start, stop, rangeParams) <= MAX_BANDS;
}

function calculateBandRange(domain: Date[], interval: AgTimeInterval | AgTimeIntervalUnit): [Date, Date] {
    const start = intervalFloor(interval, domain[0]);
    const stop = intervalFloor(interval, domain[1]);
    return [start, stop];
}
