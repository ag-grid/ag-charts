const MIN = 0;
const MAX = 1;
const SPAN = 2;

export class RangeLookup {
    private maxLevelSize: number;
    private buffer: Float64Array;
    private dataLength: number;

    /** When true, the lookup needs to be rebuilt before use */
    isDirty = false;

    constructor(allValues: number[][]) {
        const dataLength = allValues.reduce((acc, v) => Math.max(acc, v.length), 0);
        const { maxLevelSize, buffer } = RangeLookup.createBuffer(dataLength);
        this.maxLevelSize = maxLevelSize;
        this.buffer = buffer;
        this.dataLength = dataLength;
        this.populateBuffer(allValues);
    }

    private static computeMaxLevelSize(dataLength: number): number {
        const sizePower = 32 - Math.clz32(dataLength);
        let maxLevelSize = 1 << sizePower;
        if (dataLength === maxLevelSize / 2) {
            maxLevelSize = maxLevelSize >>> 1;
        }
        return maxLevelSize;
    }

    private static createBuffer(dataLength: number): { maxLevelSize: number; buffer: Float64Array } {
        const maxLevelSize = RangeLookup.computeMaxLevelSize(dataLength);
        const buffer = new Float64Array((maxLevelSize * 2 - 1) * 2).fill(Number.NaN);
        return { maxLevelSize, buffer };
    }

    private populateBuffer(allValues: number[][]): void {
        // NOTE: This function has been optimized for performance over readability.
        // Key optimizations:
        // - Use bit shifts (<< 1, >>> 1) instead of Math.trunc(x * 2) / Math.trunc(x / 2)
        // - Use x === x for NaN check (NaN is the only value where x !== x)
        // - Pre-compute buffer offsets to minimize repeated calculations
        // - Cache min/max values in local variables to reduce array reads
        const { maxLevelSize, buffer } = this;
        const leafOffset = maxLevelSize - 1;

        // Phase 1: Populate leaf nodes from all value columns
        for (const values of allValues) {
            const valuesLength = values.length;
            for (let i = 0; i < valuesLength; i += 1) {
                const value = Number(values[i]);
                // Skip NaN values (NaN !== NaN)
                if (value !== value) continue;

                const bufferOffset = (leafOffset + i) << 1; // * SPAN
                const prevMin = buffer[bufferOffset];
                const prevMax = buffer[bufferOffset + 1];

                // NaN check: prevMin !== prevMin means prevMin is NaN
                if (prevMin !== prevMin || value < prevMin) {
                    buffer[bufferOffset] = value;
                }
                if (prevMax !== prevMax || value > prevMax) {
                    buffer[bufferOffset + 1] = value;
                }
            }
        }

        // Phase 2: Build internal nodes bottom-up
        // Each level halves in size; we compute parent from two children
        for (let size = maxLevelSize >>> 1; size >= 1; size >>>= 1) {
            const start = size - 1;
            const childStart = (start + size) << 1; // First child's buffer offset
            let nodeOffset = start << 1;
            let leftOffset = childStart;

            for (let i = 0; i < size; i += 1) {
                const rightOffset = leftOffset + 2; // SPAN

                const aMin = buffer[leftOffset];
                const bMin = buffer[rightOffset];
                // bMin !== bMin means bMin is NaN (right child empty)
                buffer[nodeOffset] = bMin !== bMin || aMin < bMin ? aMin : bMin;

                const aMax = buffer[leftOffset + 1];
                const bMax = buffer[rightOffset + 1];
                buffer[nodeOffset + 1] = bMax !== bMax || aMax > bMax ? aMax : bMax;

                nodeOffset += 2; // SPAN
                leftOffset += 4; // 2 * SPAN (skip left and right child)
            }
        }
    }

    /**
     * Rebuild the segment tree with new values, reusing the buffer if possible.
     * Only allocates a new buffer if the data length requires a different maxLevelSize.
     */
    rebuild(allValues: number[][]): void {
        const dataLength = allValues.reduce((acc, v) => Math.max(acc, v.length), 0);
        const requiredMaxLevelSize = RangeLookup.computeMaxLevelSize(dataLength);

        if (requiredMaxLevelSize === this.maxLevelSize) {
            this.buffer.fill(Number.NaN);
        } else {
            const { maxLevelSize, buffer } = RangeLookup.createBuffer(dataLength);
            this.maxLevelSize = maxLevelSize;
            this.buffer = buffer;
        }

        this.dataLength = dataLength;
        this.populateBuffer(allValues);
    }

