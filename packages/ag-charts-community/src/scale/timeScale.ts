import { TickIntervals, getTickTimeInterval, isDenseInterval } from '../util/ticks';
import { TimeInterval } from '../util/time';
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

    override niceDomain(ticks: ScaleTickParams<TimeInterval | number>, domain: Date[] = this.domain): Date[] {
        if (domain.length < 2) return [];

        let [d0, d1] = domain;
        const maxAttempts = 4;
        const availableRange = this.getPixelRange();
        for (let i = 0; i < maxAttempts; i++) {
            const [n0, n1] = updateNiceDomainIteration(d0, d1, ticks, availableRange);
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
    override ticks(
        params: ScaleTickParams<TimeInterval | number>,
        domain: Date[] = this.domain,
        visibleRange: [number, number] = [0, 1]
    ): Date[] {
        const { nice, interval, tickCount = ContinuousScale.defaultTickCount, minTickCount, maxTickCount } = params;
        if (domain.length < 2) return [];

        const timestamps = domain.map(dateToNumber);
        const start = timestamps[0];
        const stop = timestamps[timestamps.length - 1];

        if (interval != null) {
            const availableRange = this.getPixelRange();
            return (
                getDateTicksForInterval({ start, stop, interval, availableRange, visibleRange }) ??
                getDefaultDateTicks({ start, stop, tickCount, minTickCount, maxTickCount, visibleRange })
            );
        } else if (nice && tickCount === 2) {
            return domain;
        } else if (nice && tickCount === 1) {
            return domain.slice(0, 1);
        }
        return getDefaultDateTicks({ start, stop, tickCount, minTickCount, maxTickCount, visibleRange });
    }

    private _tickFormatter({ domain, ticks, specifier }: ScaleFormatParams<Date>, formatOffset?: number) {
        return specifier != null ? buildFormatter(specifier) : defaultTimeTickFormat(ticks, domain, formatOffset);
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
    override tickFormatter(params: ScaleFormatParams<Date>): (date: Date) => string {
        return this._tickFormatter(params);
    }

    override datumFormatter(params: ScaleFormatParams<Date>): (date: Date) => string {
        return this._tickFormatter(params, 1);
    }
}

function getDefaultDateTicks({
    start,
    stop,
    tickCount,
    minTickCount,
    maxTickCount,
    visibleRange,
}: {
    start: number;
    stop: number;
    tickCount: number;
    minTickCount: number;
    maxTickCount: number;
    visibleRange: [number, number];
}) {
    const t = getTickTimeInterval(start, stop, tickCount, minTickCount, maxTickCount);
    return t ? t.range(new Date(start), new Date(stop), { visibleRange }) : []; // inclusive stop
}

export function getDateTicksForInterval({
    start,
    stop,
    interval,
    availableRange,
    visibleRange,
}: {
    start: number;
    stop: number;
    interval: number | TimeInterval;
    availableRange: number;
    visibleRange: [number, number] | undefined;
}): Date[] | undefined {
    if (!interval) {
        return [];
    }

    if (interval instanceof TimeInterval) {
        const ticks = interval.range(new Date(start), new Date(stop), { visibleRange });
        if (isDenseInterval(ticks.length, availableRange)) {
            return;
        }

        return ticks;
    }

    const absInterval = Math.abs(interval);

    if (isDenseInterval(Math.abs(stop - start) / absInterval, availableRange)) return;

    const timeInterval = TickIntervals.findLast((tickInterval) => absInterval % tickInterval.duration === 0);

    if (timeInterval) {
        const i = timeInterval.timeInterval.every(absInterval / (timeInterval.duration / timeInterval.step));
        return i.range(new Date(start), new Date(stop), { visibleRange });
    }

    let date = new Date(Math.min(start, stop));
    const stopDate = new Date(Math.max(start, stop));
    const ticks = [];
    while (date <= stopDate) {
        ticks.push(date);
        date = new Date(date);
        date.setMilliseconds(date.getMilliseconds() + absInterval);
    }

    return ticks;
}

function updateNiceDomainIteration(
    d0: Date,
    d1: Date,
    ticks: ScaleTickParams<TimeInterval | number>,
    availableRange: number
): [Date, Date] {
    const { interval } = ticks;
    const start = Math.min(dateToNumber(d0), dateToNumber(d1));
    const stop = Math.max(dateToNumber(d0), dateToNumber(d1));

    let i;

    if (interval instanceof TimeInterval) {
        i = interval;
    } else {
        let tickCount: number | null;
        if (typeof interval === 'number') {
            tickCount = (stop - start) / Math.max(interval, 1);
            if (isDenseInterval(tickCount, availableRange)) {
                tickCount = null;
            }
        }
        tickCount ??= ticks.tickCount ?? ContinuousScale.defaultTickCount;
        i = getTickTimeInterval(start, stop, tickCount, ticks.minTickCount, ticks.maxTickCount);
    }

    if (i) {
        const domain = i.range(new Date(start), new Date(stop), { extend: true });
        if (d0 > d1) {
            domain.reverse();
        }
        return [domain[0], domain.at(-1)!];
    } else {
        return [d0, d1];
    }
}
