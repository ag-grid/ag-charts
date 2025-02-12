/**
 * Yields items from multiple iterables in sequence.
 * @param iterators - The iterables to iterate over.
 * @returns A generator yielding items from all provided iterables.
 */
export function* iterate<T extends Iterable<any>[]>(
    ...iterators: T
): Generator<T[number] extends Iterable<infer U> ? U : never, void, undefined> {
    for (const iterator of iterators) {
        yield* iterator;
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
 * elements change from one iteration to the next.
 *
 * @param obj to iterate over
 * @returns An iterator for all key/value tuples of obj
 */
export function* entries<T extends object>(obj: T): Iterable<[keyof T, T[keyof T]]> {
    const resultTuple: [keyof T, T[keyof T]] = [undefined!, undefined!];
    for (const key in obj) {
        resultTuple[0] = key;
        resultTuple[1] = obj[key];
        yield resultTuple;
    }
}
