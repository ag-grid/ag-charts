import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { datesSortOrder, sortAndUniqueDates } from '../../time/date';
import {
    type DomainWithMetadata,
    type NormalizedDomain,
    ScaleAlignment,
    type ScaleTickParams,
    type ScaleTickResult,
} from '../../types/scales';
import { ContinuousScale } from './continuousScale';
import { DiscreteTimeScale, type UniformityCheck, checkUniformityBySampling } from './discreteTimeScale';
import { getDateTicksForInterval } from './timeScale';

const APPROXIMATE_THRESHOLD = 1000;

/** Lazily built values derived from one domain array; dropped as a unit when the domain changes. */
interface BandCache {
    bands?: Date[];
    numericBands?: number[];
    uniformity?: UniformityCheck;
    uniformityVisibleStart?: number;
    uniformityVisibleEnd?: number;
    uniformityVisible?: UniformityCheck;
}

export class OrdinalTimeScale extends DiscreteTimeScale {
    readonly type = 'ordinal-time';
    readonly defaultTickCount = ContinuousScale.defaultTickCount;

    static override is(value: unknown): value is OrdinalTimeScale {
        return value instanceof OrdinalTimeScale;
    }

    private _domain: Date[] = [];
    private isReversed: boolean = false;
    private _cache: BandCache = {};
    /** The domain captured by `snapshotDomain`, with the caches built for it, until the matching `restoreDomain`. */
    private _snapshot: { domain: Date[]; cache: BandCache } | undefined;
    /**
     * The temporary domain `restoreDomain` swapped out, with its caches. Tick generation sets that domain more
     * than once and the axis then adopts it, so the next `domain` set reuses these rather than rebuilding them;
     * any other set drops them, which bounds this to the gap between a restore and the next domain change.
     */
    private _kept: { domain: Date[]; cache: BandCache } | undefined;

    override set domain(domain: Date[]) {
        if (domain === this._domain) return;

        const kept = this._kept;
        this._kept = undefined;
        this.invalid = true;
        this._domain = domain;
        this._cache = kept?.domain === domain ? kept.cache : {};
        this.isReversed = domainReversed(domain);
    }
    override get domain(): Date[] {
        return this._domain;
    }

    /**
     * Tick generation swaps in a temporary domain and back. Carry the caches built for either domain through
     * that round trip, rather than rebuilding them (one `Date` -> number pass per band) on each swap.
     */
    override snapshotDomain(): Date[] {
        const domain = this._domain;
        this._snapshot = { domain, cache: this._cache };
        return domain;
    }

    override restoreDomain(snapshot: Date[]): void {
        const snapped = this._snapshot;
        this._snapshot = undefined;
        if (snapshot === this._domain) return;

        const temporary = { domain: this._domain, cache: this._cache };
        this.domain = snapshot;
        if (snapped?.domain === snapshot) {
            this._cache = snapped.cache;
        }
        this._kept = temporary;
    }

    get bands() {
        this._cache.bands ??= this.isReversed ? this.domain.slice().reverse() : this.domain;
        return this._cache.bands;
    }

    protected override get numericBands(): number[] {
        this._cache.numericBands ??= this.bands.map((d) => d.valueOf());
        return this._cache.numericBands;
    }

    override getUniformityCache(visibleRange?: [number, number]): UniformityCheck | undefined {
        const { bands } = this;
        const cache = this._cache;
        const n = bands.length;

        // For full range or no visible range, use cached whole-domain check
        if (!visibleRange || (visibleRange[0] === 0 && visibleRange[1] === 1)) {
            if (n > APPROXIMATE_THRESHOLD && cache.uniformity === undefined) {
                cache.uniformity = checkUniformityBySampling(bands);
            }
            return cache.uniformity;
        }

        // Partial-range result cached by (startIdx, endIdx) — per-datum render loops re-call with the same visibleRange.
        const startIdx = Math.floor(visibleRange[0] * n);
        const endIdx = Math.min(Math.ceil(visibleRange[1] * n), n - 1);
        if (
            cache.uniformityVisible !== undefined &&
            cache.uniformityVisibleStart === startIdx &&
            cache.uniformityVisibleEnd === endIdx
        ) {
            return cache.uniformityVisible;
        }
        const result = checkUniformityBySampling(bands, startIdx, endIdx);
        cache.uniformityVisibleStart = startIdx;
        cache.uniformityVisibleEnd = endIdx;
        cache.uniformityVisible = result;
        return result;
    }

