import { findRangeExtent } from '../util/number';
import { tickStep } from '../util/ticks';
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
import {
    DefaultTimeFormats,
    TIME_FORMAT_STRINGS,
    dateToNumber,
    defaultTimeTickFormat,
} from '../util/timeFormatDefaults';
import { ContinuousScale } from './continuousScale';

export class TimeScale extends ContinuousScale<Date, TimeInterval | number> {
    readonly type = 'time';

    private year: CountableTimeInterval = timeYear;
    private month: CountableTimeInterval = timeMonth;
    private week: CountableTimeInterval = timeWeek;
    private day: CountableTimeInterval = timeDay;
    private hour: CountableTimeInterval = timeHour;
    private minute: CountableTimeInterval = timeMinute;
    private second: CountableTimeInterval = timeSecond;
    private millisecond: CountableTimeInterval = timeMillisecond;

    /**
     * Array of default tick intervals in the following format:
     *
     *     [
     *         interval (unit of time),
     *         number of units (step),
     *         the length of that number of units in milliseconds
     *     ]
     */
    private tickIntervals: [CountableTimeInterval, number, number][] = [
        [this.second, 1, durationSecond],
        [this.second, 5, 5 * durationSecond],
        [this.second, 15, 15 * durationSecond],
        [this.second, 30, 30 * durationSecond],
        [this.minute, 1, durationMinute],
        [this.minute, 5, 5 * durationMinute],
        [this.minute, 15, 15 * durationMinute],
        [this.minute, 30, 30 * durationMinute],
        [this.hour, 1, durationHour],
        [this.hour, 3, 3 * durationHour],
        [this.hour, 6, 6 * durationHour],
        [this.hour, 12, 12 * durationHour],
        [this.day, 1, durationDay],
        [this.day, 2, 2 * durationDay],
        [this.week, 1, durationWeek],
        [this.week, 2, 2 * durationWeek],
        [this.week, 3, 3 * durationWeek],
        [this.month, 1, durationMonth],
        [this.month, 2, 2 * durationMonth],
        [this.month, 3, 3 * durationMonth],
        [this.month, 4, 4 * durationMonth],
        [this.month, 6, 6 * durationMonth],
        [this.year, 1, durationYear],
    ];

    public constructor() {
        super([], [0, 1]);
    }

    toDomain(d: number): Date {
        return new Date(d);
    }

    buildFormatString(defaultTimeFormat: DefaultTimeFormats, yearChange: boolean): string {
        let formatStringArray: string[] = [TIME_FORMAT_STRINGS[defaultTimeFormat]];
        let timeEndIndex = 0;

        const domain = this.getDomain();
        const extent = findRangeExtent(domain.map(dateToNumber));

        switch (defaultTimeFormat) {
            case DefaultTimeFormats.SECOND:
                if (extent / durationMinute > 1) {
                    formatStringArray.push(TIME_FORMAT_STRINGS[DefaultTimeFormats.MINUTE]);
                }
            // fall through deliberately
            case DefaultTimeFormats.MINUTE:
                if (extent / durationHour > 1) {
                    formatStringArray.push(TIME_FORMAT_STRINGS[DefaultTimeFormats.HOUR]);
                }
            // fall through deliberately
            case DefaultTimeFormats.HOUR:
                timeEndIndex = formatStringArray.length;
                if (extent / durationDay > 1) {
                    formatStringArray.push(TIME_FORMAT_STRINGS[DefaultTimeFormats.WEEK_DAY]);
                }
            // fall through deliberately
            case DefaultTimeFormats.WEEK_DAY:
                if (extent / durationWeek > 1 || yearChange) {
                    // if it's more than a week or there is a year change, don't show week day
                    const weekDayIndex = formatStringArray.indexOf(TIME_FORMAT_STRINGS[DefaultTimeFormats.WEEK_DAY]);

                    if (weekDayIndex > -1) {
                        formatStringArray.splice(weekDayIndex, 1, TIME_FORMAT_STRINGS[DefaultTimeFormats.SHORT_MONTH]);
                    }
                }
            // fall through deliberately
            case DefaultTimeFormats.SHORT_MONTH:
            case DefaultTimeFormats.MONTH:
                if (extent / durationYear > 1 || yearChange) {
                    formatStringArray.push(TIME_FORMAT_STRINGS[DefaultTimeFormats.YEAR]);
                }
            // fall through deliberately
            default:
                break;
        }

        if (timeEndIndex < formatStringArray.length) {
            // Insert a gap between all date components.
            formatStringArray = [
                ...formatStringArray.slice(0, timeEndIndex),
                formatStringArray.slice(timeEndIndex).join(' '),
            ];
        }
        if (timeEndIndex > 0) {
            // Reverse order of time components, since they should be displayed in descending
            // granularity.
            formatStringArray = [
                ...formatStringArray.slice(0, timeEndIndex).reverse(),
                ...formatStringArray.slice(timeEndIndex),
            ];
            if (timeEndIndex < formatStringArray.length) {
                // Insert a gap between time and date components.
                formatStringArray.splice(timeEndIndex, 0, ' ');
            }
        }

        return formatStringArray.join('');
    }

