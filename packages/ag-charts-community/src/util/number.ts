import { clamp } from 'ag-charts-core';

export function clampArray(value: number, array: number[]) {
    const [min, max] = findMinMax(array);
    return clamp(min, value, max);
}

export function findMinMax(array: number[]) {
    if (array.length === 0) return [];

    // Optimized min/max algorithm, single array pass.
    const result = [Infinity, -Infinity];
    for (const val of array) {
        if (val < result[0]) result[0] = val;
        if (val > result[1]) result[1] = val;
    }
    return result;
}

export function findRangeExtent(array: number[]) {
    const [min, max] = findMinMax(array);
    return max - min;
}
