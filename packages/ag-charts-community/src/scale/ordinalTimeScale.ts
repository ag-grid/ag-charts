import {
    type DomainInput,
    type NormalizedDomain,
    ScaleAlignment,
    type ScaleTickParams,
    type ScaleTickResult,
    datesSortOrder,
    extractDomain,
    isDomainWithMetadata,
    sortAndUniqueDates,
} from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { ContinuousScale } from './continuousScale';
import { DiscreteTimeScale, type UniformityCheck, checkUniformityBySampling } from './discreteTimeScale';
import { getDateTicksForInterval } from './timeScale';

const APPROXIMATE_THRESHOLD = 1000;

export class OrdinalTimeScale extends DiscreteTimeScale {
    readonly type = 'ordinal-time';
    readonly defaultTickCount = ContinuousScale.defaultTickCount;

    static override is(value: unknown): value is OrdinalTimeScale {
        return value instanceof OrdinalTimeScale;
    }

    private _domain: Date[] = [];
    private isReversed: boolean = false;
    private _uniformityCache: UniformityCheck | undefined;

    override set domain(domain: Date[]) {
        if (domain === this._domain) return;

        this.invalid = true;
        this._domain = domain;
        this._bands = undefined;
        this._numericBands = undefined;
        this._uniformityCache = undefined;
        this.isReversed = domainReversed(domain);
    }
    override get domain(): Date[] {
        return this._domain;
    }

    private _bands: Date[] | undefined;
    get bands() {
        this._bands ??= this.isReversed ? this.domain.slice().reverse() : this.domain;
        return this._bands;
    }

    private _numericBands: number[] | undefined;
    protected override get numericBands(): number[] {
        this._numericBands ??= this.bands.map((d) => d.valueOf());
        return this._numericBands;
    }

    override getUniformityCache(visibleRange?: [number, number]): UniformityCheck | undefined {
        const { bands } = this;
        const n = bands.length;

        // For full range or no visible range, use cached whole-domain check
        if (!visibleRange || (visibleRange[0] === 0 && visibleRange[1] === 1)) {
            if (n > APPROXIMATE_THRESHOLD && this._uniformityCache === undefined) {
                this._uniformityCache = checkUniformityBySampling(bands);
            }
            return this._uniformityCache;
        }

        // For partial visible range, sample within that range (no caching)
        const startIdx = Math.floor(visibleRange[0] * n);
        const endIdx = Math.min(Math.ceil(visibleRange[1] * n), n - 1);
        return checkUniformityBySampling(bands, startIdx, endIdx);
    }

    override normalizeDomains(...domains: DomainInput<Date>[]): NormalizedDomain<Date> {
        const nonEmptyDomains = domains.filter((d) => extractDomain(d).length > 0);

        if (nonEmptyDomains.length === 0) {
            return { domain: [], animatable: false };
        } else if (nonEmptyDomains.length === 1) {
            const input = nonEmptyDomains[0];
            let domain = extractDomain(input);

            // OPTIMIZATION: Use pre-computed metadata when available to skip O(n) datesSortOrder scan
            let sortOrder: 1 | -1 | undefined;
            let isUnique = false;

            if (isDomainWithMetadata(input) && input.sortMetadata?.sortOrder !== undefined) {
                sortOrder = input.sortMetadata.sortOrder;
                isUnique = input.sortMetadata.isUnique ?? false;
            } else {
                // Fallback to scanning when metadata not available
                sortOrder = datesSortOrder(domain);
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
            domain: sortAndUniqueDates(nonEmptyDomains.map(extractDomain).flat()),
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
        const { bands } = this;

        if (!bands.length) return;

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

        const dateTicks =
            getDateTicksForInterval({ start, stop, interval, availableRange, visibleRange, extend }) ??
            this.getDefaultTicks(domain, tickCount, visibleRange, extend).ticks;

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

        return { ticks, count: undefined, firstTickIndex: undefined };
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
