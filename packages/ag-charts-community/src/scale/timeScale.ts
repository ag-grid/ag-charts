import { isDenseInterval, tickStep } from '../util/ticks';
import timeDay from '../util/time/day';
import {
    durationDay,
    durationHour,
    durationMinute,
    durationMonth,
    durationSecond,
    durationWeek,
    durationYear,
} from '../util/time/duration';
import timeHour from '../util/time/hour';
import type { CountableTimeInterval } from '../util/time/interval';
import { TimeInterval } from '../util/time/interval';
import timeMillisecond from '../util/time/millisecond';
import timeMinute from '../util/time/minute';
import timeMonth from '../util/time/month';
import timeSecond from '../util/time/second';
import timeWeek from '../util/time/week';
import timeYear from '../util/time/year';
import { buildFormatter } from '../util/timeFormat';
import { dateToNumber, defaultTimeTickFormat } from '../util/timeFormatDefaults';
import { ContinuousScale } from './continuousScale';

export class TimeScale extends ContinuousScale<Date, TimeInterval | number> {
    readonly type = 'time';
    /**
     * Array of default tick intervals in the following format:
     *
     *     [
     *         interval (unit of time),
     *         number of units (step),
     *         the length of that number of units in milliseconds
     *     ]
     */
    static readonly tickIntervals: [CountableTimeInterval, number, number][] = [
        [timeSecond, 1, durationSecond],
        [timeSecond, 5, 5 * durationSecond],
        [timeSecond, 15, 15 * durationSecond],
        [timeSecond, 30, 30 * durationSecond],
        [timeMinute, 1, durationMinute],
        [timeMinute, 5, 5 * durationMinute],
        [timeMinute, 15, 15 * durationMinute],
        [timeMinute, 30, 30 * durationMinute],
        [timeHour, 1, durationHour],
        [timeHour, 3, 3 * durationHour],
        [timeHour, 6, 6 * durationHour],
        [timeHour, 12, 12 * durationHour],
        [timeDay, 1, durationDay],
        [timeDay, 2, 2 * durationDay],
        [timeWeek, 1, durationWeek],
        [timeWeek, 2, 2 * durationWeek],
        [timeWeek, 3, 3 * durationWeek],
        [timeMonth, 1, durationMonth],
        [timeMonth, 2, 2 * durationMonth],
        [timeMonth, 3, 3 * durationMonth],
        [timeMonth, 4, 4 * durationMonth],
        [timeMonth, 6, 6 * durationMonth],
        [timeYear, 1, durationYear],
    ];

    public constructor() {
        super([], [0, 1]);
    }

    toDomain(d: number): Date {
        return new Date(d);
    }

    /**
     * @param options Tick interval options.
     * @param options.start The start time (timestamp).
     * @param options.stop The end time (timestamp).
     * @param options.count Number of intervals between ticks.
     */
    static getTickInterval({
        start,
        stop,
        count,
        minCount,
        maxCount,
        target,
    }: {
        start: number;
        stop: number;
        count: number;
        minCount: number;
        maxCount: number;
        target?: number;
    }): CountableTimeInterval | TimeInterval | undefined {
        let countableTimeInterval;
        let step;

        const tickCount = count ?? ContinuousScale.defaultTickCount;
        const targetInterval = target ?? Math.abs(stop - start) / Math.max(tickCount, 1);
        const i = TimeScale.getIntervalIndex(targetInterval);
        if (i === 0) {
            step = Math.max(tickStep(start, stop, tickCount, minCount, maxCount), 1);
            countableTimeInterval = timeMillisecond;
        } else if (i === TimeScale.tickIntervals.length) {
            const y0 = start / durationYear;
            const y1 = stop / durationYear;
            step = target === undefined ? tickStep(y0, y1, tickCount, minCount, maxCount) : 1;
            countableTimeInterval = timeYear;
        } else {
            const diff0 = targetInterval - TimeScale.tickIntervals[i - 1][2];
            const diff1 = TimeScale.tickIntervals[i][2] - targetInterval;
            const index = diff0 < diff1 ? i - 1 : i;
            [countableTimeInterval, step] = TimeScale.tickIntervals[index];
        }

        return countableTimeInterval.every(step);
    }

    static getIntervalIndex(target: number) {
        let i = 0;
        while (i < TimeScale.tickIntervals.length && target > TimeScale.tickIntervals[i][2]) {
            i++;
        }
        return i;
    }

    override invert(y: number): Date {
        return new Date(super.invert(y));
    }

