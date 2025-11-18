import { isNumber } from './typeGuards';

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

export function normalisedExtentWithMetadata<T>(
    d: T[],
    min?: T,
    max?: T,
    preferredMin?: T,
    preferredMax?: T,
    toValue?: (x: number) => T
): { extent: T[]; clipped: boolean } {
    let clipped = false;

    const domainExtentNumbers = extent(d);
    const domainExtent =
        domainExtentNumbers && toValue
            ? [toValue(domainExtentNumbers[0]), toValue(domainExtentNumbers[1])]
            : (domainExtentNumbers as [T, T]);

    if (domainExtent == null) {
        let nullExtent: T[] | undefined;
        if (min != null && max != null && min <= max) {
            nullExtent = [min, max];
        } else if (preferredMin != null && preferredMax != null && preferredMin <= preferredMax) {
            nullExtent = [preferredMin, preferredMax];
        }
        return { extent: nullExtent ?? [], clipped: false };
    }

    let [d0, d1] = domainExtent;

    if (min != null) {
        clipped ||= min > d0;
        d0 = min;
    } else if (preferredMin != null && preferredMin < d0) {
        d0 = preferredMin;
    }
    if (max != null) {
        clipped ||= max < d1;
        d1 = max;
    } else if (preferredMax != null && preferredMax > d1) {
        d1 = preferredMax;
    }
    if (d0 > d1) {
        return { extent: [], clipped: false };
    }
    return { extent: [d0, d1], clipped };
}

export function normalisedTimeExtentWithMetadata(
    d: Date[],
    min?: Date | number,
    max?: Date | number,
    preferredMin?: Date | number,
    preferredMax?: Date | number
) {
    const { extent: e, clipped } = normalisedExtentWithMetadata(
        d,
        isNumber(min) ? new Date(min) : min,
        isNumber(max) ? new Date(max) : max,
        isNumber(preferredMin) ? new Date(preferredMin) : preferredMin,
        isNumber(preferredMax) ? new Date(preferredMax) : preferredMax,
        (x) => new Date(x)
    );

    return { extent: e.map((x) => new Date(x)), clipped };
}
