export function filterVisibleTicks<T = any>(
    ticks: T[],
    reversed: boolean,
    visibleRange: [number, number] | undefined
): T[] {
    if (visibleRange == null || (visibleRange[0] === 0 && visibleRange[1] === 1)) return ticks;

    let t0 = Math.max(0, Math.floor(visibleRange[0] * ticks.length));
    let t1 = Math.min(ticks.length, Math.ceil(visibleRange[1] * ticks.length));

    if (reversed) {
        t0 = ticks.length - t1;
        t1 = ticks.length - t0;
    }

    return ticks.slice(t0, t1);
}
