import type { AgNumericValue } from 'ag-charts-types';

import type { DomainWithMetadata } from '../../types/scales';
import { isFiniteNumericValue, isNumber, isNumericValue } from '../types/typeGuards';

// Date/number inputs yield a Number extent; only a bigint input carries bigint endpoints. The overloads
// keep bigint out of the result type for the common (Date/number) callers, so it never percolates falsely.
export function extent(
    values: readonly (number | Date | null | undefined)[],
    sortOrder?: 1 | -1
): [number, number] | null;
export function extent(values: readonly (bigint | null | undefined)[], sortOrder?: 1 | -1): [bigint, bigint] | null;
export function extent(values: readonly unknown[], sortOrder?: 1 | -1): [AgNumericValue, AgNumericValue] | null;
export function extent(values: readonly unknown[], sortOrder?: 1 | -1): [AgNumericValue, AgNumericValue] | null {
    if (values.length === 0) {
        return null;
    }

    // Fast path: if data is sorted, extent is trivially [first, last] or [last, first]
    if (sortOrder !== undefined) {
        const first = values.at(0);
        const last = values.at(-1);
        const v0 = first instanceof Date ? first.getTime() : first;
        const v1 = last instanceof Date ? last.getTime() : last;

        if (isNumericValue(v0) && isNumericValue(v1)) {
            return sortOrder === 1 ? [v0, v1] : [v1, v0];
        }
    }

    // bigint endpoints are retained so a bigint column's exact extent reaches the scale. Comparisons
    // against the Number Infinity seed and between bigints are legal — only +/-/* mixing throws.
    let min: AgNumericValue = Infinity;
    let max: AgNumericValue = -Infinity;

    for (const n of values) {
        const v = n instanceof Date ? n.getTime() : n;
        if (!isNumericValue(v)) continue;
        if (v < min) {
            min = v;
        }
        if (v > max) {
            max = v;
        }
    }

    return isFiniteNumericValue(min) && isFiniteNumericValue(max) ? [min, max] : null;
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
    // `toValue` is only supplied for Date domains, whose extent is always Number; a bigint number-axis
    // domain takes the un-mapped branch and passes its exact endpoints straight through as T.
    const domainExtent =
        domainExtentNumbers && toValue
            ? [toValue(Number(domainExtentNumbers[0])), toValue(Number(domainExtentNumbers[1]))]
            : (domainExtentNumbers as [T, T] | null);

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
