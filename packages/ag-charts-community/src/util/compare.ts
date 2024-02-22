type Comparator<T> = (a: T, b: T) => number;
export type LiteralOrFn<T> = T | (() => T);

export function ascendingStringNumberUndefined(
    a: number | string | undefined | null,
    b: number | string | undefined | null
): number {
    if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
    } else if (typeof a === 'string' && typeof b === 'string') {
        return a.localeCompare(b);
    } else if (a == null && b == null) {
        return 0;
    } else if (a == null) {
        return -1;
    } else if (b == null) {
        return 1;
    }
    return String(a).localeCompare(String(b));
}

function toLiteral<T, F extends LiteralOrFn<T>>(v: F) {
    return typeof v === 'function' ? v() : v;
}

export function compoundAscending<E>(a: LiteralOrFn<E>[], b: LiteralOrFn<E>[], comparator: Comparator<E>): number {
    for (const idx in a) {
        const diff = comparator(toLiteral(a[idx]), toLiteral(b[idx]));
        if (diff !== 0) {
            return diff;
        }
    }
    return 0;
}