    override normalizeDomains(...domains: DomainWithMetadata<Date>[]): NormalizedDomain<Date> {
        const nonEmptyDomains = domains.filter((d) => d.domain.length > 0);

        if (nonEmptyDomains.length === 0) {
            return { domain: [], animatable: false };
        }

        // Check if all domains are the same array reference (common in Financial Charts)
        const firstDomain = nonEmptyDomains[0].domain;
        const allSame = nonEmptyDomains.every((d) => d.domain === firstDomain);

        if (nonEmptyDomains.length === 1 || allSame) {
            const input = nonEmptyDomains[0];
            let domain = input.domain;

            // OPTIMIZATION: Use pre-computed metadata when available to skip O(n) datesSortOrder scan
            let sortOrder: 1 | -1 | undefined;
            let isUnique = false;

            if (input.sortMetadata?.sortOrder === undefined) {
                // Fallback to scanning when metadata not available
                sortOrder = datesSortOrder(domain);
            } else {
                sortOrder = input.sortMetadata.sortOrder;
                isUnique = input.sortMetadata.isUnique ?? false;
            }

            if (sortOrder === -1) {
                domain = domain.slice().reverse();
            } else if (sortOrder == null) {
                // Need to sort; skip deduplication if we know data is unique
                domain = isUnique
                    ? domain.slice().sort((a, b) => a.valueOf() - b.valueOf())
                    : sortAndUniqueDates(domain.slice());
            }
            // If sortOrder === 1, domain is already in ascending order - use as-is
            return { domain, animatable: true };
        }

        // Multiple domains - must merge and sort, metadata not applicable
        return {
            domain: sortAndUniqueDates(nonEmptyDomains.flatMap((d) => d.domain)),
            animatable: true,
        };
    }

    override ticks(
        params: ScaleTickParams<AgTimeInterval | AgTimeIntervalUnit | number>,
        domain?: Date[],
        visibleRange: [number, number] = [0, 1],
        { extend = false, dropInitial = false } = {}
    ): ScaleTickResult<Date> | undefined {
        const { interval, maxTickCount, tickCount = maxTickCount } = params;
        const { bands, reversed } = this;

        if (bands.length === 0) return;

        if (reversed) {
            visibleRange = [1 - visibleRange[1], 1 - visibleRange[0]];
        }

        this.refresh();

        if (interval == null) {
            const { ticks, tickOffset, tickEvery } = this.getDefaultTicks(domain, tickCount, visibleRange, extend);
            let firstTickIndex = ticks.length > 0 ? this.findIndex(ticks[0]) : undefined;
            firstTickIndex = firstTickIndex == null ? undefined : Math.floor((firstTickIndex - tickOffset) / tickEvery);
            return { ticks, count: undefined, firstTickIndex };
        }

        let start: number;
        let stop: number;
        if (domain && domain.length >= 2) {
            start = domain[0].valueOf();
            stop = domain.at(-1)!.valueOf();
        } else {
            start = bands[0].valueOf();
            stop = bands.at(-1)!.valueOf();
        }

        const [r0, r1] = this.range;
        const availableRange = Math.abs(r1 - r0);

        const intervalTicks = getDateTicksForInterval({
            start,
            stop,
            interval,
            availableRange,
            visibleRange,
            extend,
            logger: this.logger,
        });
        // A rejected interval leaves automatic ticks driven by tickCount, so the axis overlap search
        // must keep thinning them rather than stopping after its first pass.
        const intervalIgnored = intervalTicks == null;
        const dateTicks = intervalTicks ?? this.getDefaultTicks(domain, tickCount, visibleRange, extend).ticks;

        const ticks: Date[] = [];
        let lastIndex = -1;
        for (const dateTick of dateTicks) {
            const index = this.findIndex(dateTick, ScaleAlignment.Trailing) ?? -1;
            const duplicated = index === lastIndex;
            lastIndex = index;

            if (!(dropInitial && index === 0) && index !== -1 && !duplicated) {
                ticks.push(bands[index]);
            }
        }

        const result: ScaleTickResult<Date> = { ticks, count: undefined, firstTickIndex: undefined };
        if (intervalIgnored) result.intervalIgnored = true;
        return result;
    }

