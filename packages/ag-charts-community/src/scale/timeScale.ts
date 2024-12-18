import { findMinMax } from '../util/number';
import { TickIntervals, getTickInterval, isDenseInterval } from '../util/ticks';
import { TimeInterval } from '../util/time/interval';
import { buildFormatter } from '../util/timeFormat';
import { dateToNumber, defaultTimeTickFormat } from '../util/timeFormatDefaults';
import { ContinuousScale } from './continuousScale';
import type { ScaleFormatParams, ScaleTickParams } from './scale';

export class TimeScale extends ContinuousScale<Date, TimeInterval | number> {
    readonly type = 'time';

    public constructor() {
        super([], [0, 1]);
    }

    toDomain(d: number): Date {
        return new Date(d);
    }

    override convert(value: Date, clamp?: boolean): number {
        if (!(value instanceof Date)) value = new Date(value as any);
        return super.convert(value, clamp);
    }

    override invert(value: number): Date {
        return new Date(super.invert(value));
    }

    niceDomain(ticks: ScaleTickParams<TimeInterval | number>, domain: Date[] = this.domain): Date[] {
        const maxAttempts = 4;
        let [d0, d1] = domain;
        for (let i = 0; i < maxAttempts; i++) {
            const [n0, n1] = updateNiceDomainIteration(d0, d1, ticks);
            if (dateToNumber(d0) === dateToNumber(n0) && dateToNumber(d1) === dateToNumber(n1)) {
                break;
            }
            d0 = n0;
            d1 = n1;
        }
        return [d0, d1];
    }

    /**
     * Returns uniformly-spaced dates that represent the scale's domain.
     */
    ticks(
        {
            nice,
            interval,
            tickCount = ContinuousScale.defaultTickCount,
            minTickCount,
            maxTickCount,
        }: ScaleTickParams<TimeInterval | number>,
        domain: Date[] = this.domain
    ): Date[] {
        if (!domain || domain.length < 2) {
            return [];
        }

        const [start, stop] = findMinMax(domain.map(dateToNumber));

        if (interval != null) {
            return (
                getDateTicksForInterval({ start, stop, interval, availableRange: this.getPixelRange() }) ??
                getDefaultDateTicks({ start, stop, tickCount, minTickCount, maxTickCount })
            );
        } else if (nice && tickCount === 2) {
            return domain;
        } else if (nice && tickCount === 1) {
            return domain;
        }
        return getDefaultDateTicks({ start, stop, tickCount, minTickCount, maxTickCount });
    }

    private _tickFormatter({ visibleTicks, ticks, specifier }: ScaleFormatParams<Date>, formatOffset?: number) {
        return specifier != null ? buildFormatter(specifier) : defaultTimeTickFormat(visibleTicks, ticks, formatOffset);
    }

    /**
     * Returns a time format function suitable for displaying tick values.
     *
     * @param ticks Optional array of tick values for custom formatting.
     * @param domain Optional array representing the [min, max] values of the time axis.
     * @param specifier Optional format specifier string for custom date formatting (e.g., `%Y`, `%m`, `%d`).
     * @param formatOffset Optional number for applying an offset to the format (e.g., timezone shifts).
     * @returns A function that formats a `Date` object into a string based on the provided specifier or default format.
     */
    tickFormatter(params: ScaleFormatParams<Date>): (date: Date) => string {
        return this._tickFormatter(params);
    }

    datumFormatter(params: ScaleFormatParams<Date>): (date: Date) => string {
        return this._tickFormatter(params, 1);
    }
}

function getDefaultDateTicks({
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
    const t = getTickInterval(start, stop, tickCount, minTickCount, maxTickCount);
    return t ? t.range(new Date(start), new Date(stop)) : []; // inclusive stop
}

export function getDateTicksForInterval({
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
        if (isDenseInterval(ticks.length, availableRange)) {
            return;
        }

        return ticks;
    }

    const absInterval = Math.abs(interval);

    if (isDenseInterval((stop - start) / absInterval, availableRange)) return;

    const timeInterval = TickIntervals.findLast((tickInterval) => absInterval % tickInterval.duration === 0);

    if (timeInterval) {
        const i = timeInterval.timeInterval.every(absInterval / (timeInterval.duration / timeInterval.step));
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

function updateNiceDomainIteration(d0: Date, d1: Date, ticks: ScaleTickParams<TimeInterval | number>): [Date, Date] {
    const { interval } = ticks;
    const start = Math.min(dateToNumber(d0), dateToNumber(d1));
    const stop = Math.max(dateToNumber(d0), dateToNumber(d1));

    const isReversed = d0 > d1;

    let i;

    if (interval instanceof TimeInterval) {
        i = interval;
    } else {
        const tickCount =
            typeof interval === 'number'
                ? (stop - start) / Math.max(interval, 1)
                : ticks.tickCount ?? ContinuousScale.defaultTickCount;
        i = getTickInterval(start, stop, tickCount, ticks.minTickCount, ticks.maxTickCount);
    }

    if (i) {
        const intervalRange = i.range(new Date(start), new Date(stop), true);
        const domain = isReversed ? [...intervalRange].reverse() : intervalRange;
        const n0 = domain[0];
        const n1 = domain.at(-1)!;
        return [n0, n1];
    } else {
        return [d0, d1];
    }
}
