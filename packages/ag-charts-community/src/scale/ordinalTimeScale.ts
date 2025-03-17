import { findMinValue } from 'ag-charts-core';

import { datesSortOrder, sortAndUniqueDates } from '../util/date';
import type { TimeInterval } from '../util/time';
import { buildFormatter } from '../util/timeFormat';
import { dateToNumber, defaultTimeTickFormat } from '../util/timeFormatDefaults';
import { BandScale } from './bandScale';
import type { NormalizedDomain, ScaleFormatParams, ScaleTickParams } from './scale';
import { getDateTicksForInterval } from './timeScale';

export class OrdinalTimeScale extends BandScale<Date, TimeInterval | number> {
    readonly type = 'ordinal-time';

    static override is(value: unknown): value is OrdinalTimeScale {
        return value instanceof OrdinalTimeScale;
    }

    private _domain: Date[] = [];
    private sortedTimestamps: number[] | undefined;
    private isReversed: boolean = false;
    private precomputedSteps: Int32Array | undefined;
    override set domain(domain: Date[]) {
        if (domain === this._domain) return;

        this.invalid = true;
        this._domain = domain;
        this.isReversed = domain.length > 0 && domain[0] > domain[domain.length - 1];

        this.sortedTimestamps = undefined;
        this.precomputedSteps = undefined;
    }
    override get domain(): Date[] {
        return this._domain;
    }

    override toDomain(value: number): Date {
        return new Date(value);
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
        { interval, maxTickCount }: ScaleTickParams<TimeInterval | number>,
        domain: Date[] = this.domain,
        visibleRange: [number, number] = [0, 1]
    ): Date[] {
        if (!domain.length) {
            return [];
        }

        this.refresh();

        const { isReversed } = this;
        if (interval == null) {
            return getDefaultTicks(domain, maxTickCount, isReversed, visibleRange);
        }

        const [t0, t1] = [domain[0].valueOf(), domain.at(-1)!.valueOf()];
        const start = Math.min(t0, t1);
        const stop = Math.max(t0, t1);

        const [r0, r1] = this.range;
        const availableRange = Math.abs(r1 - r0);

        const ticks = getDateTicksForInterval({ start, stop, interval, availableRange, visibleRange }) ?? [];

        let lastIndex = -1;
        return ticks.filter((tick) => {
            const index = this.findInterval(tick.valueOf());
            const duplicated = index === lastIndex;
            lastIndex = index;

            return !duplicated;
        });
    }

    private getSortedTimestamps() {
        let { sortedTimestamps } = this;

        if (sortedTimestamps == null) {
            sortedTimestamps = this.domain.map<number>(dateToNumber);
            if (this.isReversed) sortedTimestamps.reverse();

            this.sortedTimestamps = sortedTimestamps;
        }

        return sortedTimestamps;
    }

    private getPrecomputedSteps() {
        const { domain } = this;
        let { precomputedSteps } = this;
        const computedStepCount = domain.length < 1e4 ? domain.length : Math.ceil(domain.length / 16);

        if (precomputedSteps != null || computedStepCount <= 1) return precomputedSteps;

        const sortedTimestamps = this.getSortedTimestamps();

        precomputedSteps = new Int32Array(computedStepCount);
        const d0 = sortedTimestamps[0];
        const d1 = sortedTimestamps[sortedTimestamps.length - 1];
        const dRange = d1 - d0;
        const low = 0;
        const high = sortedTimestamps.length - 1;
        for (let i = 0; i < precomputedSteps.length; i += 1) {
            precomputedSteps[i] = this.findIntervalInRange(d0 + (i / computedStepCount) * dRange, low, high);
        }

        this.precomputedSteps = precomputedSteps;
    }

    private findIntervalInRange(target: number, low: number, high: number) {
        const sortedTimestamps = this.getSortedTimestamps();
        while (low <= high) {
            const mid = ((low + high) / 2) | 0;
            if (sortedTimestamps[mid] === target) {
                return mid;
            } else if (sortedTimestamps[mid] < target) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return low;
    }

    private findInterval(target: number) {
        // Binary search for the target
        const precomputedSteps = this.getPrecomputedSteps();
        let low: number;
        let high: number;
        if (precomputedSteps == null) {
            low = 0;
            high = this.domain.length - 1;
        } else {
            const sortedTimestamps = this.getSortedTimestamps();
            const d0 = sortedTimestamps[0];
            const d1 = sortedTimestamps[sortedTimestamps.length - 1];
            const i = Math.min(
                (((target - d0) / (d1 - d0)) * precomputedSteps.length) | 0,
                (precomputedSteps.length - 1) | 0
            );
            low = precomputedSteps[i];
            high = i < precomputedSteps.length - 2 ? precomputedSteps[i + 1] : sortedTimestamps.length - 1;
        }

        return this.findIntervalInRange(target, low, high);
    }

    /**
     * Returns a time format function suitable for displaying tick values.
     * @param specifier If the specifier string is provided, this method is equivalent to
     * the {@link TimeLocaleObject.format} method.
     * If no specifier is provided, this method returns the default time format function.
     */
    override tickFormatter({ domain, ticks, specifier }: ScaleFormatParams<Date>): (date: Date) => string {
        return specifier != null ? buildFormatter(specifier) : defaultTimeTickFormat(ticks, domain);
    }

    override datumFormatter(params: ScaleFormatParams<Date>) {
        return this.tickFormatter(params);
    }

    override invert(position: number, nearest = false): Date | undefined {
        this.refresh();

        const { domain } = this;

        if (nearest) {
            const index = this.invertNearestIndex(position - this.bandwidth / 2);
            return index != null ? domain[index] : undefined;
        }

        const closest = findMinValue(0, domain.length - 1, (i) => {
            const p = this.ordinalRange(i);
            return p >= position ? domain[i] : undefined;
        });
        return closest ?? domain[0];
    }

    protected override getIndex(value: Date): number | undefined {
        const sortedTimestamps = this.getSortedTimestamps();
        const n = Number(value);
        if (n < sortedTimestamps[0]) {
            return undefined;
        }
        let i = this.findInterval(n);
        if (this.isReversed) {
            i = this.domain.length - i - 1;
        }
        return i;
    }
}

function getDefaultTicks(domain: Date[], maxTickCount: number, isReversed: boolean, visibleRange: [number, number]) {
    const ticks: Date[] = [];
    const tickEvery = Math.ceil(domain.length / maxTickCount);
    const tickOffset = Math.floor(tickEvery / 2);

    const startIndex = Math.floor(visibleRange[0] * domain.length);
    const endIndex = Math.ceil(visibleRange[1] * domain.length);

    for (let index = startIndex; index < endIndex; index += 1) {
        const tickIndex = isReversed ? domain.length - 1 - index : index;
        if (tickEvery <= 0 || (tickIndex + tickOffset) % tickEvery === 0) {
            ticks.push(domain[index]);
        }
    }

    if (isReversed) {
        ticks.reverse();
    }

    return ticks;
}
