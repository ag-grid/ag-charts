import { ScaleAlignment } from 'ag-charts-core';

export function rangeAlignment(start: unknown, end: unknown): [ScaleAlignment | undefined, ScaleAlignment | undefined] {
    const startValue = start?.valueOf();
    const endValue = end?.valueOf();

    if (typeof startValue !== 'number' || typeof endValue !== 'number') return [undefined, undefined];

    return startValue < endValue
        ? [ScaleAlignment.Leading, ScaleAlignment.Trailing]
        : [ScaleAlignment.Trailing, ScaleAlignment.Leading];
}
