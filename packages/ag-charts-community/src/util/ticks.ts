import { Logger } from './logger';
import { countFractionDigits } from './number';

export const TickMultipliers = [1, 2, 5, 10];

export function createTicks(
    start: number,
    stop: number,
    count: number,
    minCount?: number,
    maxCount?: number
): number[] {
    if (count < 2) {
        return range(start, stop, stop - start).ticks;
    }
    const step = tickStep(start, stop, count, minCount, maxCount);
    if (isNaN(step)) {
        return [];
    }
    start = Math.ceil(start / step) * step;
    stop = Math.floor(stop / step) * step;
    return range(start, stop, step).ticks;
}

export function tickStep(start: number, end: number, count: number, minCount = 0, maxCount = Infinity): number {
    if (count < 1) {
        return NaN;
    }
    if (start === end) {
        return 1;
    }

    const extent = Math.abs(end - start);
    const step = 10 ** Math.floor(Math.log10(extent / count));

    let m: number = NaN,
        minDiff: number = Infinity,
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

export function range(start: number, stop: number, step: number): { ticks: number[]; fractionDigits: number } {
    const d0 = Math.min(start, stop);
    const d1 = Math.max(start, stop);

    const fractionDigits = countFractionDigits(step);
    const f = Math.pow(10, fractionDigits);
    const n = Math.ceil((d1 - d0) / step);
    const ticks = [];

    for (let i = 0; i <= n; i++) {
        const value = d0 + step * i;
        ticks.push(Math.round(value * f) / f);
    }

    return { ticks, fractionDigits };
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
