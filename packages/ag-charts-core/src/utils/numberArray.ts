import { clamp } from './numbers';

export function clampArray(value: number, array: number[]): number {
    const [min, max] = findMinMax(array);
    return clamp(min, value, max);
}

export function findMinMax(array: number[]): [number, number] {
    if (array.length === 0) return [] as unknown as [number, number];

    let min = Infinity;
    let max = -Infinity;

    for (const val of array) {
        if (val < min) min = val;
        if (val > max) max = val;
    }
    return [min, max];
}

export function findRangeExtent(array: number[]): number {
    const [min, max] = findMinMax(array);
    return max - min;
}

export function nextPowerOf2(value: number): number {
    value = Math.trunc(value);
    if (value <= 0) return 1;
    if (value === 1) return 2;
    return 1 << (32 - Math.clz32(value - 1));
}

export function previousPowerOf2(value: number): number {
    value = Math.trunc(value);
    if (value <= 0) return 0;
    if (value === 1) return 1;
    return 1 << (31 - Math.clz32(value));
}
