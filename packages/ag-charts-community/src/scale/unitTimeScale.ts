import type {
    ArrayView,
    DomainWithMetadata,
    IntervalRangeNumericResult,
    NormalizedDomain,
    ScaleTickParams,
    ScaleTickResult,
} from 'ag-charts-core';
import {
    Logger,
    ScaleAlignment,
    decodeIntervalValue,
    encodedToTimestamp,
    findMaxIndex,
    findMinIndex,
    intervalFloor,
    intervalMilliseconds,
    intervalNext,
    intervalRange,
    intervalRangeCount,
    intervalRangeNumeric,
    intervalRangeStartIndex,
    isPlainObject,
} from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { normalizeContinuousDomains } from './continuousScale';
import { DiscreteTimeScale, type UniformityCheck } from './discreteTimeScale';
import { visibleTickSliceIndices } from './scaleUtil';

const APPROXIMATE_THRESHOLD = 1000;

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
    private _uniformityCache: UniformityCheck | undefined;
    private _domainBoundaries: { d0: number; dNext: number } | undefined;
    private _bandRangeCache: { start: Date; stop: Date } | undefined;
    /** Encoded band values (internal encoding, not timestamps) */
    private _encodedBands: ArrayView<number> | undefined;
    /** Encoding params needed to decode encoded bands to Date/timestamp */
    private _encodingParams: IntervalRangeNumericResult['encodingParams'] | undefined;
    /** Cached linear params for O(1) findIndex */
    private _linearParams: { firstBandTime: number; intervalMs: number } | undefined;

    override set domain(domain: Date[]) {
        if (domain === this._domain) return;

        this._domain = domain;
        this._bands = undefined;
        this._numericBands = undefined;
        this._uniformityCache = undefined;
        this._domainBoundaries = undefined;
        this._bandRangeCache = undefined;
        this._encodedBands = undefined;
        this._encodingParams = undefined;
        this._linearParams = undefined;
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
        this._numericBands = undefined;
        this._uniformityCache = undefined;
        this._domainBoundaries = undefined;
        this._bandRangeCache = undefined;
        this._encodedBands = undefined;
        this._encodingParams = undefined;
        this._linearParams = undefined;
    }

    private _bands: ArrayView<Date> | undefined = undefined;
    get bands(): Readonly<ArrayView<Date>> {
        if (this._bands === undefined) {
            // Lazily decode from encoded bands
            this.ensureEncodedBands();
            if (this._encodedBands != null && this._encodingParams != null) {
                const params = this._encodingParams;
                this._bands = this._encodedBands.map((e) => decodeIntervalValue(e, params));
            } else {
                this._bands = [];
            }
        }
        return this._bands;
    }

    private _numericBands: ArrayView<number> | undefined;
    protected override get numericBands(): ArrayView<number> {
        if (this._numericBands === undefined) {
            // Compute timestamps from encoded bands without creating Date objects first
            this.ensureEncodedBands();
            if (this._encodedBands != null && this._encodingParams != null) {
                const params = this._encodingParams;
                this._numericBands = this._encodedBands.map((e) => encodedToTimestamp(e, params));
            } else {
                this._numericBands = [];
            }
        }
        return this._numericBands;
    }

    /**
     * Ensure encoded bands are computed. This is the numeric-first optimization:
     * we compute just the encoded values (cheap numbers) and defer Date creation.
     */
    private ensureEncodedBands(): void {
        if (this._encodedBands !== undefined) return;

        const { domain, interval } = this;
        if (domain.length < 2 || interval == null) {
            this._encodedBands = [];
            return;
        }

        const bandRange = this.getCachedBandRange();
        if (bandRange == null) {
            this._encodedBands = [];
            return;
        }

        const [start, stop] = bandRange;
        const rangeParams = { visibleRange: [0, 1] as [number, number], extend: false };

        if (intervalRangeCount(interval, start, stop, rangeParams) > MAX_BANDS) {
            Logger.warnOnce(`the configured unit results in too many bands, ignoring. Supply a larger unit.`);
            this._encodedBands = [];
            return;
        }

        const { encodedValues, encodingParams } = intervalRangeNumeric(interval, start, stop, rangeParams);
        this._encodedBands = encodedValues;
        this._encodingParams = encodingParams;
    }

    /** Override to return band count without triggering Date materialization */
    public override getBandCountForUpdate(): number {
        this.ensureEncodedBands();
        return this._encodedBands?.length ?? 0;
    }

    override getUniformityCache(visibleRange?: [number, number]): UniformityCheck | undefined {
        const n = this.getBandCountForUpdate();

        // For full range or no visible range, use cached whole-domain check
        if (!visibleRange || (visibleRange[0] === 0 && visibleRange[1] === 1)) {
            if (n > APPROXIMATE_THRESHOLD && this._uniformityCache === undefined) {
                // UnitTimeScale bands are inherently uniform (generated from fixed interval)
                // We can compute the interval from encoding params without materializing bands
                this.ensureEncodedBands();
                if (this._encodingParams != null && this._encodedBands != null && this._encodedBands.length >= 2) {
                    const t0 = encodedToTimestamp(this._encodedBands[0], this._encodingParams);
                    const t1 = encodedToTimestamp(this._encodedBands[1], this._encodingParams);
                    this._uniformityCache = { isUniform: true, interval: t1 - t0 };
                } else {
                    this._uniformityCache = { isUniform: false };
                }
            }
            return this._uniformityCache;
        }

        // For partial visible range, UnitTimeScale is still uniform
        // Compute interval from encoded bands at the visible range boundaries
        this.ensureEncodedBands();
        if (this._encodingParams != null && this._encodedBands != null && this._encodedBands.length >= 2) {
            const t0 = encodedToTimestamp(this._encodedBands[0], this._encodingParams);
            const t1 = encodedToTimestamp(this._encodedBands[1], this._encodingParams);
            return { isUniform: true, interval: t1 - t0 };
        }
        return { isUniform: false };
    }

    override normalizeDomains(...domains: DomainWithMetadata<Date>[]): NormalizedDomain<Date> {
        return normalizeContinuousDomains(...domains);
    }

    private getCachedBandRange(): [Date, Date] | undefined {
        const { domain, interval } = this;
        if (domain.length < 2 || interval == null) return undefined;

        this._bandRangeCache ??= {
            start: intervalFloor(interval, domain[0]),
            stop: intervalFloor(interval, domain[1]),
        };
        return [this._bandRangeCache.start, this._bandRangeCache.stop];
    }

    private getDomainBoundaries(): { d0: number; dNext: number } | undefined {
        const { interval } = this;
        if (interval == null) return undefined;

        if (this._domainBoundaries === undefined) {
            const bandRange = this.getCachedBandRange();
            if (bandRange == null) return undefined;

            const [start, stop] = bandRange;
            const d0 = Math.min(start.valueOf(), stop.valueOf());
            const d1 = Math.max(start.valueOf(), stop.valueOf());
            const dNext = intervalNext(interval, new Date(d1)).valueOf();
            this._domainBoundaries = { d0, dNext };
        }
        return this._domainBoundaries;
    }

    /** Get linear params for O(1) index calculation and scaling metadata */
    public getLinearParams(): { firstBandTime: number; intervalMs: number } | undefined {
        if (this._linearParams === undefined) {
            this.ensureEncodedBands();
            if (this._encodedBands != null && this._encodingParams != null && this._encodedBands.length >= 2) {
                const firstBandTime = encodedToTimestamp(this._encodedBands[0], this._encodingParams);
                const secondBandTime = encodedToTimestamp(this._encodedBands[1], this._encodingParams);
                this._linearParams = {
                    firstBandTime,
                    intervalMs: secondBandTime - firstBandTime,
                };
            }
        }
        return this._linearParams;
    }

    /** Check if current encoding uses a linear unit (exact arithmetic, no DST issues) */
    private isLinearUnit(): boolean {
        const unit = this._encodingParams?.unit;
        return unit === 'millisecond' || unit === 'second' || unit === 'minute' || unit === 'hour';
    }

    /**
     * O(1) findIndex for uniform bands.
     * For linear units (ms/sec/min/hour), uses pure arithmetic without verification.
     * For non-linear units (day/month/year), verifies against actual band values.
     */
    override findIndex(value: Date, alignment: ScaleAlignment = ScaleAlignment.Leading): number | undefined {
        if (value == null) return undefined;

        const n = this.getBandCountForUpdate();
        if (n === 0) return undefined;
        if (n === 1) return 0;

        const linearParams = this.getLinearParams();
        if (linearParams == null || linearParams.intervalMs === 0) {
            // Fall back to binary search
            return super.findIndex(value, alignment);
        }

        const { firstBandTime, intervalMs } = linearParams;
        const target = value.valueOf();

        // O(1) index calculation
        const rawIndex = (target - firstBandTime) / intervalMs;
        let index = alignment === ScaleAlignment.Trailing ? Math.ceil(rawIndex) : Math.floor(rawIndex);

        // Clamp to valid range
        index = Math.max(0, Math.min(index, n - 1));

        // For linear units, the arithmetic is exact - no verification needed
        if (this.isLinearUnit()) {
            // Just check bounds
            if (alignment === ScaleAlignment.Trailing) {
                const bandTime = firstBandTime + index * intervalMs;
                if (bandTime < target && index === n - 1) return undefined;
            } else {
                const bandTime = firstBandTime + index * intervalMs;
                if (bandTime > target && index === 0) return undefined;
            }
            return index;
        }

        // For non-linear units (day/month/year), verify against actual band values
        const numericBands = this.numericBands;
        if (alignment === ScaleAlignment.Trailing) {
            // Find smallest index where band >= target
            while (index > 0 && numericBands[index - 1] >= target) index--;
            while (index < n - 1 && numericBands[index] < target) index++;
            // Return undefined if target > all bands
            if (numericBands[index] < target) return undefined;
        } else {
            // Find largest index where band <= target
            while (index < n - 1 && numericBands[index + 1] <= target) index++;
            while (index > 0 && numericBands[index] > target) index--;
            // Return undefined if target < all bands
            if (numericBands[index] > target) return undefined;
        }

        return index;
    }

    /**
     * Optimized convert for UnitTimeScale with O(1) boundary checks.
     * Uses linear params for fast bounds checking while delegating actual
     * conversion to parent for accuracy in edge cases.
     */
    override convert(value: Date, options?: { clamp?: boolean; alignment?: ScaleAlignment }): number {
        this.refresh();

        if (!(value instanceof Date)) value = new Date(value as any);

        const { domain, interval } = this;
        if (domain.length < 2) return Number.NaN;

        // Boundary check using cached boundaries (O(1))
        if (options?.clamp !== true && interval != null) {
            const boundaries = this.getDomainBoundaries();
            if (boundaries != null) {
                const t = value.valueOf();
                if (t < boundaries.d0 || t >= boundaries.dNext) return Number.NaN;
            }
        }

        return super.convert(value, options);
    }

    private calculateBands(
        domain: Date[],
        visibleRange: [number, number],
        extend: boolean = false
    ): { bands: ArrayLike<Date>; firstBandIndex: number | undefined } {
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

        // Use cached band range when domain matches, otherwise calculate fresh
        const bandRange = domain === this.domain ? this.getCachedBandRange() : calculateBandRange(domain, interval);
        if (bandRange == null) return { bands: [], firstBandIndex: undefined };

        const [start, stop] = bandRange;
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

        let bands: ArrayLike<Date>;
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
            return { ticks: Array.from(bands), count: undefined, firstTickIndex: firstBandIndex };
            /* TODO: restore this
            return { ticks: bands, count: undefined, firstTickIndex: firstBandIndex };
            //*/
        }

        const milliseconds = this.interval ? intervalMilliseconds(this.interval) : Infinity;

        const d0 = Math.min(domain[0].valueOf(), domain[1].valueOf());
        const d1 = Math.max(domain[0].valueOf(), domain[1].valueOf());

        let intervalTicks: ArrayLike<Date>;
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
