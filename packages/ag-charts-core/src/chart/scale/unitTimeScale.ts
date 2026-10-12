import type { AgTimeInterval, AgTimeIntervalUnit, AgTimeValue } from 'ag-charts-types';

import { findMaxIndex, findMinIndex } from '../../data/binarySearch';
import type { IntervalRangeNumericResult } from '../../time/range';
import {
    decodeIntervalValue,
    encodedToTimestamp,
    intervalFloor,
    intervalNext,
    intervalRange,
    intervalRangeCount,
    intervalRangeNumeric,
} from '../../time/range';
import { timeValueToNumber } from '../../time/timeFormatDefaults';
import { intervalMilliseconds, toTimeInterval } from '../../time/timeInterval';
import type { DomainWithMetadata, NormalizedDomain, ScaleTickParams, ScaleTickResult } from '../../types/scales';
import { ScaleAlignment } from '../../types/scales';
import { normalizeContinuousDomains } from './continuousScale';
import { DiscreteTimeScale, type UniformityCheck } from './discreteTimeScale';

const APPROXIMATE_THRESHOLD = 1000;

const MAX_BANDS = 50e6; // Max array length is ~4bn

export class UnitTimeScale extends DiscreteTimeScale {
    static override is(value: unknown): value is UnitTimeScale {
        return value instanceof UnitTimeScale;
    }

    override readonly type = 'unit-time';

    override readonly defaultTickCount = Infinity;

    static supportsInterval(domain: Date[], interval: AgTimeInterval | AgTimeIntervalUnit) {
        return supportsInterval(domain, interval);
    }

    private _domain: Date[] = [];
    private _bandRangeCache: { start: Date; stop: Date } | undefined;
    /** Entry for the current domain and interval, or undefined until resolved. */
    private _active: BandEntry | undefined;
    /** Last entry built for a band range; outlives temporary domain swaps, including to `[]`. */
    private _kept: BandEntry | undefined;
    private _emptyEntry: BandEntry | undefined;

    override set domain(domain: Date[]) {
        if (domain === this._domain) return;

        // Value equality check — preserves caches across withTemporaryDomain calls
        // when the domain endpoints are unchanged. Domains are always [min, max] (length 2).
        const skipCacheInvalidation =
            domain.length === this._domain.length &&
            domain.length >= 2 &&
            domain[0].valueOf() === this._domain[0].valueOf() &&
            domain[1].valueOf() === this._domain[1].valueOf();

        this._domain = domain;

        if (!skipCacheInvalidation) {
            this.invalidateBandRange();
        }
    }
    override get domain(): Date[] {
        return this._domain;
    }

    private _interval: AgTimeInterval | undefined;
    get interval(): AgTimeInterval | undefined {
        return this._interval;
    }
    set interval(interval: AgTimeInterval | AgTimeIntervalUnit | undefined) {
        const normalized = interval == null ? undefined : toTimeInterval(interval);
        if (this._interval?.unit === normalized?.unit && this._interval?.step === normalized?.step) return;

        this._interval = normalized;
        this.invalidateBandRange();
    }

    /** Only drops the floored endpoints; band caches are revalidated against them in `entry`. */
    private invalidateBandRange() {
        this._bandRangeCache = undefined;
        this._active = undefined;
    }

    private get entry(): BandEntry {
        return this._active ?? this.resolveEntry();
    }

    private resolveEntry(): BandEntry {
        const entry = this.findOrBuildEntry();
        this._active = entry;
        return entry;
    }

    private findOrBuildEntry(): BandEntry {
        const { interval } = this;
        const bandRange = this.getCachedBandRange();
        if (bandRange == null || interval == null) {
            this._emptyEntry ??= createBandEntry(undefined, undefined);
            return this._emptyEntry;
        }

        const [start, stop] = bandRange;
        const kept = this._kept;
        if (kept?.key != null && sameBandKey(kept.key, start, stop, interval)) return kept;

        const key = bandKey(start, stop, interval);
        const rangeParams = { visibleRange: [0, 1] as [number, number], extend: false };
        if (intervalRangeCount(interval, start, stop, rangeParams) > MAX_BANDS) {
            this.logger.warnOnce(`the configured unit results in too many bands, ignoring. Supply a larger unit.`);
            // Not kept: a valid entry for another range stays available for when the domain returns to it.
            return createBandEntry(key, undefined);
        }

        const entry = createBandEntry(key, intervalRangeNumeric(interval, start, stop, rangeParams));
        this._kept = entry;
        return entry;
    }

    get bands(): readonly Date[] {
        const entry = this.entry;
        if (entry.bands === undefined) {
            // Lazily decode from encoded bands
            const params = entry.encodingParams;
            entry.bands = params == null ? [] : entry.encodedBands.map((e) => decodeIntervalValue(e, params));
        }
        return entry.bands;
    }

