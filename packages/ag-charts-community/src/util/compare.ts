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