    /**
     * Returns uniformly-spaced dates that represent the scale's domain.
     */
    ticks(): Date[] {
        if (!this.domain || this.domain.length < 2) {
            return [];
        }
        this.refresh();

        const [t0, t1] = this.getDomain().map(dateToNumber);

        const start = Math.min(t0, t1);
        const stop = Math.max(t0, t1);

        const { interval, nice, tickCount, minTickCount, maxTickCount } = this;

        if (interval !== undefined) {
            const availableRange = this.getPixelRange();
            const ticks = TimeScale.getTicksForInterval({ start, stop, interval, availableRange });
            return ticks ?? TimeScale.getDefaultTicks({ start, stop, tickCount, minTickCount, maxTickCount });
        }

        if (nice) {
            if (tickCount === 2) {
                return this.niceDomain;
            }
            if (tickCount === 1) {
                return this.niceDomain.slice(0, 1);
            }
        }

        return TimeScale.getDefaultTicks({ start, stop, tickCount, minTickCount, maxTickCount });
    }

    static getDefaultTicks({
        start,
        stop,
        tickCount,
        minTickCount,
        maxTickCount,
    }: {
        start: number;
        stop: number;
        tickCount: number;
        minTickCount: number;
        maxTickCount: number;
    }) {
        const t = TimeScale.getTickInterval({
            start,
            stop,
            count: tickCount,
            minCount: minTickCount,
            maxCount: maxTickCount,
        });
        return t ? t.range(new Date(start), new Date(stop)) : []; // inclusive stop
    }

    static getTicksForInterval({
        start,
        stop,
        interval,
        availableRange,
    }: {
        start: number;
        stop: number;
        interval: number | TimeInterval;
        availableRange: number;
    }): Date[] | undefined {
        if (!interval) {
            return [];
        }

        if (interval instanceof TimeInterval) {
            const ticks = interval.range(new Date(start), new Date(stop));
            if (isDenseInterval({ start, stop, interval, count: ticks.length, availableRange })) {
                return;
            }

            return ticks;
        }

        const absInterval = Math.abs(interval);

        if (isDenseInterval({ start, stop, interval: absInterval, availableRange })) {
            return;
        }

        const reversedInterval = [...TimeScale.tickIntervals];
        reversedInterval.reverse();

        const timeInterval = reversedInterval.find((tickInterval) => absInterval % tickInterval[2] === 0);

        if (timeInterval) {
            const i = timeInterval[0].every(absInterval / (timeInterval[2] / timeInterval[1]));
            return i.range(new Date(start), new Date(stop));
        }

        let date = new Date(start);
        const stopDate = new Date(stop);
        const ticks = [];
        while (date <= stopDate) {
            ticks.push(date);
            date = new Date(date);
            date.setMilliseconds(date.getMilliseconds() + absInterval);
        }

        return ticks;
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

    update() {
        if (!this.domain || this.domain.length < 2) {
            return;
        }
        if (this.nice) {
            this.updateNiceDomain();
        }
    }

    /**
     * Extends the domain so that it starts and ends on nice round values.
     * This method typically modifies the scale’s domain, and may only extend the bounds to the nearest round value.
     */
    protected updateNiceDomain(): void {
        const maxAttempts = 4;
        let [d0, d1] = this.domain;
        for (let i = 0; i < maxAttempts; i++) {
            this.updateNiceDomainIteration(d0, d1);
            const [n0, n1] = this.niceDomain;
            if (dateToNumber(d0) === dateToNumber(n0) && dateToNumber(d1) === dateToNumber(n1)) {
                break;
            }
            d0 = n0;
            d1 = n1;
        }
    }

    protected updateNiceDomainIteration(d0: Date, d1: Date) {
        const start = Math.min(dateToNumber(d0), dateToNumber(d1));
        const stop = Math.max(dateToNumber(d0), dateToNumber(d1));

        const isReversed = d0 > d1;

        const { interval } = this;
        let i;

        if (interval instanceof TimeInterval) {
            i = interval;
        } else {
            const tickCount = typeof interval === 'number' ? (stop - start) / Math.max(interval, 1) : this.tickCount;
            i = TimeScale.getTickInterval({
                start,
                stop,
                count: tickCount,
                minCount: this.minTickCount,
                maxCount: this.maxTickCount,
            });
        }

        if (i) {
            const intervalRange = i.range(new Date(start), new Date(stop), true);
            const domain = isReversed ? [...intervalRange].reverse() : intervalRange;
            const n0 = domain[0];
            const n1 = domain.at(-1)!;
            this.niceDomain = [n0, n1];
        }
    }
}
