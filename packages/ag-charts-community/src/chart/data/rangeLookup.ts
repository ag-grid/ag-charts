const MIN = 0;
const MAX = 1;
const SPAN = 2;

export class RangeLookup {
    private readonly maxLevelSize: number;
    private readonly buffer: Float64Array;
    private readonly dataLength: number;

    constructor(allValues: number[][]) {
        const dataLength = allValues.reduce((acc, v) => Math.max(acc, v.length), 0);
        const sizePower = 32 - Math.clz32(dataLength);
        let maxLevelSize = 1 << sizePower;
        if (dataLength === maxLevelSize / 2) {
            maxLevelSize = maxLevelSize >>> 1;
        }
        this.maxLevelSize = maxLevelSize;

        const buffer = new Float64Array((maxLevelSize * 2 - 1) * 2).fill(Number.NaN);

        for (const values of allValues) {
            for (let i = 0; i < values.length; i += 1) {
                const value = Number(values[i]);
                const bufferIndex = maxLevelSize + i - 1;
                const bufferMinIndex = Math.trunc(bufferIndex * SPAN) + MIN;
                const bufferMaxIndex = Math.trunc(bufferIndex * SPAN) + MAX;
                const prevMinValue = buffer[bufferMinIndex];
                const prevMaxValue = buffer[bufferMaxIndex];
                if (!Number.isFinite(prevMinValue) || value < prevMinValue) {
                    buffer[bufferMinIndex] = value;
                }
                if (!Number.isFinite(prevMaxValue) || value > prevMaxValue) {
                    buffer[bufferMaxIndex] = value;
                }
            }
        }

        for (let size = Math.trunc(maxLevelSize / 2); size >= 1; size = Math.trunc(size / 2)) {
            const start = Math.trunc(size - 1);
            const end = Math.trunc(start + size);
            for (let i = 0; i < size; i += 1) {
                const nodeIndex = start + i;
                const leftIndex = end + i * 2;
                const rightIndex = leftIndex + 1;

                const aMin = buffer[Math.trunc(leftIndex * SPAN) + MIN];
                const bMin = buffer[Math.trunc(rightIndex * SPAN) + MIN];
                buffer[Math.trunc(nodeIndex * SPAN) + MIN] = !Number.isFinite(bMin) || aMin < bMin ? aMin : bMin;

                const aMax = buffer[Math.trunc(leftIndex * SPAN) + MAX];
                const bMax = buffer[Math.trunc(rightIndex * SPAN) + MAX];
                buffer[Math.trunc(nodeIndex * SPAN) + MAX] = !Number.isFinite(bMax) || aMax > bMax ? aMax : bMax;
            }
        }

        this.buffer = buffer;
        this.dataLength = dataLength;
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

    rangeBetween(start: number, end: number): [number, number] {
        if (start > end) return [Number.NaN, Number.NaN];
        const { maxLevelSize, buffer } = this;
        const range: [number, number] = [Infinity, -Infinity];
        this.computeRangeInto(buffer, start, end, 0, 0, maxLevelSize, range);
        return range;
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
