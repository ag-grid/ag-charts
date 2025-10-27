import { clamp } from './numbers';

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
