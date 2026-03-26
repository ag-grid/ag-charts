import type { AgTimeInterval } from 'ag-charts-types';

import { warnOnce } from '../../logging/logger';
import { clamp, countFractionDigits } from '../data/numbers';
import { rescaleVisibleRange } from '../data/visibleRange';
import { createNumberFormatter, parseNumberFormat } from '../format/numberFormat';
import {
    durationMonth,
    durationWeek,
    durationYear,
    intervalHierarchy,
    intervalMilliseconds,
    intervalStep,
} from './time';

interface TickInterval {
    duration: number;
    timeInterval: AgTimeInterval;
    step: number;
}

const tInterval = (timeInterval: AgTimeInterval, step: number): TickInterval => ({
    duration: intervalMilliseconds(timeInterval) * step,
    timeInterval,
    step,
});

export const TickIntervals: TickInterval[] = [
    tInterval({ unit: 'second' }, 1),
    tInterval({ unit: 'second' }, 5),
    tInterval({ unit: 'second' }, 15),
    tInterval({ unit: 'second' }, 30),
    tInterval({ unit: 'minute' }, 1),
    tInterval({ unit: 'minute' }, 5),
    tInterval({ unit: 'minute' }, 15),
    tInterval({ unit: 'minute' }, 30),
    tInterval({ unit: 'hour' }, 1),
    tInterval({ unit: 'hour' }, 3),
    tInterval({ unit: 'hour' }, 6),
    tInterval({ unit: 'hour' }, 12),
    tInterval({ unit: 'day' }, 1),
    tInterval({ unit: 'day' }, 2),
    tInterval({ unit: 'day', step: 7 }, 1),
    tInterval({ unit: 'day', step: 7 }, 2),
    tInterval({ unit: 'day', step: 7 }, 3),
    tInterval({ unit: 'month' }, 1),
    tInterval({ unit: 'month' }, 2),
    tInterval({ unit: 'month' }, 3),
    tInterval({ unit: 'month' }, 4),
    tInterval({ unit: 'month' }, 6),
    tInterval({ unit: 'year' }, 1),
];

const TickMultipliers = [1, 2, 5, 10];

function isCloseToInteger(n: number, delta: number) {
    return Math.abs(Math.round(n) - n) < delta;
}

function countTicks(d0: number, d1: number, step: number) {
    const extent = Math.abs(d1 - d0);
    return extent >= step ? Math.abs(d1 - d0) / step + 1 : 1;
}

export function createTicks(
    start: number,
    stop: number,
    count: number,
    minCount?: number,
    maxCount?: number,
    visibleRange?: [number, number]
): { ticks: number[]; count: number; firstTickIndex: number | undefined } {
    if (start === stop) return { ticks: [start], count: 1, firstTickIndex: 0 };
    if (count < 2) return { ticks: [start, stop], count: 2, firstTickIndex: 0 };

    const step = tickStep(start, stop, count, minCount, maxCount);
    if (!Number.isFinite(step)) return { ticks: [], count: 0, firstTickIndex: undefined };

    let d0 = start;
    let d1 = stop;
    if (!isCloseToInteger(d0 / step, 1e-12)) {
        d0 = Math.ceil(d0 / step) * step;
    }
    if (!isCloseToInteger(d1 / step, 1e-12)) {
        d1 = Math.floor(d1 / step) * step;
    }

    if (visibleRange != null) {
        visibleRange = rescaleVisibleRange(visibleRange, [start, stop], [d0, d1]);
    }

    const { ticks } = range(d0, d1, step, visibleRange);
    const firstTick = ticks.at(0);
    return {
        ticks,
        count: countTicks(d0, d1, step),
        firstTickIndex: firstTick == null ? undefined : Math.round((firstTick - d0) / step),
    };
}

const minPrimaryTickRatio = Math.floor(((2 * durationWeek) / durationMonth) * 10) / 10;
function isPrimaryTickInterval({ timeInterval, step }: TickInterval) {
    // Don't include TickIntervals that will have 2 or fewer values between their hierarchy interval
    // I.e. not every 12 hours, because you'll have this interval twice within a day
    const milliseconds = intervalMilliseconds(timeInterval) * step;
    const hierarchy = intervalHierarchy(timeInterval);
    const hierarchyMilliseconds = hierarchy ? intervalMilliseconds(hierarchy) : undefined;
    return milliseconds <= (hierarchyMilliseconds ?? Infinity) * minPrimaryTickRatio;
}

export function defaultEpoch(timeInterval: AgTimeInterval, { weekStart }: { weekStart: Date | undefined }) {
    if (timeInterval.unit === 'day' && timeInterval.step === 7) {
        return weekStart;
    }
}

