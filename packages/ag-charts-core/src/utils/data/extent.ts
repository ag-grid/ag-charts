import type { DomainWithMetadata } from '../../types/scales';
import { isNumber } from '../types/typeGuards';

// bigint endpoints are retained so a bigint column's exact extent reaches the scale (the domain
// setter and tick generation branch on `typeof` at runtime). Comparisons against the Number Infinity
// seed and between bigints are legal — only +/-/* mixing throws — so min/max selection is safe.
const isFiniteEndpoint = (v: number | bigint) => typeof v === 'bigint' || Number.isFinite(v);

export function extent(values: Array<unknown>, sortOrder?: 1 | -1): [number, number] | null {
    if (values.length === 0) {
        return null;
    }

    // Fast path: if data is sorted, extent is trivially [first, last] or [last, first]
    if (sortOrder !== undefined) {
        const first = values.at(0);
        const last = values.at(-1);
        const v0 = first instanceof Date ? first.getTime() : first;
        const v1 = last instanceof Date ? last.getTime() : last;

        if ((typeof v0 === 'number' || typeof v0 === 'bigint') && (typeof v1 === 'number' || typeof v1 === 'bigint')) {
            return (sortOrder === 1 ? [v0, v1] : [v1, v0]) as [number, number];
        }
    }

    let min: number | bigint = Infinity;
    let max: number | bigint = -Infinity;

    for (const n of values) {
        const v = n instanceof Date ? n.getTime() : n;
        if (typeof v !== 'number' && typeof v !== 'bigint') continue;
        if (v < min) {
            min = v;
        }
        if (v > max) {
            max = v;
        }
    }

    return isFiniteEndpoint(min) && isFiniteEndpoint(max) ? ([min, max] as [number, number]) : null;
}

export function normalisedExtentWithMetadata<T>(
    d: T[],
    min?: T,
    max?: T,
    preferredMin?: T,
    preferredMax?: T,
    toValue?: (x: number) => T,
    sortOrder?: 1 | -1
): { extent: T[]; clipped: boolean } {
    let clipped = false;

    const domainExtentNumbers = extent(d, sortOrder);
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
    input: DomainWithMetadata<Date>,
    min?: Date | number,
    max?: Date | number,
    preferredMin?: Date | number,
    preferredMax?: Date | number
) {
    const { extent: e, clipped } = normalisedExtentWithMetadata(
        input.domain,
        isNumber(min) ? new Date(min) : min,
        isNumber(max) ? new Date(max) : max,
        isNumber(preferredMin) ? new Date(preferredMin) : preferredMin,
        isNumber(preferredMax) ? new Date(preferredMax) : preferredMax,
        (x) => new Date(x),
        input.sortMetadata?.sortOrder
    );

    return { extent: e.map((x) => new Date(x)), clipped };
}
