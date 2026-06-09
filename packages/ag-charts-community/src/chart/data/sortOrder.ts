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
        const primitive = needsValueOf ? value.valueOf() : value;
        if (typeof primitive !== 'number' && typeof primitive !== 'bigint') return;

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