    protected override get numericBands(): number[] {
        const entry = this.entry;
        if (entry.numericBands === undefined) {
            // Compute timestamps from encoded bands without creating Date objects first
            const params = entry.encodingParams;
            entry.numericBands = params == null ? [] : entry.encodedBands.map((e) => encodedToTimestamp(e, params));
        }
        return entry.numericBands;
    }

    /** Override to return band count without triggering Date materialization */
    public override getBandCountForUpdate(): number {
        return this.entry.encodedBands.length;
    }

    override getUniformityCache(visibleRange?: [number, number]): UniformityCheck | undefined {
        const entry = this.entry;
        const { encodedBands, encodingParams } = entry;
        const n = encodedBands.length;

        // For full range or no visible range, use cached whole-domain check
        if (!visibleRange || (visibleRange[0] === 0 && visibleRange[1] === 1)) {
            if (n > APPROXIMATE_THRESHOLD && entry.uniformityCache === undefined) {
                // UnitTimeScale bands are inherently uniform (generated from fixed interval)
                // We can compute the interval from encoding params without materializing bands
                if (encodingParams != null && n >= 2) {
                    const t0 = encodedToTimestamp(encodedBands[0], encodingParams);
                    const t1 = encodedToTimestamp(encodedBands[1], encodingParams);
                    entry.uniformityCache = { isUniform: true, interval: t1 - t0 };
                } else {
                    entry.uniformityCache = { isUniform: false };
                }
            }
            return entry.uniformityCache;
        }

        // For partial visible range, UnitTimeScale is still uniform
        // Compute interval from encoded bands at the visible range boundaries
        if (encodingParams != null && n >= 2) {
            const t0 = encodedToTimestamp(encodedBands[0], encodingParams);
            const t1 = encodedToTimestamp(encodedBands[1], encodingParams);
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
        const entry = this.entry;
        if (interval == null || entry.key == null) return undefined;

        if (entry.domainBoundaries === undefined) {
            const { start, stop } = entry.key;
            const d0 = Math.min(start, stop);
            const d1 = Math.max(start, stop);
            const dNext = intervalNext(interval, new Date(d1)).valueOf();
            entry.domainBoundaries = { d0, dNext };
        }
        return entry.domainBoundaries;
    }

    protected override get lastBandEnd(): number {
        return this.getDomainBoundaries()?.dNext ?? super.lastBandEnd;
    }

    /** Get linear params for O(1) index calculation and scaling metadata */
    public getLinearParams(): { firstBandTime: number; intervalMs: number } | undefined {
        const entry = this.entry;
        if (entry.linearParams === undefined) {
            const { encodedBands, encodingParams } = entry;
            if (encodingParams != null && encodedBands.length >= 2) {
                const firstBandTime = encodedToTimestamp(encodedBands[0], encodingParams);
                const secondBandTime = encodedToTimestamp(encodedBands[1], encodingParams);
                entry.linearParams = {
                    firstBandTime,
                    intervalMs: secondBandTime - firstBandTime,
                };
            }
        }
        return entry.linearParams;
    }

    /** Check if current encoding uses a linear unit (exact arithmetic, no DST issues) */
    private isLinearUnit(): boolean {
        const unit = this.entry.encodingParams?.unit;
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
    override convert(value: AgTimeValue, options?: { clamp?: boolean; alignment?: ScaleAlignment }): number {
        this.refresh();

        if (!(value instanceof Date)) value = new Date(timeValueToNumber(value));

        const { domain, interval } = this;
        if (domain.length < 2) return Number.NaN;

        // Boundary check using cached boundaries (O(1))
        if (options?.clamp !== true && interval != null) {
            const boundaries = this.getDomainBoundaries();
            if (boundaries != null) {
                const t = value.valueOf();
                if (t < boundaries.d0 || t >= boundaries.dNext) {
                    // Extrapolate out-of-bounds values so series connect to the axis edge rather than dropping.
                    return super.convert(value, { ...options, alignment: ScaleAlignment.Interpolate });
                }
            }
        }

        return super.convert(value, options);
    }

    override ticks(
        { interval }: ScaleTickParams<AgTimeInterval | AgTimeIntervalUnit | number>,
        domain: Date[] = this.domain,
        visibleRange: [number, number] = [0, 1]
    ): ScaleTickResult<Date> | undefined {
        const numBands = this.numericBands;
        if (numBands.length === 0 || domain.length < 2) return;

        const d0 = Math.min(domain[0].valueOf(), domain[1].valueOf());
        const d1 = Math.max(domain[0].valueOf(), domain[1].valueOf());

        // Compute the band index range for the requested domain + visibleRange
        const [iStart, iEnd] = this.visibleBandRange(d0, d1, visibleRange);

        // No interval — return all bands in range
        if (interval == null) {
            return {
                ticks: numBands.slice(iStart, iEnd).map((t) => new Date(t)),
                count: undefined,
                firstTickIndex: iStart,
            };
        }

        // Generate interval-aligned candidate timestamps, snap to bands, deduplicate
        const candidates = this.intervalCandidates(interval, domain, visibleRange);
        const ticks = this.snapCandidatesToBands(candidates, numBands, iStart, iEnd);

        return {
            ticks: ticks.map((t) => new Date(t)),
            count: ticks.length,
            firstTickIndex: iStart,
        };
    }

    /** Compute band slice indices for a domain range + visible range. */
    private visibleBandRange(d0: number, d1: number, visibleRange: [number, number]): [number, number] {
        const numBands = this.numericBands;
        const n = numBands.length;
        if (n === 0) return [0, 0];

        const span = d1 - d0;
        const windowStart = d0 + visibleRange[0] * span;
        const windowEnd = d0 + visibleRange[1] * span;

        const iStart = findMaxIndex(0, n - 1, (i) => numBands[i] <= windowStart) ?? 0;
        const iEnd = (findMinIndex(0, n - 1, (i) => numBands[i] >= windowEnd) ?? n - 1) + 1;

        return [iStart, iEnd];
    }

    /** Generate interval-aligned candidate timestamps. */
    private intervalCandidates(
        interval: AgTimeInterval | AgTimeIntervalUnit | number,
        domain: Date[],
        visibleRange: [number, number]
    ): number[] {
        if (typeof interval !== 'number') {
            return intervalRange(interval, domain[0], domain[1], { extend: true, visibleRange }).map((d) =>
                d.valueOf()
            );
        }
        // Numeric interval — bands themselves are the tick candidates
        return this.numericBands;
    }

    /** Snap candidate timestamps to the nearest band, deduplicating. */
    private snapCandidatesToBands(candidates: number[], numBands: number[], iStart: number, iEnd: number): number[] {
        const milliseconds = this.interval ? intervalMilliseconds(this.interval) : Infinity;
        const ticks: number[] = [];
        let lastBandIndex = -1;

        for (const candidate of candidates) {
            if (candidate < numBands[iStart] || candidate > numBands[iEnd - 1] + milliseconds) continue;

            const bandIndex = findMaxIndex(iStart, iEnd - 1, (i) => numBands[i] <= candidate);
            if (bandIndex != null && bandIndex !== lastBandIndex && candidate - numBands[bandIndex] <= milliseconds) {
                ticks.push(numBands[bandIndex]);
                lastBandIndex = bandIndex;
            }
        }

        return ticks;
    }
}

interface BandKey {
    start: number;
    stop: number;
    unit: AgTimeIntervalUnit;
    step: number | undefined;
    epoch: number | undefined;
    utc: boolean | undefined;
}

/** Band-derived caches for one band range and interval. */
interface BandEntry {
    key: BandKey | undefined;
    /** Encoded band values (internal encoding, not timestamps) */
    encodedBands: number[];
    /** Encoding params needed to decode encoded bands to Date/timestamp */
    encodingParams: IntervalRangeNumericResult['encodingParams'] | undefined;
    bands: Date[] | undefined;
    numericBands: number[] | undefined;
    uniformityCache: UniformityCheck | undefined;
    domainBoundaries: { d0: number; dNext: number } | undefined;
    /** Cached linear params for O(1) findIndex */
    linearParams: { firstBandTime: number; intervalMs: number } | undefined;
}

function createBandEntry(key: BandKey | undefined, result: IntervalRangeNumericResult | undefined): BandEntry {
    return {
        key,
        encodedBands: result?.encodedValues ?? [],
        encodingParams: result?.encodingParams,
        bands: undefined,
        numericBands: undefined,
        uniformityCache: undefined,
        domainBoundaries: undefined,
        linearParams: undefined,
    };
}

function bandKey(start: Date, stop: Date, { unit, step, epoch, utc }: AgTimeInterval): BandKey {
    return { start: start.valueOf(), stop: stop.valueOf(), unit, step, epoch: epoch?.valueOf(), utc };
}

function sameBandKey(key: BandKey, start: Date, stop: Date, { unit, step, epoch, utc }: AgTimeInterval): boolean {
    return (
        key.start === start.valueOf() &&
        key.stop === stop.valueOf() &&
        key.unit === unit &&
        key.step === step &&
        key.epoch === epoch?.valueOf() &&
        key.utc === utc
    );
}

function supportsInterval(
    domain: Date[],
    interval: AgTimeInterval | AgTimeIntervalUnit,
    rangeParams?: { visibleRange?: [number, number]; extend?: boolean }
): boolean {
    const start = intervalFloor(interval, domain[0]);
    const stop = intervalFloor(interval, domain[1]);
    return intervalRangeCount(interval, start, stop, rangeParams) <= MAX_BANDS;
}