export function getTickTimeInterval(
    start: number,
    stop: number,
    count: number,
    minCount: number | undefined,
    maxCount: number | undefined,
    {
        weekStart,
        primaryOnly = false,
        targetInterval,
    }: {
        weekStart: Date | undefined;
        primaryOnly?: boolean;
        targetInterval?: number;
    }
): AgTimeInterval | undefined {
    if (count <= 0) return;

    const target = targetInterval ?? Math.abs(stop - start) / Math.max(count, 1);

    const i0 = TickIntervals.findLast((t) => (!primaryOnly || isPrimaryTickInterval(t)) && target > t.duration);
    const i1 = TickIntervals.find((t) => (!primaryOnly || isPrimaryTickInterval(t)) && target <= t.duration);

    if (i0 == null) {
        const step = Math.max(tickStep(start, stop, count, minCount, maxCount), 1);
        return { unit: 'millisecond', step };
    } else if (i1 == null) {
        const step =
            targetInterval == null ? tickStep(start / durationYear, stop / durationYear, count, minCount, maxCount) : 1;
        return { unit: 'year', step };
    }

    const { timeInterval, step } = target - i0.duration < i1.duration - target ? i0 : i1;

    return {
        unit: timeInterval.unit,
        step: intervalStep(timeInterval) * step,
        epoch: defaultEpoch(timeInterval, { weekStart }),
    };
}

export function tickStep(start: number, end: number, count: number, minCount = 0, maxCount = Infinity): number {
    if (start === end) {
        return clamp(1, minCount, maxCount);
    } else if (count < 1) {
        return Number.NaN;
    }

    const extent = Math.abs(end - start);
    const step = 10 ** Math.floor(Math.log10(extent / count));

    let m = Number.NaN,
        minDiff = Infinity,
        isInBounds = false;
    for (const multiplier of TickMultipliers) {
        // @todo(AG-10444) - this should be Math.floor(extent / (multiplier * step)) + 1
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

export function tickFormat(ticks: any[], format?: string): ((n: number | { valueOf(): number }) => string) | undefined {
    const options = parseNumberFormat(format ?? ',f');
    if (options == null) return;

    if (options.precision == null || Number.isNaN(options.precision)) {
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
    const formatter = createNumberFormatter(options);
    return (n) => formatter(Number(n));
}

export function range(
    start: number,
    end: number,
    step: number,
    visibleRange?: [number, number]
): { ticks: number[]; count: number; firstTickIndex: number | undefined } {
    if (!Number.isFinite(step) || step <= 0) {
        return { ticks: [], count: 0, firstTickIndex: undefined };
    } else if (start === end) {
        return { ticks: [start], count: 1, firstTickIndex: 0 };
    }

    const f = 10 ** countFractionDigits(step);
    const d0 = Math.min(start, end);
    const d1 = Math.max(start, end);

    let vd0: number;
    let vd1: number;
    if (visibleRange != null && (visibleRange[0] !== 0 || visibleRange[1] !== 1)) {
        const rangeExtent = end - start;
        const adjustedStart = start + rangeExtent * visibleRange[0];
        const adjustedEnd = end - rangeExtent * (1 - visibleRange[1]);
        vd0 = Math.min(adjustedStart, adjustedEnd);
        vd1 = Math.max(adjustedStart, adjustedEnd);
    } else {
        vd0 = d0;
        vd1 = d1;
    }

    vd0 = Math.floor(vd0 * f) / f;
    vd1 = Math.ceil(vd1 * f) / f;

    const ticks: number[] = [];
    for (let i = 0; ; i += 1) {
        const p = Math.round((d0 + step * i) * f) / f;
        if (p > d1) break;
        if (p >= vd0 && p <= vd1) {
            ticks.push(p);
        }
    }

    const firstTick = ticks.at(0);

    return {
        ticks,
        count: countTicks(d0, d1, step),
        firstTickIndex: firstTick == null ? undefined : Math.round((firstTick - d0) / step),
    };
}

export function isDenseInterval(count: number, availableRange: number) {
    if (count >= availableRange) {
        warnOnce(
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
    zoomExtent: number,
    minSpacing: number | undefined,
    maxSpacing: number | undefined,
    defaultTickCount: number,
    defaultMinSpacing: number
) {
    if (rangeExtent <= 0) {
        return { minTickCount: 0, maxTickCount: 0, tickCount: 0 };
    }

    defaultMinSpacing = Math.max(defaultMinSpacing, rangeExtent / (defaultTickCount + 1));

    minSpacing ??= defaultMinSpacing;
    maxSpacing ??= rangeExtent;

    if (minSpacing > maxSpacing) {
        if (minSpacing === defaultMinSpacing) {
            minSpacing = maxSpacing;
        } else {
            maxSpacing = minSpacing;
        }
    }

    minSpacing = Math.max(minSpacing, 1);

    const maxTickCount = Math.max(1, Math.floor(rangeExtent / (zoomExtent * minSpacing)));
    const minTickCount = Math.min(maxTickCount, Math.ceil(rangeExtent / (zoomExtent * maxSpacing)));
    const tickCount = clamp(minTickCount, Math.floor(defaultTickCount / zoomExtent), maxTickCount);

    return { minTickCount, maxTickCount, tickCount };
}
