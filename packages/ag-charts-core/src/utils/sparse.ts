export interface SimpleArray<T> {
    [index: number]: T | undefined;
    readonly length: number;
    [Symbol.iterator](): Iterator<T>;

    push(...items: T[]): number;
    find<S extends T>(predicate: (value: T, index: number, obj: T[]) => value is S, thisArg?: any): S | undefined;
    find(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): T | undefined;
    indexOf(searchElement: T, fromIndex?: number): number;

    // Do not use, these methods exist for backward compatibility.
    // They normalise the sparse array (low performance).
    /** @deprecated */
    filter<S extends T>(predicate: (value: T, index: number, array: T[]) => value is S, thisArg?: any): SimpleArray<S>;
    filter(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): SimpleArray<T>;
    /** @deprecated */
    map<U>(callback: (value: T, index: number) => U): SimpleArray<U>;
    /** @deprecated */
    slice(start?: number, end?: number): SimpleArray<T>;
}

export interface SparseArray<T> extends SimpleArray<T> {
    readonly sparse: true; // type-branding to block implicit SimpleArray -> SparseArray conversion.
}

export function createSparseArray<T>(...data: SimpleArray<T>[]): SparseArray<T> {
    return new Proxy(new SparseArrayImpl<T>(...data), {
        get(target, prop, receiver) {
            if (typeof prop === 'string' && !isNaN(Number(prop))) {
                return target.get(Number(prop));
            }
            return Reflect.get(target, prop, receiver);
        },
    });
}

function* nestedSimpleArrayIter<T>(arrays: SimpleArray<SimpleArray<T>>): IterableIterator<T> {
    for (const array of arrays) {
        for (const element of array) {
            yield element;
        }
    }
}

class SparseArrayImpl<T> implements SparseArray<T> {
    private buckets: { start: number; end: number; elements: T[] }[] = [];
    private _length: number;
    readonly sparse = true;

    constructor(...data: SimpleArray<T>[]) {
        this._length = this.initializeBuckets(data);
    }

    get length(): number {
        return this._length;
    }

    private initializeBuckets(data: SimpleArray<SimpleArray<T>>): number {
        let length = 0;
        let currentStart: number | null = null;

        // First pass: Determine bucket start/end ranges and create bucket entries
        let i = 0;
        for (const elem of nestedSimpleArrayIter(data)) {
            if (elem !== undefined) {
                if (currentStart === null) {
                    currentStart = i;
                }
            } else if (currentStart !== null) {
                this.buckets.push({ start: currentStart, end: i - 1, elements: [] });
                currentStart = null;
            }
            i++;
        }
        if (currentStart !== null) {
            this.buckets.push({ start: currentStart, end: length - 1, elements: [] });
        }

        // Second pass: Allocate exact-sized arrays and populate elements
        const it = nestedSimpleArrayIter(data);
        for (const bucket of this.buckets) {
            bucket.elements = new Array<T>(bucket.end - bucket.start + 1);
            for (let i = bucket.start, j = 0; i <= bucket.end; i++, j++) {
                bucket.elements[j] = it.next().value();
            }
        }

        return length;
    }

    private findBucketIndex(index: number): number {
        let left = 0,
            right = this.buckets.length - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (index < this.buckets[mid].start) {
                right = mid - 1;
            } else if (index > this.buckets[mid].end) {
                left = mid + 1;
            } else {
                return mid;
            }
        }
        return NaN;
    }

    [index: number]: T | undefined;
    get(index: number): T | undefined {
        if (index < 0 || index >= this._length) return undefined;
        const bucketIndex = this.findBucketIndex(index);
        if (isNaN(bucketIndex)) return undefined;
        const bucket = this.buckets[bucketIndex];
        return bucket.elements[index - bucket.start];
    }

    *[Symbol.iterator](): IterableIterator<T> {
        for (const bucket of this.buckets) {
            for (let i = 0; i < bucket.elements.length; i++) {
                yield bucket.elements[i];
            }
        }
    }

    push(...items: T[]): number {
        if (this.buckets.length === 0) {
            this.buckets = [{ start: 0, end: 0, elements: [] }];
        }

        const lastBucket = this.buckets[this.buckets.length - 1];
        lastBucket.elements.push(...items);
        lastBucket.end += items.length;
        this._length += items.length;
        return this._length;
    }

    find<S extends T>(predicate: (value: T, index: number, obj: T[]) => value is S, thisArg?: any): S | undefined;
    find(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): T | undefined {
        for (const bucket of this.buckets) {
            const result = bucket.elements.find(predicate, thisArg);
            if (result) {
                return result;
            }
        }
        return undefined;
    }

    indexOf(searchElement: T, fromIndex?: number): number {
        fromIndex ??= 0;
        for (const bucket of this.buckets) {
            if (bucket.end < fromIndex) continue;
            let bucketFromIndex: number | undefined = fromIndex - bucket.start;
            if (bucketFromIndex < 0) bucketFromIndex = undefined;

            const result = bucket.elements.indexOf(searchElement, bucketFromIndex);
            if (result !== -1) {
                return result;
            }
        }
        return -1;
    }

    private normalArray() {
        return Array.from(this).filter((v) => v !== undefined) as T[];
    }

    /** @deprecated */
    filter<S extends T>(predicate: (value: T, index: number, array: T[]) => value is S, thisArg?: any): SimpleArray<S>;
    filter(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): SimpleArray<T> {
        return this.normalArray().filter(predicate, thisArg);
    }

    /** @deprecated */
    map<U>(callback: (value: T, index: number) => U): SimpleArray<U> {
        return this.normalArray().map(callback);
    }

    /** @deprecated */
    slice(start?: number, end?: number): SimpleArray<T> {
        return this.normalArray().slice(start, end);
    }
}
