import { findMinIndex } from 'ag-charts-core';
import type { TimeInterval, TimeIntervalUnit } from 'ag-charts-types';

import { datesSortOrder, sortAndUniqueDates } from '../util/date';
import { DiscreteTimeScale } from './discreteTimeScale';
import type { NormalizedDomain, ScaleTickParams, ScaleTickResult } from './scale';
import { getDateTicksForInterval } from './timeScale';

export class OrdinalTimeScale extends DiscreteTimeScale {
    readonly type = 'ordinal-time';

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
        this.isReversed = domain.length > 0 && domain[0] > domain[domain.length - 1];
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
        { interval, maxTickCount }: ScaleTickParams<TimeInterval | TimeIntervalUnit | number>,
        domain: Date[] = this.domain,
        visibleRange: [number, number] = [0, 1],
        // Only used for OrdinalTimeScale
        extend = false
    ): ScaleTickResult<Date> | undefined {
        if (!domain.length) return;

        this.refresh();

        const { isReversed } = this;
        if (interval == null) {
            return {
                ticks: getDefaultTicks(domain, maxTickCount, isReversed, visibleRange, extend),
                count: undefined,
            };
        }

        const start = domain[0].valueOf();
        const stop = domain[domain.length - 1].valueOf();

        const [r0, r1] = this.range;
        const availableRange = Math.abs(r1 - r0);

        let ticks =
            getDateTicksForInterval({ start, stop, interval, availableRange, visibleRange, extend }) ??
            getDefaultTicks(domain, maxTickCount, isReversed, visibleRange, extend);

        let lastIndex = -1;
        ticks = ticks.filter((tick) => {
            const index = this.findIndex(tick) ?? -1;
            const duplicated = index === lastIndex;
            lastIndex = index;

            return !duplicated;
        });

        return {
            ticks,
            count: undefined,
        };
    }

    override findIndex(value: Date): number | undefined {
        const { bands } = this;
        const target = value.valueOf();
        return findMinIndex(0, bands.length - 1, (index) => bands[index].valueOf() >= target);
    }
}

function getDefaultTicks(
    domain: Date[],
    maxTickCount: number,
    isReversed: boolean,
    visibleRange: [number, number],
    extend: boolean
) {
    const ticks: Date[] = [];
    const tickEvery = Math.ceil(domain.length / maxTickCount);
    const tickOffset = Math.floor(tickEvery / 2);

    let startIndex = Math.floor(visibleRange[0] * domain.length);
    let endIndex = Math.ceil(visibleRange[1] * domain.length);

    if (extend) {
        if (startIndex > tickEvery) startIndex -= tickEvery;
        if (endIndex < domain.length - tickEvery) endIndex += tickEvery;
    }

    for (let index = startIndex; index < endIndex; index += 1) {
        const tickIndex = isReversed ? domain.length - 1 - index : index;
        if (tickEvery <= 0 || (tickIndex + tickOffset) % tickEvery === 0) {
            ticks.push(domain[index]);
        }
    }

    return ticks;
}
