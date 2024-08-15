export function* iterate<T extends Iterable<any>[]>(
    ...iterators: T
): Generator<T[number] extends Iterable<infer U> ? U : never, void, undefined> {
    for (const iterator of iterators) {
        yield* iterator;
    }
}

export function toIterable<T>(value: T | Iterable<T>): Iterable<T> {
    return value != null && typeof value === 'object' && Symbol.iterator in value ? value : [value];
}
