import type { AgNumericValue } from 'ag-charts-types';

import { clamp } from './numbers';

export function clampArray(value: number, array: readonly number[]) {
    const [min, max] = findMinMax(array);
    return clamp(min, value, max);
}

export function findMinMax(array: readonly number[]): number[];
export function findMinMax(array: readonly AgNumericValue[]): AgNumericValue[];
export function findMinMax(array: readonly AgNumericValue[]): AgNumericValue[] {
    if (array.length === 0) return [];

    // Optimized min/max algorithm, single array pass. Comparisons are bigint-safe, unlike Math.min/max.
    let min: AgNumericValue = Infinity;
    let max: AgNumericValue = -Infinity;
    for (const val of array) {
        if (val < min) min = val;
        if (val > max) max = val;
    }
    return [min, max];
}

export function findRangeExtent(array: number[]) {
    const [min, max] = findMinMax(array);
    return max - min;
}

export function nextPowerOf2(value: number) {
    value = Math.trunc(value);
    if (value <= 0) return 1;
    if (value === 1) return 2;
    return 1 << (32 - Math.clz32(value - 1));
}

export function previousPowerOf2(value: number) {
    value = Math.trunc(value);
    if (value <= 0) return 0;
    if (value === 1) return 1;
    return 1 << (31 - Math.clz32(value));
}
