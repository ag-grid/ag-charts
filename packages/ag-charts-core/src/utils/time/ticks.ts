import type { AgTimeInterval } from 'ag-charts-types';

import type { Logger } from '../../logging/logger';
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

export function tickFormat(
    ticks: any[],
    format?: string
): ((n: number | bigint | { valueOf(): number }) => string) | undefined {
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
    // Route bigint through the formatter too: it applies the format's prefix/suffix and pins en-US grouping
    // for bigint full-precision, so a bigint tick honours the user's label format rather than emitting a bare number.
    return (n) => formatter(typeof n === 'bigint' ? n : Number(n));
}

function bigIntTickStep(extent: bigint, count: number): bigint {
    // Sub-step ranges (fewer than 4 bits) fit comfortably in 53 bits, so the float nice-multiplier
    // picker is exact here; we then convert the chosen step back to BigInt.
    if (extent.toString(2).length < 4) {
        return BigInt(Math.max(1, Math.round(tickStep(0, Number(extent), count))));
    }

    const target = extent / BigInt(Math.max(1, Math.round(count)));
    let pow10 = 1n;
    while (pow10 * 10n <= target) {
        pow10 *= 10n;
    }

    // Pick the nice multiplier whose tick count is closest to `count`. `extent / step` is bounded by
    // ~count*10 for any span (pow10 ≈ extent/count), so the Number() narrowing stays exact.
    let best = pow10;
    let bestDiff = Infinity;
    for (const multiplier of TickMultipliers) {
        const step = BigInt(multiplier) * pow10;
        const ticks = Number(extent / step) + 1;
        const diff = Math.abs(ticks - count);
        if (diff < bestDiff) {
            bestDiff = diff;
            best = step;
        }
    }
    return best;
}

// BigInt division truncates toward zero, so rounding to a step multiple is sign-dependent: a positive
// remainder rounds up with +step, a negative one rounds down with -step.
function ceilToStep(value: bigint, step: bigint): bigint {
    const remainder = value % step;
    if (remainder === 0n) return value;
    return value > 0n ? value - remainder + step : value - remainder;
}

function floorToStep(value: bigint, step: bigint): bigint {
    const remainder = value % step;
    if (remainder === 0n) return value;
    return value < 0n ? value - remainder - step : value - remainder;
}

/**
 * Full-precision integer ticks for a BigInt domain, mirroring {@link createTicks} but staying in BigInt
 * end-to-end so spans beyond `Number.MAX_SAFE_INTEGER` keep exact label values. Descending domains are
 * supported; `0n` is always a step multiple, so it appears whenever the domain crosses zero.
 */
export function createBigIntTicks(start: bigint, stop: bigint, count: number): bigint[] {
    if (start === stop) return [start];
    if (count < 2) return [start, stop];

    const ascending = start < stop;
    const lo = ascending ? start : stop;
    const hi = ascending ? stop : start;

    const step = bigIntTickStep(hi - lo, count);
    if (step <= 0n) return [start, stop];

    const first = ceilToStep(lo, step);
    const last = floorToStep(hi, step);

    const ticks: bigint[] = [];
    for (let tick = first; tick <= last; tick += step) {
        ticks.push(tick);
    }

    return ascending ? ticks : ticks.reverse();
}

/**
 * Exactly `count` contiguous, equal-width BigInt bins (histogram bucketing), splitting the domain
 * evenly from its minimum. The Number path additionally snaps the first edge down to an absolute
 * power of 10; that snap is scale-dependent so it is deliberately not replicated here — an even split
 * keeps the bin count and boundary proportions identical for a BigInt domain that is a pure scaling
 * of a Number domain.
 */
export function createBigIntBins(start: bigint, stop: bigint, count: number): [bigint, bigint][] {
    const lo = start < stop ? start : stop;
    const hi = start < stop ? stop : start;
    if (lo === hi) return [[lo, hi]];

    // NaN-safe clamp to a positive integer — BigInt(NaN) throws.
    const segments = BigInt(Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1);
    const span = hi - lo;

    const bins: [bigint, bigint][] = [];
    for (let i = 0n; i < segments; i += 1n) {
        const a = lo + (i * span) / segments;
        const b = i === segments - 1n ? hi : lo + ((i + 1n) * span) / segments;
        bins.push([a, b]);
    }
    return bins;
}

/**
 * Tick-aligned BigInt bins for when no bin count is specified, mirroring the Number path that expands
 * nice tick positions into bins: each tick within the domain starts a bin one step wide, plus a leading
 * bin so the domain minimum is always covered.
 */
export function createBigIntTickBins(start: bigint, stop: bigint, count: number): [bigint, bigint][] {
    const lo = start < stop ? start : stop;
    const hi = start < stop ? stop : start;

    const step = lo === hi ? 0n : bigIntTickStep(hi - lo, count);
    if (step <= 0n) return [[lo, hi]];

    const first = ceilToStep(lo, step);
    const last = floorToStep(hi, step);

    const bins: [bigint, bigint][] = [[first - step, first]];
    for (let edge = first; edge <= last; edge += step) {
        bins.push([edge, edge + step]);
    }
    return bins;
}

/** Nice BigInt domain bounds — extends the endpoints outward to the surrounding step multiples. */
export function niceBigIntDomain(start: bigint, stop: bigint, count: number): [bigint, bigint] {
    if (start === stop) return [start, stop];

    const ascending = start < stop;
    const lo = ascending ? start : stop;
    const hi = ascending ? stop : start;

    const step = bigIntTickStep(hi - lo, count);
    if (step <= 0n) return [start, stop];

    const niceLo = floorToStep(lo, step);
    const niceHi = ceilToStep(hi, step);
    return ascending ? [niceLo, niceHi] : [niceHi, niceLo];
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

export function isDenseInterval(count: number, availableRange: number, logger: Logger | undefined) {
    if (count >= availableRange) {
        logger?.warnOnce(
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
