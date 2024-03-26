export function extent(values: Array<number | Date>): [number, number] | undefined {
    if (values.length === 0) {
        return;
    }

    let min = Infinity;
    let max = -Infinity;

    for (let n of values) {
        if (n instanceof Date) {
            n = n.getTime();
        }
        if (typeof n !== 'number') {
            continue;
        }
        if (n < min) {
            min = n;
        }
        if (n > max) {
            max = n;
        }
    }
    const result = [min, max];
    if (result.every(isFinite)) {
        return result as [number, number];
    }
}

export function normalisedExtent(d: number[], min: number, max: number): number[] {
    return normalisedExtentWithMetadata(d, min, max).extent;
}

export function normalisedExtentWithMetadata(
    d: number[],
    min: number,
    max: number
): { extent: number[]; clipped: boolean } {
    let clipped = false;

    if (d.length > 2) {
        d = extent(d) ?? [NaN, NaN];
    }
    if (!isNaN(min)) {
        clipped ||= min > d[0];
        d = [min, d[1]];
    }
    if (!isNaN(max)) {
        clipped ||= max < d[1];
        d = [d[0], max];
    }
    if (d[0] > d[1]) {
        d = [];
    }
    return { extent: d, clipped };
}

export function arraysEqual(a: any[], b: any[]): boolean {
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

export function toArray<T>(value: T | T[] | undefined): T[] {
    if (typeof value === 'undefined') {
        return [];
    }
    return Array.isArray(value) ? value : [value];
}

export function unique<T>(array: T[]) {
    return Array.from(new Set(array));
}

export function groupBy<T, R extends string | number | symbol>(array: T[], iteratee: (item: T) => R) {
    return array.reduce<{ [K in R]?: T[] }>((result, item) => {
        const groupKey = iteratee(item);
        result[groupKey] ??= [];
        result[groupKey]!.push(item);
        return result;
    }, {});
}

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

export function bifurcate<T>(isLeft: (array: T) => boolean, array: T[]): [T[], T[]] {
    return array.reduce(
        ([left, right], value) => (isLeft(value) ? [[...left, value], right] : [left, [...right, value]]),
        [[] as T[], [] as T[]]
    );
}
