/**
 * Converts a value to an array. If the value is already an array, it is returned as-is.
 * @param value - The value to convert.
 * @returns The resulting array.
 */
export function toArray<T>(value: T | T[] | undefined): T[] {
    if (value === undefined) {
        return [];
    }
    return Array.isArray(value) ? value : [value];
}

/**
 * Removes duplicate values from an array.
 * @param array - The array to process.
 * @returns A new array with unique values.
 */
export function unique<T>(array: T[]): T[] {
    return Array.from(new Set(array));
}

/**
 * Groups items in an array by a key generated from the `iteratee` function.
 * @param array - The array to group.
 * @param iteratee - A function that generates the key for each item.
 * @returns An object where the keys are the group keys and the values are arrays of grouped items.
 */
export function groupBy<T, R extends string | number | symbol>(array: T[], iteratee: (item: T) => R) {
    return array.reduce<{ [K in R]?: T[] }>((result, item) => {
        const groupKey = iteratee(item);
        result[groupKey] ??= [];
        result[groupKey]!.push(item);
        return result;
    }, {});
}

/**
 * Compares two arrays for deep equality, including nested arrays.
 * @param a - The first array.
 * @param b - The second array.
 * @returns `true` if the arrays are equal, otherwise `false`.
 */
export function arraysEqual(a: readonly any[], b: readonly any[]): boolean {
    if (a == null || b == null || a.length !== b.length) {
        return false;
    }

    for (let i = 0; i < a.length; i++) {
        if (Array.isArray(a[i]) && Array.isArray(b[i])) {
            if (!arraysEqual(a[i], b[i])) {
                return false;
            }
        } else if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}

/**
 * Creates a circular slice of an array.
 * @param data - The source array.
 * @param size - The size of the slice.
 * @param offset - The starting index for the slice (default is 0).
 * @returns A circular slice of the array.
 */
export function circularSliceArray<T>(data: T[], size: number, offset = 0): T[] {
    if (data.length === 0) {
        return [];
    }
    const result: T[] = [];
    for (let i = 0; i < size; i++) {
        result.push(data.at((i + offset) % data.length)!);
    }
    return result;
}

/**
 * Sorts a base array according to the order defined in a reference array.
 * @param baseArray - The array to sort.
 * @param orderArray - The array defining the desired order.
 * @returns The sorted array.
 */
export function sortBasedOnArray<T>(baseArray: T[], orderArray: T[]): T[] {
    const orderMap = new Map<T, number>();

    // Create a map from the `orderArray` array for quick lookups
    for (const [index, item] of orderArray.entries()) {
        orderMap.set(item, index);
    }

    // Sort the `baseArray` array based on the indices in the `orderMap`
    return baseArray.sort((a, b) => {
        const indexA = orderMap.get(a) ?? Infinity;
        const indexB = orderMap.get(b) ?? Infinity;
        return indexA - indexB;
    });
}

export function dropFirstWhile<T>(array: T[], cond: (value: T) => boolean) {
    let i = 0;
    while (i < array.length && cond(array[i])) {
        i += 1;
    }

    const deleteCount = i;
    if (deleteCount !== 0) array.splice(0, deleteCount);
}

export function dropLastWhile<T>(array: T[], cond: (value: T) => boolean) {
    let i = array.length - 1;
    while (i >= 0 && cond(array[i])) {
        i -= 1;
    }

    const deleteCount = array.length - 1 - i;
    if (deleteCount !== 0) array.splice(array.length - deleteCount, deleteCount);
}

/**
 * Creates an even distribution of numbers between `min` and `max`.
 */
export function distribute(min: number, max: number, maxCount: number) {
    const values = [min];
    const step = Math.round((max - min) / (maxCount - 1));
    if (step > 0) {
        for (let i = min + step; i < max; i += step) {
            const length = values.push(i);
            if (length >= maxCount - 1) break;
        }
    }
    values.push(max);
    return values;
}
