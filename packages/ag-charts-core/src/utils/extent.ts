export function extent(values: Array<unknown>): [number, number] | null {
    if (values.length === 0) {
        return null;
    }

    let min = Infinity;
    let max = -Infinity;

    for (const value of values) {
        const numeric = value instanceof Date ? value.getTime() : value;
        if (typeof numeric !== 'number') continue;
        if (numeric < min) min = numeric;
        if (numeric > max) max = numeric;
    }

    const result: [number, number] = [min, max];
    return result.every(Number.isFinite) ? result : null;
}

export function normalisedExtentWithMetadata(
    data: number[],
    min?: number,
    max?: number
): { extent: number[]; clipped: boolean } {
    let clipped = false;

    const dataExtent = extent(data);
    if (dataExtent == null) {
        return { extent: min != null && max != null && min <= max ? [min, max] : [], clipped: false };
    }

    let [d0, d1] = dataExtent;

    if (min != null) {
        clipped ||= min > d0;
        d0 = min;
    }
    if (max != null) {
        clipped ||= max < d1;
        d1 = max;
    }

    if (d0 > d1) {
        return { extent: [], clipped: false };
    }

    return { extent: [d0, d1], clipped };
}
