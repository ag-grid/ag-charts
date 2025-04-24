import { TickIntervals, getTickTimeInterval, isDenseInterval } from '../util/ticks';
import { TimeInterval, sunday } from '../util/time';
import { buildFormatter } from '../util/timeFormat';
import { dateToNumber, defaultTimeTickFormat } from '../util/timeFormatDefaults';
import { ContinuousScale } from './continuousScale';
import type { ScaleFormatParams, ScaleTickParams } from './scale';

export class TimeScale extends ContinuousScale<Date, TimeInterval | number> {
    static override is(value: unknown): value is TimeScale {
        return value instanceof TimeScale;
    }

    readonly type = 'time';

    public constructor() {
        super([], [0, 1]);
    }

    toDomain(d: number): Date {
        return new Date(d);
    }

    override convert(value: Date, options?: { clamp: boolean }): number {
        if (!(value instanceof Date)) value = new Date(value as any);
        return super.convert(value, options);
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
        visibleRange: [number, number] = [0, 1],
        extend = false
    ): Date[] {
        const { nice, interval, tickCount = ContinuousScale.defaultTickCount, minTickCount, maxTickCount } = params;
        if (domain.length < 2) return [];

        const timestamps = domain.map(dateToNumber);
        const start = timestamps[0];
        const stop = timestamps[timestamps.length - 1];

        if (interval != null) {
            const availableRange = this.getPixelRange();
            return (
                getDateTicksForInterval({ start, stop, interval, availableRange, visibleRange, extend }) ??
                getDefaultDateTicks({ start, stop, tickCount, minTickCount, maxTickCount, visibleRange, extend })
            );
        } else if (nice && tickCount === 2) {
            return domain;
        } else if (nice && tickCount === 1) {
            return domain.slice(0, 1);
        }
        return getDefaultDateTicks({ start, stop, tickCount, minTickCount, maxTickCount, visibleRange, extend });
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
    extend,
}: {
    start: number;
    stop: number;
    tickCount: number;
    minTickCount: number;
    maxTickCount: number;
    visibleRange: [number, number];
    extend: boolean;
}) {
    const t = getTickTimeInterval(start, stop, tickCount, minTickCount, maxTickCount, { weekStart: sunday });
    return t ? t.range(new Date(start), new Date(stop), { visibleRange, extend }) : []; // inclusive stop
}

export function getDateTicksForInterval({
    start,
    stop,
    interval,
    availableRange,
    visibleRange,
    extend,
}: {
    start: number;
    stop: number;
    interval: number | TimeInterval;
    availableRange: number;
    visibleRange: [number, number] | undefined;
    extend: boolean;
}): Date[] | undefined {
    if (!interval) {
        return [];
    }

    if (interval instanceof TimeInterval) {
        const ticks = interval.range(new Date(start), new Date(stop), { visibleRange, extend });
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
        return i.range(new Date(start), new Date(stop), { visibleRange, extend });
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
        let tickCount: number | undefined;
        if (typeof interval === 'number') {
            tickCount = (stop - start) / Math.max(interval, 1);
            if (isDenseInterval(tickCount, availableRange)) {
                tickCount = undefined;
            }
        }
        tickCount ??= ticks.tickCount ?? ContinuousScale.defaultTickCount;
        i = getTickTimeInterval(start, stop, tickCount, ticks.minTickCount, ticks.maxTickCount, { weekStart: sunday });
    }

    const domain = i?.range(new Date(start), new Date(stop), { extend: true });

    if (domain == null || domain.length < 2) return [d0, d1];

    const r0 = domain[0];
    const r1 = domain[domain.length - 1];
    return d0 <= d1 ? [r0, r1] : [r1, r0];
}
