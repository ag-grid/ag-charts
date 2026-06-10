import { ScaleAlignment, isNumericValue } from 'ag-charts-core';

export function rangeAlignment(start: unknown, end: unknown): [ScaleAlignment | undefined, ScaleAlignment | undefined] {
    const startValue = start?.valueOf();
    const endValue = end?.valueOf();

    // isNumericValue: a bigint range endpoint must align like a number (mixed comparison is safe).
    if (!isNumericValue(startValue) || !isNumericValue(endValue)) return [undefined, undefined];

    return startValue < endValue
        ? [ScaleAlignment.Leading, ScaleAlignment.Trailing]
        : [ScaleAlignment.Trailing, ScaleAlignment.Leading];
}
