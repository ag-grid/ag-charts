import { ScaleAlignment } from '../scale/scale';

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

export function extentAlignment(
    start: unknown,
    end: unknown
): [ScaleAlignment | undefined, ScaleAlignment | undefined] {
    const startValue = start?.valueOf();
    const endValue = end?.valueOf();

    if (typeof startValue !== 'number' || typeof endValue !== 'number') return [undefined, undefined];

    return startValue < endValue
        ? [ScaleAlignment.Leading, ScaleAlignment.Trailing]
        : [ScaleAlignment.Trailing, ScaleAlignment.Leading];
}

export function normalisedExtentWithMetadata(
    d: number[],
    min?: number,
    max?: number
): { extent: number[]; clipped: boolean } {
    let clipped = false;

    if (d.length > 2) {
        d = extent(d) ?? [NaN, NaN];
    }
    if (min != null) {
        clipped ||= min > d[0];
        d = [min, d[1]];
    }
    if (max != null) {
        clipped ||= max < d[1];
        d = [d[0], max];
    }
    if (d[0] > d[1]) {
        d = [];
    }
    return { extent: d, clipped };
}
