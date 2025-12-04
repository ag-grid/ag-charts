import { clamp, readIntegratedWrappedValue } from 'ag-charts-core';

function visibleTickRange<T = any>(
    ticks: T[],
    reversed: boolean,
    visibleRange: [number, number] | undefined
): [number, number] | undefined {
    if (visibleRange == null || (visibleRange[0] === 0 && visibleRange[1] === 1)) return;

    const vt0 = clamp(0, Math.floor(visibleRange[0] * ticks.length), ticks.length);
    const vt1 = clamp(0, Math.ceil(visibleRange[1] * ticks.length), ticks.length);

    const t0 = reversed ? ticks.length - vt1 : vt0;
    const t1 = reversed ? ticks.length - vt0 : vt1;

    return [t0, t1];
}

export function visibleTickSliceIndices<T = any>(
    ticks: T[],
    reversed: boolean,
    visibleRange: [number, number] | undefined
): [number, number] {
    return visibleTickRange(ticks, reversed, visibleRange) ?? [0, ticks.length];
}

export function filterVisibleTicks<T = any>(
    ticks: T[],
    reversed: boolean,
    visibleRange: [number, number] | undefined
): { ticks: T[]; count: number; firstTickIndex: number } {
    const tickRange = visibleTickRange(ticks, reversed, visibleRange);
    if (tickRange == null) return { ticks, count: ticks.length, firstTickIndex: 0 };

    const [t0, t1] = tickRange;

    return {
        ticks: ticks.slice(t0, t1),
        count: ticks.length,
        firstTickIndex: t0,
    };
}

export function unpackDomainMinMax<D>(domain: D[]): [D, D] | [undefined, undefined] {
    // Integrated Charts wrappers datum values in a ChartValueWrapper object.
    // `readIntegratedWrappedValue` reads `ChartValueWrapper.value` when applicable.
    const min: D | undefined = readIntegratedWrappedValue(domain.at(0));
    const max: D | undefined = readIntegratedWrappedValue(domain.at(-1));
    return min != undefined && max != undefined ? [min, max] : [undefined, undefined];
}
