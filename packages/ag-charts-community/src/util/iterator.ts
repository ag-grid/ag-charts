export function toIterable<T>(value: T | Iterable<T>): Iterable<T> {
    if (typeof value !== 'object' || value == null || !(Symbol.iterator in value)) {
        return argsIterable(value);
    }
    return value;
}

export function* arraysIterable<T, A extends Array<Array<T>>>(...arrays: A): Iterable<A[number][number]> {
    for (const array of arrays) {
        for (const e of array) {
            yield e;
        }
    }
}

export function* argsIterable<T, A extends Array<T>>(...args: A[number][]): Iterable<T> {
    for (const arg of args) {
        yield arg;
    }
}