    /**
     * @param options Tick interval options.
     * @param options.start The start time (timestamp).
     * @param options.stop The end time (timestamp).
     * @param options.count Number of intervals between ticks.
     */
    private getTickInterval({
        start,
        stop,
        count,
        minCount,
        maxCount,
    }: {
        start: number;
        stop: number;
        count: number;
        minCount: number;
        maxCount: number;
    }): CountableTimeInterval | TimeInterval | undefined {
        const { tickIntervals } = this;

        let countableTimeInterval;
        let step;

        const tickCount = count ?? ContinuousScale.defaultTickCount;
        const target = Math.abs(stop - start) / Math.max(tickCount, 1);
        let i = 0;
        while (i < tickIntervals.length && target > tickIntervals[i][2]) {
            i++;
        }

        if (i === 0) {
            step = Math.max(tickStep(start, stop, tickCount, minCount, maxCount), 1);
            countableTimeInterval = this.millisecond;
        } else if (i === tickIntervals.length) {
            const y0 = start / durationYear;
            const y1 = stop / durationYear;
            step = tickStep(y0, y1, tickCount, minCount, maxCount);
            countableTimeInterval = this.year;
        } else {
            const diff0 = target - tickIntervals[i - 1][2];
            const diff1 = tickIntervals[i][2] - target;
            const index = diff0 < diff1 ? i - 1 : i;
            [countableTimeInterval, step] = tickIntervals[index];
        }

        return countableTimeInterval.every(step);
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

        if (this.interval !== undefined) {
            return this.getTicksForInterval({ start, stop });
        }

        if (this.nice) {
            const { tickCount } = this;
            if (tickCount === 2) {
                return this.niceDomain;
            }
            if (tickCount === 1) {
                return this.niceDomain.slice(0, 1);
            }
        }

        return this.getDefaultTicks({ start, stop });
    }

    private getDefaultTicks({ start, stop }: { start: number; stop: number }) {
        const t = this.getTickInterval({
            start,
            stop,
            count: this.tickCount,
            minCount: this.minTickCount,
            maxCount: this.maxTickCount,
        });
        return t ? t.range(new Date(start), new Date(stop)) : []; // inclusive stop
    }

    private getTicksForInterval({ start, stop }: { start: number; stop: number }): Date[] {
        const { interval, tickIntervals } = this;

        if (!interval) {
            return [];
        }

        if (interval instanceof TimeInterval) {
            const ticks = interval.range(new Date(start), new Date(stop));
            if (this.isDenseInterval({ start, stop, interval, count: ticks.length })) {
                return this.getDefaultTicks({ start, stop });
            }

            return ticks;
        }

        const absInterval = Math.abs(interval);

        if (this.isDenseInterval({ start, stop, interval: absInterval })) {
            return this.getDefaultTicks({ start, stop });
        }

        const reversedInterval = [...tickIntervals];
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
    tickFormat({ ticks, specifier }: { ticks?: any[]; specifier?: string }): (date: Date) => string {
        return specifier == undefined
            ? defaultTimeTickFormat(this.buildFormatString, ticks)
            : buildFormatter(specifier);
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
            i = this.getTickInterval({
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
