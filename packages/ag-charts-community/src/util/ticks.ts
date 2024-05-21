import { Logger } from './logger';
import { countFractionDigits } from './number';

const TickMultipliers = [1, 2, 5, 10];

export default function (
    start: number,
    stop: number,
    count: number,
    minCount?: number,
    maxCount?: number
): { ticks: number[]; fractionDigits: number } {
    if (count < 2) {
        return range(start, stop, stop - start);
    }
    const step = tickStep(start, stop, count, minCount, maxCount);
    if (isNaN(step)) {
        return { ticks: [], fractionDigits: 0 };
    }
    start = Math.ceil(start / step) * step;
    stop = Math.floor(stop / step) * step;
    return range(start, stop, step);
}

export function tickStep(from: number, to: number, count: number, minCount = 0, maxCount = Infinity): number {
    if (count < 1) {
        return NaN;
    }
    if (from === to) {
        return 1;
    }

    const extent = Math.abs(to - from);
    const step = 10 ** Math.floor(Math.log10(extent / count));

    let d: number = Infinity,
        m: number = NaN,
        isInBounds = false;
    for (const multiplier of TickMultipliers) {
        const c = Math.ceil(extent / (multiplier * step));
        const validBounds = c >= minCount && c <= maxCount;
        if (isInBounds && !validBounds) continue;
        const diffCount = Math.abs(c - count);
        if (d > diffCount || isInBounds !== validBounds) {
            isInBounds ||= validBounds;
            d = diffCount;
            m = multiplier;
        }
    }

    return m * step;
}

export function singleTickDomain(a: number, b: number): number[] {
    const extent = Math.abs(b - a);
    const power = Math.floor(Math.log10(extent));
    const step = Math.pow(10, power);

    const roundStart = a > b ? Math.ceil : Math.floor;
    const roundStop = b < a ? Math.floor : Math.ceil;

    return TickMultipliers.map((multiplier) => {
        const s = multiplier * step;
        const start = roundStart(a / s) * s;
        const end = roundStop(b / s) * s;
        const error = 1 - extent / Math.abs(end - start);
        const domain = [start, end];
        return { error, domain };
    }).sort((a2, b2) => a2.error - b2.error)[0].domain;
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
