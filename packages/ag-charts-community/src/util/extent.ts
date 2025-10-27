export function extent(values: Array<unknown>): [number, number] | null {
    if (values.length === 0) {
        return null;
    }

    let min = Infinity;
    let max = -Infinity;

    for (const n of values) {
        const v = n instanceof Date ? n.getTime() : n;
        if (typeof v !== 'number') continue;
        if (v < min) {
            min = v;
        }
        if (v > max) {
            max = v;
        }
    }

    const result: [number, number] = [min, max];
    return result.every(Number.isFinite) ? result : null;
}

export function normalisedExtentWithMetadata(
    d: number[],
    min?: number,
    max?: number
): { extent: number[]; clipped: boolean } {
    let clipped = false;

    const de = extent(d);
    if (de == null) {
        return { extent: min != null && max != null && min <= max ? [min, max] : [], clipped: false };
    }

    let [d0, d1] = de;

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
