import { findMaxIndex, findMinIndex } from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { datesSortOrder, sortAndUniqueDates } from '../util/date';
import { ContinuousScale } from './continuousScale';
import { DiscreteTimeScale } from './discreteTimeScale';
import { type NormalizedDomain, ScaleAlignment, type ScaleTickParams, type ScaleTickResult } from './scale';
import { getDateTicksForInterval } from './timeScale';

export class OrdinalTimeScale extends DiscreteTimeScale {
    readonly type = 'ordinal-time';
    readonly defaultTickCount = ContinuousScale.defaultTickCount;

    static override is(value: unknown): value is OrdinalTimeScale {
        return value instanceof OrdinalTimeScale;
    }

    private _domain: Date[] = [];
    private isReversed: boolean = false;
    override set domain(domain: Date[]) {
        if (domain === this._domain) return;

        this.invalid = true;
        this._domain = domain;
        this._bands = undefined;
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

    override normalizeDomains(...domains: Date[][]): NormalizedDomain<Date> {
        const sortedDomains = domains.filter((domain) => domain.length > 0);

        if (sortedDomains.length === 0) {
            return { domain: [], animatable: false };
        } else if (sortedDomains.length === 1) {
            let domain = sortedDomains[0];
            const sortOrder = datesSortOrder(domain);
            if (sortOrder === -1) {
                domain = domain.slice().reverse();
            } else if (sortOrder == null) {
                domain = sortAndUniqueDates(domain.slice());
            }
            return { domain, animatable: true };
        }

        return {
            domain: sortAndUniqueDates(sortedDomains.flat()),
            animatable: true,
        };
    }

    override ticks(
        {
            interval,
            maxTickCount,
            tickCount = maxTickCount,
        }: ScaleTickParams<AgTimeInterval | AgTimeIntervalUnit | number>,
        domain?: Date[],
        visibleRange: [number, number] = [0, 1],
        // Only used for OrdinalTimeScale
        extend = false
    ): ScaleTickResult<Date> | undefined {
        const { bands } = this;

        if (!bands.length) return;

        this.refresh();

        if (interval == null) {
            return {
                ticks: getDefaultTicks(bands, domain, tickCount, visibleRange, extend),
                count: undefined,
            };
        }

        let start: number;
        let stop: number;
        if (domain && domain.length >= 2) {
            start = domain[0].valueOf();
            stop = domain[domain.length - 1].valueOf();
        } else {
            start = bands[0].valueOf();
            stop = bands[bands.length - 1].valueOf();
        }

        const [r0, r1] = this.range;
        const availableRange = Math.abs(r1 - r0);

        const dateTicks =
            getDateTicksForInterval({ start, stop, interval, availableRange, visibleRange, extend }) ??
            getDefaultTicks(bands, domain, tickCount, visibleRange, extend);

        const ticks: Date[] = [];
        let lastIndex = -1;
        for (const dateTick of dateTicks) {
            const index = this.findIndex(dateTick, ScaleAlignment.Trailing) ?? -1;
            const duplicated = index === lastIndex;
            lastIndex = index;

            if (index !== -1 && !duplicated) {
                ticks.push(bands[index]);
            }
        }

        return {
            ticks,
            count: undefined,
        };
    }

    stepTicks(bandStep: number, domain?: Date[], visibleRange: [number, number] = [0, 1], dropLast = true): Date[] {
        const { bands } = this;
        const bandIndices = domain ? bandDomainIndices(bands, domain) : undefined;

        const ticks = ticksEvery(bands, bandIndices, visibleRange, bandStep, 0, false);
        const lastTick = ticks.at(-1);
        const lastTickIndex =
            dropLast && bandStep > 1 && bandIndices && lastTick ? this.findIndex(lastTick) : undefined;
        if (lastTickIndex != null && bandIndices != null && bandIndices[1] - lastTickIndex <= bandStep) {
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
}

function domainReversed(domain: Date[]): boolean {
    return domain.length > 0 && domain[0] > domain[domain.length - 1];
}

function bandDomainIndices(bands: Date[], domain: Date[]): [number, number] {
    const isReversed = domainReversed(domain);
    const d0 = domain[isReversed ? domain.length - 1 : 0].valueOf();
    const d1 = domain[isReversed ? 0 : domain.length - 1].valueOf();
    const i0 = findMinIndex(0, bands.length - 1, (index) => bands[index].valueOf() >= d0) ?? 0;
    const i1 = findMaxIndex(0, bands.length - 1, (index) => bands[index].valueOf() <= d1) ?? bands.length - 1;
    return [i0, i1 + 1];
}

function getDefaultTicks(
    bands: Date[],
    domain: Date[] | undefined,
    maxTickCount: number,
    visibleRange: [number, number],
    extend: boolean
): Date[] {
    const tickEvery = Math.ceil(bands.length / maxTickCount);
    const tickOffset = Math.floor(tickEvery / 2);
    const bandIndices = domain ? bandDomainIndices(bands, domain) : undefined;

    return ticksEvery(bands, bandIndices, visibleRange, tickEvery, tickOffset, extend);
}

function ticksEvery(
    bands: Date[],
    [i0, i1]: [number, number] = [0, bands.length],
    visibleRange: [number, number],
    tickEvery: number,
    tickOffset: number,
    extend: boolean
): Date[] {
    const offset = i0;
    const length = i1 - i0;

    let startIndex = offset + Math.floor(visibleRange[0] * length);
    let endIndex = offset + Math.ceil(visibleRange[1] * length);

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
