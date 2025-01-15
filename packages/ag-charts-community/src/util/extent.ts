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
    return result.every(isFinite) ? result : null;
}

export function normalisedExtentWithMetadata(
    d: number[],
    min: number,
    max: number
): { extent: number[]; clipped: boolean } {
    let clipped = false;

    if (d.length > 2) {
        d = extent(d) ?? [NaN, NaN];
    }
    if (!isNaN(min)) {
        clipped ||= min > d[0];
        d = [min, d[1]];
    }
    if (!isNaN(max)) {
        clipped ||= max < d[1];
        d = [d[0], max];
    }
    if (d[0] > d[1]) {
        d = [];
    }
    return { extent: d, clipped };
}
