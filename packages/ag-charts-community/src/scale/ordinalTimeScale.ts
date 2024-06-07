import { TickIntervals, getTickInterval } from '../util/ticks';
import type { TimeInterval } from '../util/time/interval';
import { buildFormatter } from '../util/timeFormat';
import { dateToNumber, defaultTimeTickFormat } from '../util/timeFormatDefaults';
import { BandScale } from './bandScale';
import { ContinuousScale } from './continuousScale';
import { Invalidating } from './invalidating';
import { TimeScale } from './timeScale';

function compareNumbers(a: number, b: number) {
    return a - b;
}

export class OrdinalTimeScale extends BandScale<Date, TimeInterval | number> {
    override readonly type = 'ordinal-time';

    static override is(value: any): value is OrdinalTimeScale {
        return value instanceof OrdinalTimeScale;
    }

    @Invalidating
    tickCount = ContinuousScale.defaultTickCount;
    @Invalidating
    minTickCount = 0;
    @Invalidating
    maxTickCount = Infinity;

    @Invalidating
    override interval?: TimeInterval | number = undefined;

    protected rangeIndex: number[][] = [];

    private medianInterval?: number;

    protected override _domain: Date[] = [];
    protected timestamps: number[] = [];

    override set domain(values: Date[]) {
        this.index.clear();
        this.invalid = true;
        this.rangeIndex = [];

        if (values.length === 0) {
            this._domain = [];
            return;
        }

        this.timestamps = values.map(dateToNumber);

        this.updateIndex(values);
        this._domain = values;
    }
    override get domain(): Date[] {
        return this._domain;
    }

    updateIndex(domain: Date[]) {
        const intervals: number[] = [];
        const isReversed = domain[0] > domain.at(-1)!;
        const values = domain.map(dateToNumber).sort(compareNumbers);

        let lastValue: number | undefined;
        for (const [i, value] of values.entries()) {
            if (lastValue != null) {
                const prev = lastValue + 1;
                this.rangeIndex.push([prev, value]);
                intervals.push(Math.abs(value - prev));
            }
            lastValue = value;
            this.index.set(value, i);
        }

        this.medianInterval = this.getMedianInterval(intervals);

        const interval = OrdinalTimeScale.getTickInterval(this.medianInterval);
        const dateRange = [Number(interval.floor(values[0])), values[0]];
        this.rangeIndex.unshift(dateRange);

        if (isReversed) {
            this.rangeIndex.reverse();
        }
    }

    private getMedianInterval(intervals: number[]) {
        intervals.sort(compareNumbers);
        const middleIndex = Math.floor(intervals.length / 2);
        return intervals.length > 2 && intervals.length % 2 === 0
            ? (intervals[middleIndex - 1] + intervals[middleIndex + 1]) / 2
            : intervals[middleIndex];
    }

    override ticks(): Date[] {
        this.refresh();

        const [t0, t1] = [this.timestamps[0], this.timestamps.at(-1)!];
        const start = Math.min(t0, t1);
        const stop = Math.max(t0, t1);
        const isReversed = t0 > t1;

        let ticks;
        if (this.interval != null) {
            const [r0, r1] = this.range;
            const availableRange = Math.abs(r1 - r0);
            ticks = TimeScale.getTicksForInterval({ start, stop, interval: this.interval, availableRange }) ?? [];
        }

        const n = this.domain.length;
        const { maxTickCount, tickCount } = this;
        let { minTickCount } = this;
        let medianInterval;
        if (isFinite(maxTickCount) && n <= maxTickCount) {
            // Produce a tick for each band using the median interval to find a default tick interval as data intervals can be irregular
            minTickCount = Math.max(1, n);
            medianInterval = this.medianInterval;
        }

        ticks ??= this.getDefaultTicks({
            start,
            stop,
            tickCount,
            minTickCount,
            maxTickCount,
            isReversed,
            interval: medianInterval,
        });

        // max one tick per band
        const tickPositions = new Set<number>();
        return ticks.filter((tick) => {
            const position = this.convert(tick);
            if (isNaN(position) || tickPositions.has(position)) {
                return false;
            }
            tickPositions.add(position);
            return true;
        });
    }

    static getTickInterval(target: number) {
        let prevInterval: (typeof TickIntervals)[number];
        for (const tickInterval of TickIntervals) {
            if (target <= tickInterval.duration) {
                prevInterval ??= tickInterval;
                break;
            }
            prevInterval = tickInterval;
        }
        const { timeInterval, step } = prevInterval!;
        return timeInterval.every(step);
    }

    private getDefaultTicks({
        start,
        stop,
        tickCount,
        minTickCount,
        maxTickCount,
        isReversed,
        interval,
    }: {
        start: number;
        stop: number;
        tickCount: number;
        minTickCount: number;
        maxTickCount: number;
        isReversed: boolean;
        interval?: number;
    }) {
        const tickInterval = getTickInterval(start, stop, tickCount, minTickCount, maxTickCount, interval);

        if (!tickInterval) {
            return [];
        }

        const ticks: Date[] = [];
        const tickEvery = Math.ceil(this.domain.length / maxTickCount);
        for (const [index, dateRange] of this.rangeIndex.entries()) {
            if (tickEvery > 0 && index % tickEvery) continue;

            ticks.push(isReversed ? tickInterval.ceil(dateRange[0]) : tickInterval.floor(dateRange[1]));
        }

        return ticks;
    }

    override convert(d: Date): number {
        this.refresh();

        let i;
        const n = Number(d);
        for (const [index, dateRange] of this.rangeIndex.entries()) {
            if (n >= dateRange[0] && n <= dateRange[1]) {
                i = index;
                break;
            }
        }

        return i == null ? NaN : this.ordinalRange[i] ?? NaN;
    }

    /**
     * Returns a time format function suitable for displaying tick values.
     * @param specifier If the specifier string is provided, this method is equivalent to
     * the {@link TimeLocaleObject.format} method.
     * If no specifier is provided, this method returns the default time format function.
     */
    tickFormat({
        ticks,
        domain,
        specifier,
    }: {
        ticks?: any[];
        domain?: any[];
        specifier?: string;
    }): (date: Date) => string {
        return specifier == null ? defaultTimeTickFormat(ticks, domain) : buildFormatter(specifier);
    }

    override invert(position: number) {
        this.refresh();
        const index = this.ordinalRange.findIndex((p) => position <= p);
        return this.domain[index];
    }

    override invertNearest(y: number): Date {
        return new Date(super.invertNearest(y));
    }
}
