import { findMinMax } from '../util/number';
import { TickIntervals, getTickInterval, isDenseInterval } from '../util/ticks';
import { TimeInterval } from '../util/time/interval';
import { buildFormatter } from '../util/timeFormat';
import { dateToNumber, defaultTimeTickFormat } from '../util/timeFormatDefaults';
import { ContinuousScale } from './continuousScale';
import type { ScaleDomainTicks } from './scale';

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

    /**
     * Returns uniformly-spaced dates that represent the scale's domain.
     */
    ticks(): Date[] {
        if (!this.domain || this.domain.length < 2) {
            return [];
        }
        this.refresh();

        const { interval, nice, tickCount, minTickCount, maxTickCount } = this;
        const [start, stop] = findMinMax(this.getDomain().map(dateToNumber));

        if (interval != null) {
            return (
                TimeScale.getTicksForInterval({ start, stop, interval, availableRange: this.getPixelRange() }) ??
                TimeScale.getDefaultTicks({ start, stop, tickCount, minTickCount, maxTickCount })
            );
        } else if (nice && tickCount === 2) {
            return this._niceDomain;
        } else if (nice && tickCount === 1) {
            return this._niceDomain.slice(0, 1);
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
        const t = getTickInterval(start, stop, tickCount, minTickCount, maxTickCount);
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

    /**
     * Returns a time format function suitable for displaying tick values.
     *
     * @param ticks Optional array of tick values for custom formatting.
     * @param domain Optional array representing the [min, max] values of the time axis.
     * @param specifier Optional format specifier string for custom date formatting (e.g., `%Y`, `%m`, `%d`).
     * @param formatOffset Optional number for applying an offset to the format (e.g., timezone shifts).
     * @returns A function that formats a `Date` object into a string based on the provided specifier or default format.
     */
    tickFormat({
        ticks,
        domain,
        specifier,
        formatOffset,
    }: {
        ticks?: any[];
        domain?: any[];
        specifier?: string;
        formatOffset?: number;
    }): (date: Date) => string {
        return specifier == null ? defaultTimeTickFormat(ticks, domain, formatOffset) : buildFormatter(specifier);
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
        this._niceDomain = this.niceDomain(this.domain, {
            interval: this.interval,
            tickCount: this.tickCount,
            minTickCount: this.minTickCount,
            maxTickCount: this.maxTickCount,
        });
    }

    niceDomain(domain: Date[], ticks: ScaleDomainTicks<TimeInterval | number>): Date[] {
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
}

function updateNiceDomainIteration(d0: Date, d1: Date, ticks: ScaleDomainTicks<TimeInterval | number>): [Date, Date] {
    const { interval } = ticks;
    const start = Math.min(dateToNumber(d0), dateToNumber(d1));
    const stop = Math.max(dateToNumber(d0), dateToNumber(d1));

    const isReversed = d0 > d1;

    let i;

    if (interval instanceof TimeInterval) {
        i = interval;
    } else {
        const tickCount = typeof interval === 'number' ? (stop - start) / Math.max(interval, 1) : ticks.tickCount;
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
