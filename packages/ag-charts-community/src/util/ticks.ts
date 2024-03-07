import { countFractionDigits } from './number';

// @todo(AG-10085): Improve types for this
export type NumericTicks = number[] & {
    fractionDigits: number;
};

export const createNumericTicks = (fractionDigits: number, takingValues: number[] = []): NumericTicks =>
    Object.assign(takingValues, { fractionDigits });

export default function (
    start: number,
    stop: number,
    count: number,
    minCount?: number,
    maxCount?: number
): NumericTicks {
    if (count < 2) {
        return range(start, stop, stop - start);
    }
    const step = tickStep(start, stop, count, minCount, maxCount);
    if (isNaN(step)) {
        return createNumericTicks(0);
    }
    start = Math.ceil(start / step) * step;
    stop = Math.floor(stop / step) * step;
    return range(start, stop, step);
}

const tickMultipliers = [1, 2, 5, 10];

export function tickStep(a: number, b: number, count: number, minCount = 0, maxCount = Infinity): number {
    const extent = Math.abs(b - a);
    const rawStep = extent / count;
    const power = Math.floor(Math.log10(rawStep));
    const step = Math.pow(10, power);
    const m = tickMultipliers
        .map((multiplier) => {
            const s = multiplier * step;
            const c = Math.ceil(extent / s);
            const isWithinBounds = c >= minCount && c <= maxCount;
            const diffCount = Math.abs(c - count);
            return { multiplier, isWithinBounds, diffCount };
        })
        .sort((a2, b2) => {
            if (a2.isWithinBounds !== b2.isWithinBounds) {
                return a2.isWithinBounds ? -1 : 1;
            }
            return a2.diffCount - b2.diffCount;
        })[0].multiplier;
    if (!m || isNaN(m)) {
        return NaN;
    }
    return m * step;
}

export function singleTickDomain(a: number, b: number): number[] {
    const extent = Math.abs(b - a);
    const power = Math.floor(Math.log10(extent));
    const step = Math.pow(10, power);

    const roundStart = a > b ? Math.ceil : Math.floor;
    const roundStop = b < a ? Math.floor : Math.ceil;

    return tickMultipliers
        .map((multiplier) => {
            const s = multiplier * step;
            const start = roundStart(a / s) * s;
            const end = roundStop(b / s) * s;
            const error = 1 - extent / Math.abs(end - start);
            const domain = [start, end];
            return { error, domain };
        })
        .sort((a2, b2) => a2.error - b2.error)[0].domain;
}

export function range(start: number, stop: number, step: number): NumericTicks {
    const d0 = Math.min(start, stop);
    const d1 = Math.max(start, stop);

    const fractionalDigits = countFractionDigits(step);
    const f = Math.pow(10, fractionalDigits);
    const n = Math.ceil((d1 - d0) / step);
    const values = createNumericTicks(fractionalDigits);

    for (let i = 0; i <= n; i++) {
        const value = d0 + step * i;
        values.push(Math.round(value * f) / f);
    }

    return values;
}
