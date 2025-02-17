export interface SparseArray<T> {
    get (index: number): T | undefined;
    readonly length: number;
};

export class ImmutableSparseArrayImpl<T> implements SparseArray<T> {
    private buckets: { start: number; end: number; elements: T[] }[] = [];
    private _length: number;

    constructor(data: (T | undefined)[]) {
        this._length = data.length;
        this.initializeBuckets(data);
    }

    get length(): number {
        return this._length;
    }

    private initializeBuckets(data: (T | undefined)[]): void {
        let currentStart: number | null = null;

        // First pass: Determine bucket start/end ranges and create bucket entries
        for (let i = 0; i < data.length; i++) {
            if (data[i] !== undefined) {
                if (currentStart === null) {
                    currentStart = i;
                }
            } else if (currentStart !== null) {
                this.buckets.push({ start: currentStart, end: i - 1, elements: [] });
                currentStart = null;
            }
        }
        if (currentStart !== null) {
            this.buckets.push({ start: currentStart, end: data.length - 1, elements: [] });
        }

        // Second pass: Allocate exact-sized arrays and populate elements
        for (const bucket of this.buckets) {
            bucket.elements = new Array<T>(bucket.end - bucket.start + 1);
            for (let i = bucket.start, j = 0; i <= bucket.end; i++, j++) {
                bucket.elements[j] = data[i]!;
            }
        }
    }

    private findBucketIndex(index: number): number {
        let left = 0, right = this.buckets.length - 1;
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
        return -1;
    }

    get(index: number): T | undefined {
        if (index < 0 || index >= this._length) return undefined;
        const bucketIndex = this.findBucketIndex(index);
        if (bucketIndex === -1) return undefined;
        const bucket = this.buckets[bucketIndex];
        return bucket.elements[index - bucket.start];
    }
}
