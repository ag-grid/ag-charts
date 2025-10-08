export type SortOrder = -1 | 1 | undefined;

export function valuesSortOrder(values: any[], needsValueOf: boolean): SortOrder {
    const valuesLength = values.length;
    if (values.length <= 1) return 1;

    let order = 0 as 1 | -1 | 0;

    let v0 = values[0];
    for (let i = 1; i < valuesLength; i++) {
        const v1 = values[i];
        if (v1 == null) continue;

        // Skip valueOf() call when we know the column contains only primitives
        const primitive = needsValueOf ? v1.valueOf() : v1;
        if (typeof primitive !== 'number') return;

        const diff = Math.sign(v1 - v0) as 1 | -1 | 0;
        if (diff !== 0) {
            if (order !== 0 && order !== diff) return;
            order = diff;
        }

        v0 = v1;
    }

    return order === 0 ? 1 : order;
}
