import { TickIntervals, getTickInterval } from '../util/ticks';
import type { TimeInterval } from '../util/time/interval';
import { buildFormatter } from '../util/timeFormat';
import { dateToNumber, defaultTimeTickFormat } from '../util/timeFormatDefaults';
import { BandScale } from './bandScale';
import { ContinuousScale } from './continuousScale';
import { Invalidating } from './invalidating';
import { TimeScale } from './timeScale';

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

    toDomain(d: number): Date {
        return new Date(d);
    }

    protected override index: Map<Date[], number> = new Map<Date[], number>();

    private medianInterval?: number;

    /**
     * Contains unique datums only. Since `{}` is used in place of `Map`
     * for IE11 compatibility, the datums are converted `toString` before
     * the uniqueness check.
     */
    protected override _domain: Date[] = [];
    override set domain(values: Date[]) {
        this.invalid = true;

        if (values.length === 0) {
            this._domain = [];
            return;
        }

        const domain = this.updateIndex(values);

        this._domain = domain;
    }
    override get domain(): Date[] {
        return this._domain;
    }

    updateIndex(values: Date[]) {
        this.index = new Map<Date[], number>();
        const { index } = this;

        const domain: Date[] = [];
        const extents: number[] = [];
        const isReversed = values[0] > values.at(-1)!;
        const indexShift = isReversed ? 0 : 1;
        values.forEach((value, i) => {
            const nextValue = values[i + 1];
            const e0 = isReversed ? value : this.toDomain(dateToNumber(value) + 1);
            const e1 = isReversed ? this.toDomain(dateToNumber(nextValue) + 1) : nextValue;

            const dateRange = isReversed ? [e1, e0] : [e0, e1];

            domain.push(value);

            if (nextValue !== undefined && index.get(dateRange) === undefined) {
                extents.push(Math.abs(dateToNumber(e1) - dateToNumber(e0)));
                index.set(dateRange, i + indexShift);
            }
        });

        // extend the first or last band by the median extent of each band
        extents.sort((a, b) => a - b);
        const bands = extents.length;
        const middleIndex = Math.floor(bands / 2);
        this.medianInterval =
            bands > 2 && bands % 2 === 0
                ? (extents[middleIndex - 1] + extents[middleIndex + 1]) / 2
                : extents[middleIndex];

        const interval = OrdinalTimeScale.getTickInterval(this.medianInterval);

        const i = isReversed ? values.length - 1 : 0;
        const e1 = values[i];
        const e0 = interval.floor(values[i]);
        const dateRange = [e0, e1];
        index.set(dateRange, i);

        return domain;
    }

    override ticks(): Date[] {
        if (!this.domain) {
            return [];
        }

        this.refresh();

        const [t0, t1] = [dateToNumber(this.domain[0]), dateToNumber(this.domain.at(-1))];
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

        const tickEvery = Math.ceil(this.domain.length / maxTickCount);
        const ticks: Date[] = [];
        for (const [dateRange, index] of this.index.entries()) {
            if (index % tickEvery > 0) continue;

            const tick = isReversed ? tickInterval.ceil(dateRange[0]) : tickInterval.floor(dateRange[1]);
            ticks.splice(index, 0, tick);
        }

        return ticks;
    }

    override convert(d: Date): number {
        if (typeof d === 'number') {
            d = new Date(d);
        }

        if (!(d instanceof Date)) {
            return NaN;
        }

        this.refresh();

        let i;

        for (const [dateRange, index] of this.index.entries()) {
            if (d >= dateRange[0] && d <= dateRange[1]) {
                i = index;
                break;
            }
        }

        if (i === undefined) {
            return NaN;
        }

        const r = this.ordinalRange[i];
        if (r === undefined) {
            return NaN;
        }

        return r;
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
