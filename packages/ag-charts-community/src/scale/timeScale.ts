import { findMinMax } from '../util/number';
import { TickIntervals, getTickInterval, isDenseInterval } from '../util/ticks';
import { TimeInterval } from '../util/time/interval';
import { buildFormatter } from '../util/timeFormat';
import { dateToNumber, defaultTimeTickFormat } from '../util/timeFormatDefaults';
import { ContinuousScale } from './continuousScale';
import type { ScaleConvertParams } from './scale';

export class TimeScale extends ContinuousScale<Date, TimeInterval | number> {
    readonly type = 'time';

    public constructor() {
        super([], [0, 1]);
    }

    toDomain(d: number): Date {
        return new Date(d);
    }

    override convert(x: Date, opts?: ScaleConvertParams | undefined): number {
        return super.convert(new Date(x), opts);
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

        const { interval, nice, tickCount, minTickCount, maxTickCount } = this;
        const [start, stop] = findMinMax(this.getDomain().map(dateToNumber));

        if (interval != null) {
            return (
                TimeScale.getTicksForInterval({ start, stop, interval, availableRange: this.getPixelRange() }) ??
                TimeScale.getDefaultTicks({ start, stop, tickCount, minTickCount, maxTickCount })
            );
        } else if (nice && tickCount === 2) {
            return this.niceDomain;
        } else if (nice && tickCount === 1) {
            return this.niceDomain.slice(0, 1);
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

        const reversedInterval = [...TickIntervals].reverse();
        const timeInterval = reversedInterval.find((tickInterval) => absInterval % tickInterval.duration === 0);

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
     * @param specifier If the specifier string is provided, this method is equivalent to
     * the {@link TimeLocaleObject.format} method.
     * If no specifier is provided, this method returns the default time format function.
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
            i = getTickInterval(start, stop, tickCount, this.minTickCount, this.maxTickCount);
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
