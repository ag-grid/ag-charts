import { clamp } from 'ag-charts-core';

export function filterVisibleTicks<T = any>(
    ticks: T[],
    reversed: boolean,
    visibleRange: [number, number] | undefined
): { ticks: T[]; count: number; firstTickIndex: number } {
    if (visibleRange == null || (visibleRange[0] === 0 && visibleRange[1] === 1)) {
        return { ticks, count: ticks.length, firstTickIndex: 0 };
    }

    const vt0 = clamp(0, Math.floor(visibleRange[0] * ticks.length), ticks.length);
    const vt1 = clamp(0, Math.ceil(visibleRange[1] * ticks.length), ticks.length);

    const t0 = reversed ? ticks.length - vt1 : vt0;
    const t1 = reversed ? ticks.length - vt0 : vt1;

    return {
        ticks: ticks.slice(t0, t1),
        count: ticks.length,
        firstTickIndex: t0,
    };
}
