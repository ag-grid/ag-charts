import { isISO8601, timeValueToNumber } from 'ag-charts-core';

export type SortOrder = -1 | 1 | undefined;

export function valuesSortOrder(values: any[], needsValueOf: boolean): SortOrder {
    const valuesLength = values.length;
    if (values.length <= 1) return 1;

    let order = 0 as 1 | -1 | 0;

    let prev: number | bigint | undefined;
    for (let i = 0; i < valuesLength; i++) {
        const value = values[i];
        if (value == null) continue;

        // Skip valueOf() call when we know the column contains only primitives
        let primitive = needsValueOf ? value.valueOf() : value;
        // ISO 8601 datetime strings are valid time-axis data; compare by epoch so sorted
        // columns are detected and downstream consumers can use binary-search fast paths.
        if (typeof primitive === 'string' && isISO8601(primitive)) {
            primitive = timeValueToNumber(primitive);
            if (!Number.isFinite(primitive)) return;
        }
        if (typeof primitive !== 'number' && typeof primitive !== 'bigint') return;
        // NaN compares false against everything, which would silently read as a tie — treat the
        // column as unsorted so downstream binary-search fast paths never run over invalid values.
        if (typeof primitive === 'number' && Number.isNaN(primitive)) return;

        if (prev !== undefined) {
            // Relational comparison is bigint-safe and works across number/bigint; Math.sign(v1 - v0) throws on bigint.
            let diff: 1 | -1 | 0 = 0;
            if (primitive > prev) diff = 1;
            else if (primitive < prev) diff = -1;
            if (diff !== 0) {
                if (order !== 0 && order !== diff) return;
                order = diff;
            }
        }

        prev = primitive;
    }

    return order === 0 ? 1 : order;
}
