import { Logger } from './logger';
import { clamp, countFractionDigits } from './number';
import { numberFormat, parseFormat } from './numberFormat';
import timeDay from './time/day';
import {
    durationDay,
    durationHour,
    durationMinute,
    durationMonth,
    durationSecond,
    durationWeek,
    durationYear,
} from './time/duration';
import timeHour from './time/hour';
import { type CountableTimeInterval, type TimeInterval } from './time/interval';
import timeMillisecond from './time/millisecond';
import timeMinute from './time/minute';
import timeMonth from './time/month';
import timeSecond from './time/second';
import timeWeek from './time/week';
import timeYear from './time/year';

const tInterval = (timeInterval: CountableTimeInterval, baseDuration: number, step: number) => ({
    duration: baseDuration * step,
    timeInterval,
    step,
});

export const TickIntervals = [
    tInterval(timeSecond, durationSecond, 1),
    tInterval(timeSecond, durationSecond, 5),
    tInterval(timeSecond, durationSecond, 15),
    tInterval(timeSecond, durationSecond, 30),
    tInterval(timeMinute, durationMinute, 1),
    tInterval(timeMinute, durationMinute, 5),
    tInterval(timeMinute, durationMinute, 15),
    tInterval(timeMinute, durationMinute, 30),
    tInterval(timeHour, durationHour, 1),
    tInterval(timeHour, durationHour, 3),
    tInterval(timeHour, durationHour, 6),
    tInterval(timeHour, durationHour, 12),
    tInterval(timeDay, durationDay, 1),
    tInterval(timeDay, durationDay, 2),
    tInterval(timeWeek, durationWeek, 1),
    tInterval(timeWeek, durationWeek, 2),
    tInterval(timeWeek, durationWeek, 3),
    tInterval(timeMonth, durationMonth, 1),
    tInterval(timeMonth, durationMonth, 2),
    tInterval(timeMonth, durationMonth, 3),
    tInterval(timeMonth, durationMonth, 4),
    tInterval(timeMonth, durationMonth, 6),
    tInterval(timeYear, durationYear, 1),
];

export const TickMultipliers = [1, 2, 5, 10];

function isCloseToInteger(n: number, delta: number) {
    return Math.abs(Math.round(n) - n) < delta;
}

export function createTicks(
    start: number,
    stop: number,
    count: number,
    minCount?: number,
    maxCount?: number
): number[] {
    if (count < 2) {
        return [start, stop];
    }
    const step = tickStep(start, stop, count, minCount, maxCount);
    if (!Number.isFinite(step)) {
        return [];
    }
    if (!isCloseToInteger(start / step, 1e-12)) {
        start = Math.ceil(start / step) * step;
    }
    if (!isCloseToInteger(stop / step, 1e-12)) {
        stop = Math.floor(stop / step) * step;
    }
    return range(start, stop, step);
}

export function getTickInterval(
    start: number,
    stop: number,
    count: number,
    minCount?: number,
    maxCount?: number,
    targetInterval?: number
): TimeInterval {
    const target = targetInterval ?? Math.abs(stop - start) / Math.max(count, 1);

    let i = 0;
    for (const tickInterval of TickIntervals) {
        if (target <= tickInterval.duration) break;
        i++;
    }

    if (i === 0) {
        const step = Math.max(tickStep(start, stop, count, minCount, maxCount), 1);
        return timeMillisecond.every(step);
    } else if (i === TickIntervals.length) {
        const step =
            targetInterval == null ? tickStep(start / durationYear, stop / durationYear, count, minCount, maxCount) : 1;
        return timeYear.every(step);
    }

    const i0 = TickIntervals[i - 1];
    const i1 = TickIntervals[i];
    const { timeInterval, step } = target - i0.duration < i1.duration - target ? i0 : i1;
    return timeInterval.every(step);
}

export function tickStep(start: number, end: number, count: number, minCount = 0, maxCount = Infinity): number {
    if (start === end) {
        return clamp(1, minCount, maxCount);
    } else if (count < 1) {
        return NaN;
    }

    const extent = Math.abs(end - start);
    const step = 10 ** Math.floor(Math.log10(extent / count));

    let m = NaN,
        minDiff = Infinity,
        isInBounds = false;
    for (const multiplier of TickMultipliers) {
        const c = Math.ceil(extent / (multiplier * step));
        const validBounds = c >= minCount && c <= maxCount;
        if (isInBounds && !validBounds) continue;
        const diffCount = Math.abs(c - count);
        if (minDiff > diffCount || isInBounds !== validBounds) {
            isInBounds ||= validBounds;
            minDiff = diffCount;
            m = multiplier;
        }
    }

    return m * step;
}

