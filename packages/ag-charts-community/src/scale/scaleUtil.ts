import { clamp } from '../util/number';

export function filterVisibleTicks<T = any>(
    ticks: T[],
    reversed: boolean,
    visibleRange: [number, number] | undefined
): T[] {
    if (visibleRange == null || (visibleRange[0] === 0 && visibleRange[1] === 1)) return ticks;

    const vt0 = clamp(0, Math.floor(visibleRange[0] * ticks.length), ticks.length);
    const vt1 = clamp(0, Math.ceil(visibleRange[1] * ticks.length), ticks.length);

    const t0 = reversed ? ticks.length - vt1 : vt0;
    const t1 = reversed ? ticks.length - vt0 : vt1;

    return ticks.slice(t0, t1);
}
