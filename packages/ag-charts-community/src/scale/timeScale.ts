import type { ScaleTickParams, ScaleTickResult } from 'ag-charts-core';
import { isPlainObject } from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { TickIntervals, defaultEpoch, getTickTimeInterval, isDenseInterval } from '../util/ticks';
import { intervalRange, intervalRangeStartIndex, intervalStep } from '../util/time';
import { dateToNumber } from '../util/timeFormatDefaults';
import { ContinuousScale } from './continuousScale';

const sunday = new Date(1970, 0, 4);

// eslint-disable-next-line sonarjs/use-type-alias
export class TimeScale extends ContinuousScale<Date, AgTimeInterval | AgTimeIntervalUnit | number> {
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

    override convert(value: Date | number, options?: { clamp: boolean }): number {
        return super.convert(value?.valueOf() ?? Number.NaN, options);
    }

    override invert(value: number): Date {
        return new Date(super.invert(value));
    }

    override niceDomain(ticks: ScaleTickParams<AgTimeInterval | number>, domain: Date[] = this.domain): Date[] {
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
        params: ScaleTickParams<AgTimeInterval | AgTimeIntervalUnit | number>,
        domain: Date[] = this.domain,
        visibleRange: [number, number] = [0, 1],
        { extend = false } = {}
    ): ScaleTickResult<Date> | undefined {
        const { nice, interval, tickCount = ContinuousScale.defaultTickCount, minTickCount, maxTickCount } = params;
        if (domain.length < 2) return;

        const timestamps = domain.map(dateToNumber);
        const start = timestamps[0];
        const stop = timestamps.at(-1);

        if (interval != null) {
            const availableRange = this.getPixelRange();
            return {
                ticks:
                    getDateTicksForInterval({ start, stop, interval, availableRange, visibleRange, extend }) ??
                    getDefaultDateTicks({ start, stop, tickCount, minTickCount, maxTickCount, visibleRange, extend }),
                count: undefined,
            };
        } else if (nice && tickCount === 2) {
            return { ticks: domain, count: undefined };
        } else if (nice && tickCount === 1) {
            return { ticks: domain.slice(0, 1), count: undefined };
        }

        const timeInterval = getTickTimeInterval(start, stop, tickCount, minTickCount, maxTickCount, {
            weekStart: sunday,
        });
        if (timeInterval == null) return;

        const ticks = intervalRange(timeInterval, new Date(start), new Date(stop), { visibleRange, extend });
        const firstTickIndex = intervalRangeStartIndex(timeInterval, new Date(start), new Date(stop), {
            visibleRange,
            extend,
        });
        return {
            ticks,
            count: undefined,
            firstTickIndex,
            timeInterval,
        };
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
    return t ? intervalRange(t, new Date(start), new Date(stop), { visibleRange, extend }) : []; // inclusive stop
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
    interval: number | AgTimeInterval | AgTimeIntervalUnit;
    availableRange: number;
    visibleRange: [number, number] | undefined;
    extend: boolean;
}): Date[] | undefined {
    if (!interval) {
        return [];
    }

    if (isPlainObject(interval) || typeof interval === 'string') {
        const ticks = intervalRange(interval, new Date(start), new Date(stop), { visibleRange, extend });
        if (isDenseInterval(ticks.length, availableRange)) {
            return;
        }

        return ticks;
    }

    const absInterval = Math.abs(interval);

    if (isDenseInterval(Math.abs(stop - start) / absInterval, availableRange)) return;

    const tickInterval = TickIntervals.findLast((t) => absInterval % t.duration === 0);

    if (tickInterval) {
        const { timeInterval, step, duration } = tickInterval;
        const alignedInterval: AgTimeInterval = {
            ...timeInterval,
            step: step * intervalStep(timeInterval) * Math.round(absInterval / duration),
            epoch: defaultEpoch(timeInterval, { weekStart: sunday }),
        };
        return intervalRange(alignedInterval, new Date(start), new Date(stop), { visibleRange, extend });
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
    ticks: ScaleTickParams<AgTimeInterval | AgTimeIntervalUnit | number>,
    availableRange: number
): [Date, Date] {
    const { interval } = ticks;
    const start = Math.min(dateToNumber(d0), dateToNumber(d1));
    const stop = Math.max(dateToNumber(d0), dateToNumber(d1));

    let i: AgTimeInterval | AgTimeIntervalUnit | undefined;

    if (isPlainObject(interval) || typeof interval === 'string') {
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

    if (i == null) return [d0, d1];

    const domain = intervalRange(i, new Date(start), new Date(stop), { extend: true });

    if (domain == null || domain.length < 2) return [d0, d1];

    const r0 = domain[0];
    const r1 = domain.at(-1)!;
    return d0 <= d1 ? [r0, r1] : [r1, r0];
}
