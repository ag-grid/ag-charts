/**
 * Yields items from multiple iterables in sequence. If a value is not iterable,
 * it is yielded directly.
 *
 * @param items - A list of iterable objects or values.
 * @returns A generator yielding all items from the input iterables, or the values themselves if not iterable.
 */
export function* iterate<T extends any[]>(
    ...items: T
): Generator<T[number] extends Iterable<infer U> ? U : T[number], void, undefined> {
    for (const item of items) {
        if (item == null) continue;
        if (item[Symbol.iterator]) {
            yield* item;
        } else {
            yield item;
        }
    }
}

/**
 * Converts a value into an iterable. If the value is not already iterable, it wraps it in an array.
 * @param value - The value to convert.
 * @returns An iterable representing the value.
 */
export function toIterable<T>(value: T | Iterable<T>): Iterable<T> {
    return value != null && typeof value === 'object' && Symbol.iterator in value ? value : [value];
}

/**
 * Returns the first value from an iterable sequence.
 * @param iterable source of values
 * @returns The first value, or throws an error is there is no first value.
 */
export function first<T>(iterable: Iterable<T>): T | never {
    for (const value of iterable) {
        return value;
    }
    throw new Error('AG Charts - no first() value found');
}

/**
 * Efficient key/value iterator. Note that the returned tuple is always the same array, only
 * elements change from one iteration to the next, so should only be used in destructing for
 * statements.
 *
 * NOTE: For performance sensitive code, prefer using `Object.keys()` directly, or consider
 * using a `Map` instead.
 *
 * @param obj to iterate over
 * @returns An iterator for all key/value tuples of obj
 */
export function* entries<T extends object>(obj: T): Iterable<[keyof T, T[keyof T]]> {
    const resultTuple: [keyof T, T[keyof T]] = [undefined!, undefined!];
    for (const key of Object.keys(obj)) {
        resultTuple[0] = key as keyof T;
        resultTuple[1] = obj[key as keyof T];
        yield resultTuple;
    }
}
