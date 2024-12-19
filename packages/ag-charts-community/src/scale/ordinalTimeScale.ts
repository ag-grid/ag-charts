import { findMinValue } from '../util/binarySearch';
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
    private _values: Date[] | undefined = undefined;
    private sortedTimestamps: number[] = [];
    private isReversed = false;
    private precomputedSteps: Int32Array | undefined;
    override set domain(values: Date[]) {
        if (values === this._values) return;

        this.invalid = true;

        const sortOrder = datesSortOrder(values);

        const domain = sortOrder == null ? sortAndUniqueDates(values) : values;
        const isReversed = sortOrder === -1;

        const sortedTimestamps = domain.map<number>(dateToNumber);
        if (isReversed) sortedTimestamps.reverse();

        this._values = values;
        this._domain = domain;
        this.isReversed = isReversed;
        this.sortedTimestamps = sortedTimestamps;
        this.precomputedSteps = undefined;

        const computedStepCount =
            values.length < 1e4 ? sortedTimestamps.length : Math.ceil(sortedTimestamps.length / 16);
        if (computedStepCount <= 1) return;

        this.refresh();
        const computedSteps = new Int32Array(computedStepCount);
        const d0 = sortedTimestamps[0].valueOf();
        const d1 = sortedTimestamps[sortedTimestamps.length - 1].valueOf();
        const dRange = d1 - d0;
        for (let i = 0; i < computedSteps.length; i += 1) {
            computedSteps[i] = this.findInterval(d0 + (i / computedStepCount) * dRange);
        }

        this.precomputedSteps = computedSteps;
    }
    override get domain(): Date[] {
        return this._domain;
    }

    override toDomain(value: number): Date {
        return new Date(value);
    }

    override normalizeDomains(...domains: Date[][]): NormalizedDomain<Date> {
        if (domains.length === 0) return { domain: [], animatable: false };

        let domain: Date[];
        if (domains.length === 1) {
            domain = domains[0];

            const sortOrder = datesSortOrder(domain);
            if (sortOrder === -1) {
                domain = domain.slice().reverse();
            } else if (sortOrder == null) {
                domain = sortAndUniqueDates(domain.slice());
            }
        } else {
            domain = sortAndUniqueDates(domains.flat());
        }

        return { domain, animatable: true };
    }

    override ticks(
        { interval, maxTickCount }: ScaleTickParams<TimeInterval | number>,
        domain: Date[] = this.domain,
        visibleRange: [number, number] = [0, 1]
    ): Date[] {
        if (!this._domain.length) {
            return [];
        }

        this.refresh();

        const { isReversed } = this;
        const [t0, t1] = [domain[0].valueOf(), domain.at(-1)!.valueOf()];
        const start = Math.min(t0, t1);
        const stop = Math.max(t0, t1);

        if (interval == null) {
            return this.getDefaultTicks(maxTickCount, isReversed, visibleRange);
        }

        const [r0, r1] = this.range;
        const availableRange = Math.abs(r1 - r0);
        const ticks = getDateTicksForInterval({ start, stop, interval, availableRange }) ?? [];

        let lastIndex = -1;
        return ticks.filter((tick) => {
            const index = this.findInterval(tick.valueOf());
            const duplicated = index === lastIndex;
            lastIndex = index;

            return !duplicated;
        });
    }

    private getDefaultTicks(maxTickCount: number, isReversed: boolean, visibleRange: [number, number]) {
        const { domain } = this;
        const ticks: Date[] = [];
        const tickEvery = Math.ceil((domain.length * (visibleRange[1] - visibleRange[0])) / maxTickCount);
        const tickOffset = Math.floor(tickEvery / 2);

        for (let index = 0; index < domain.length; index += 1) {
            const value = domain[index];
            const tickIndex = isReversed ? domain.length - 1 - index : index;
            if (tickEvery <= 0 || (tickIndex + tickOffset) % tickEvery === 0) {
                ticks.push(value);
            }
        }

        if (isReversed) {
            ticks.reverse();
        }

        return ticks;
    }

    private findInterval(target: number) {
        // Binary search for the target
        const { sortedTimestamps, precomputedSteps } = this;
        let low: number;
        let high: number;
        if (precomputedSteps == null) {
            low = 0;
            high = sortedTimestamps.length - 1;
        } else {
            const d0 = sortedTimestamps[0].valueOf();
            const d1 = sortedTimestamps[sortedTimestamps.length - 1].valueOf();
            const i = Math.min(
                (((target - d0) / (d1 - d0)) * precomputedSteps.length) | 0,
                (precomputedSteps.length - 1) | 0
            );
            low = precomputedSteps[i];
            high = i < precomputedSteps.length - 2 ? precomputedSteps[i + 1] : sortedTimestamps.length - 1;
        }

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

    /**
     * Returns a time format function suitable for displaying tick values.
     * @param specifier If the specifier string is provided, this method is equivalent to
     * the {@link TimeLocaleObject.format} method.
     * If no specifier is provided, this method returns the default time format function.
     */
    override tickFormatter({ visibleTicks, ticks, specifier }: ScaleFormatParams<Date>): (date: Date) => string {
        return specifier != null ? buildFormatter(specifier) : defaultTimeTickFormat(visibleTicks, ticks);
    }

    override datumFormatter(params: ScaleFormatParams<Date>) {
        return this.tickFormatter(params);
    }

    override invert(position: number, nearest = false): Date | undefined {
        this.refresh();

        const { domain } = this;

        if (nearest) {
            const index = this.invertNearestIndex(position);
            return index != null ? domain[index] : undefined;
        }

        const closest = findMinValue(0, domain.length - 1, (i) => {
            const p = this.ordinalRange(i);
            return p >= position ? domain[i] : undefined;
        });
        return closest ?? domain[0];
    }

    protected override getIndex(value: Date): number | undefined {
        const n = Number(value);
        if (n < this.sortedTimestamps[0]) {
            return undefined;
        }
        let i = this.findInterval(n);
        if (this.isReversed) {
            i = this.domain.length - i - 1;
        }
        return i;
    }
}