    stepTicks(bandStep: number, domain?: Date[], visibleRange: [number, number] = [0, 1], dropLast = true): Date[] {
        const bandIndices = domain ? this.bandDomainIndices(domain) : undefined;

        const ticks = this.ticksEvery(bandIndices, visibleRange, bandStep, 0, false);
        const lastTick = ticks.at(-1);
        const lastBandIndex = dropLast && bandStep > 1 ? bandIndices?.[1] : undefined;
        const lastTickIndex = lastBandIndex != null && lastTick != null ? this.findIndex(lastTick) : undefined;

        if (lastTickIndex != null && lastBandIndex != null && lastBandIndex - lastTickIndex < bandStep) {
            // If the tick is too close to the end of the domain, remove it
            ticks.pop();
        }

        return ticks;
    }

    bandCount(visibleRange: [number, number] = [0, 1]): number {
        const { domain } = this;
        const startIndex = Math.floor(visibleRange[0] * domain.length);
        const endIndex = Math.ceil(visibleRange[1] * domain.length);

        return endIndex - startIndex;
    }

    private getDefaultTicks(
        domain: Date[] | undefined,
        maxTickCount: number,
        visibleRange: [number, number],
        extend: boolean
    ): { ticks: Date[]; tickOffset: number; tickEvery: number } {
        const { bands } = this;
        const tickEvery = Math.ceil(bands.length / maxTickCount);
        const tickOffset = Math.floor(tickEvery / 2);
        const bandIndices = domain ? this.bandDomainIndices(domain) : undefined;

        return {
            ticks: this.ticksEvery(bandIndices, visibleRange, tickEvery, tickOffset, extend),
            tickOffset,
            tickEvery,
        };
    }

    private bandDomainIndices(domain: Date[]): [number, number] {
        const isReversed = domainReversed(domain);
        const i0 = this.findIndex(domain[isReversed ? domain.length - 1 : 0], ScaleAlignment.Trailing) ?? 0;
        const i1 =
            this.findIndex(domain[isReversed ? 0 : domain.length - 1], ScaleAlignment.Trailing) ??
            this.bands.length - 1;
        return [i0, i1];
    }

    private ticksEvery(
        [i0, i1]: [number, number] = [0, this.bands.length],
        visibleRange: [number, number],
        tickEvery: number,
        tickOffset: number,
        extend: boolean
    ): Date[] {
        const { bands } = this;
        const offset = i0;
        const span = i1 - i0 + 1;

        let startIndex = offset + Math.floor(visibleRange[0] * span);
        let endIndex = offset + Math.ceil(visibleRange[1] * span);

        if (extend) {
            startIndex -= tickEvery;
            endIndex += tickEvery;
        }

        startIndex = Math.max(startIndex, 0);
        endIndex = Math.min(endIndex, bands.length);

        let ticks: Date[];
        if (tickEvery <= 1) {
            ticks = bands.slice(startIndex, endIndex);
        } else {
            ticks = [];
            for (let index = startIndex; index < endIndex; index += 1) {
                if ((index - offset + tickOffset) % tickEvery === 0) {
                    ticks.push(bands[index]);
                }
            }
        }

        return ticks;
    }
}

function domainReversed(domain: Date[]): boolean {
    return domain.length > 0 && domain[0] > domain.at(-1)!;
}