    /**
     * Update values at a specific data index - O(k log n) where k is number of columns.
     * After updating the leaf, propagates changes up to the root.
     *
     * @param dataIndex - Index in the data array (0-based)
     * @param newValues - New values for this index from all columns
     */
    updateValue(dataIndex: number, newValues: number[]): void {
        const { maxLevelSize, buffer } = this;
        const bufferIndex = maxLevelSize + dataIndex - 1;
        const bufferMinIndex = Math.trunc(bufferIndex * SPAN) + MIN;
        const bufferMaxIndex = Math.trunc(bufferIndex * SPAN) + MAX;

        // Reset leaf to recalculate from new values
        buffer[bufferMinIndex] = Number.NaN;
        buffer[bufferMaxIndex] = Number.NaN;

        // Apply new values
        for (const value of newValues) {
            const numValue = Number(value);
            const prevMin = buffer[bufferMinIndex];
            const prevMax = buffer[bufferMaxIndex];
            if (!Number.isFinite(prevMin) || numValue < prevMin) {
                buffer[bufferMinIndex] = numValue;
            }
            if (!Number.isFinite(prevMax) || numValue > prevMax) {
                buffer[bufferMaxIndex] = numValue;
            }
        }

        // Propagate changes to parent nodes
        this.propagateUp(bufferIndex);
    }

    /**
     * Batch update multiple values - O(k log n) per update.
     * More efficient than individual updateValue calls when tracking dirty nodes.
     *
     * @param updates - Array of {index, values} pairs to update
     */
    updateValues(updates: Array<{ index: number; values: number[] }>): void {
        for (const { index, values } of updates) {
            this.updateValue(index, values);
        }
    }

    /**
     * Propagate min/max changes from a leaf up to the root.
     * Each level recalculates its min/max from its children.
     */
    private propagateUp(bufferIndex: number): void {
        const { buffer } = this;

        // Move up from leaf to root, updating parent nodes
        while (bufferIndex > 0) {
            // Calculate parent index: parent of node i is floor((i-1)/2)
            const parentIndex = Math.trunc((bufferIndex - 1) / 2);

            // Calculate children indices
            const leftChild = 2 * parentIndex + 1;
            const rightChild = 2 * parentIndex + 2;

            // Get children's min/max values
            const leftMin = buffer[Math.trunc(leftChild * SPAN) + MIN];
            const leftMax = buffer[Math.trunc(leftChild * SPAN) + MAX];
            const rightMin = buffer[Math.trunc(rightChild * SPAN) + MIN];
            const rightMax = buffer[Math.trunc(rightChild * SPAN) + MAX];

            // Update parent's min/max
            buffer[Math.trunc(parentIndex * SPAN) + MIN] =
                !Number.isFinite(rightMin) || leftMin < rightMin ? leftMin : rightMin;
            buffer[Math.trunc(parentIndex * SPAN) + MAX] =
                !Number.isFinite(rightMax) || leftMax > rightMax ? leftMax : rightMax;

            bufferIndex = parentIndex;
        }
    }

    private computeRangeInto(
        buffer: Float64Array,
        start: number,
        end: number,
        bufferIndex: number,
        currentStart: number,
        step: number,
        into: [number, number]
    ) {
        const currentEnd = currentStart + step - 1;

        if (currentEnd < start || currentStart >= end) return into;

        if (currentStart >= start && currentEnd < end) {
            const min = buffer[Math.trunc(bufferIndex * SPAN) + MIN];
            const max = buffer[Math.trunc(bufferIndex * SPAN) + MAX];
            if (Number.isFinite(min)) into[0] = Math.min(into[0], min);
            if (Number.isFinite(max)) into[1] = Math.max(into[1], max);
        } else if (step > 1) {
            bufferIndex = Math.trunc(bufferIndex * 2);
            step = Math.trunc(step / 2);
            this.computeRangeInto(buffer, start, end, Math.trunc(bufferIndex + 1), currentStart, step, into);
            this.computeRangeInto(buffer, start, end, Math.trunc(bufferIndex + 2), currentStart + step, step, into);
        }

        return into;
    }

    rangeBetween(start: number, end: number, into?: [number, number]): [number, number] {
        const result = into ?? ([0, 0] as [number, number]);
        if (start > end) {
            result[0] = Number.NaN;
            result[1] = Number.NaN;
            return result;
        }
        const { maxLevelSize, buffer } = this;
        result[0] = Infinity;
        result[1] = -Infinity;
        this.computeRangeInto(buffer, start, end, 0, 0, maxLevelSize, result);
        return result;
    }

    getRange(into?: [number, number]): [number, number] {
        const { buffer } = this;
        const result = into ?? ([0, 0] as [number, number]);
        result[0] = buffer[MIN];
        result[1] = buffer[MAX];
        return result;
    }

    get range(): [number, number] {
        const { buffer } = this;
        return [buffer[MIN], buffer[MAX]];
    }

    /** The number of data elements in the segment tree */
    get length(): number {
        return this.dataLength;
    }
}