function decimalPlaces(decimal: string) {
    for (let i = decimal.length - 1; i >= 0; i -= 1) {
        if (decimal[i] !== '0') {
            return i + 1;
        }
    }
    return 0;
}

export function tickFormat(ticks: any[], format?: string): (n: number | { valueOf(): number }) => string {
    const options = parseFormat(format ?? ',f');
    if (options.precision == null || isNaN(options.precision)) {
        if (!options.type || 'eEFgGnprs'.includes(options.type)) {
            options.precision = Math.max(
                ...ticks.map((x) => {
                    if (!Number.isFinite(x)) return 0;
                    const [integer, decimal] = x.toExponential((options.type ? 6 : 12) - 1).split(/[.e]/g);
                    return (integer !== '1' && integer !== '-1' ? 1 : 0) + decimalPlaces(decimal) + 1;
                })
            );
        } else if ('f%'.includes(options.type)) {
            options.precision = Math.max(
                ...ticks.map((x) => {
                    if (!Number.isFinite(x) || x === 0) return 0;
                    const l = Math.floor(Math.log10(Math.abs(x)));
                    const digits = options.type ? 6 : 12;
                    const decimal = x.toExponential(digits - 1).split(/[.e]/g)[1];
                    const decimalLength = decimalPlaces(decimal);
                    return Math.max(0, decimalLength - l);
                })
            );
        }
    }
    const formatter = numberFormat(options);
    return (n) => formatter(Number(n));
}

export function range(start: number, end: number, step: number): number[] {
    if (!Number.isFinite(step) || step <= 0) {
        return [];
    }

    const f = 10 ** countFractionDigits(step);
    const d0 = Math.min(start, end);
    const d1 = Math.max(start, end);
    const out: number[] = [];

    for (let i = 0; ; i += 1) {
        const p = Math.round((d0 + step * i) * f) / f;
        if (p > d1) break;
        out.push(p);
    }

    return out;
}

export function isDenseInterval(count: number, availableRange: number) {
    if (count >= availableRange) {
        Logger.warnOnce(
            `the configured interval results in more than 1 item per pixel, ignoring. Supply a larger interval or omit this configuration`
        );
        return true;
    }
    return false;
}

export function niceTicksDomain(start: number, end: number) {
    const extent = Math.abs(end - start);
    const step = 10 ** Math.floor(Math.log10(extent));

    let minError = Infinity,
        ticks = [start, end];
    for (const multiplier of TickMultipliers) {
        const m = multiplier * step;
        const d0 = Math.floor(start / m) * m;
        const d1 = Math.ceil(end / m) * m;
        const error = 1 - extent / Math.abs(d1 - d0);
        if (minError > error) {
            minError = error;
            ticks = [d0, d1];
        }
    }
    return ticks;
}

export function estimateTickCount(
    rangeExtent: number,
    minSpacing: number,
    maxSpacing: number,
    defaultTickCount: number,
    defaultMinSpacing: number
) {
    defaultMinSpacing = Math.max(defaultMinSpacing, rangeExtent / (defaultTickCount + 1));

    if (isNaN(minSpacing)) {
        minSpacing = defaultMinSpacing;
    }
    if (isNaN(maxSpacing)) {
        maxSpacing = rangeExtent;
    }
    if (minSpacing > maxSpacing) {
        if (minSpacing === defaultMinSpacing) {
            minSpacing = maxSpacing;
        } else {
            maxSpacing = minSpacing;
        }
    }

    const maxTickCount = clamp(1, Math.floor(rangeExtent / minSpacing), Math.min(Math.floor(rangeExtent), 100));
    const minTickCount = Math.min(maxTickCount, Math.ceil(rangeExtent / maxSpacing));
    const tickCount = clamp(minTickCount, defaultTickCount, maxTickCount);

    return { minTickCount, maxTickCount, tickCount };
}
