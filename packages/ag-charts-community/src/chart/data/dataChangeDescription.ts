/**
 * Represents a splice operation to be applied to an array.
 * Designed for direct use with Array.splice() for efficient mutations.
 */
export interface SpliceOperation {
    /** Index at which to start the splice (in current array state) */
    index: number;
    /** Number of elements to delete from this position */
    deleteCount: number;
    /** Number of new elements to insert at this position */
    insertCount: number;
    /** Optional source indices for preserved elements (for tracking) */
    sourceIndices?: number[];
}

/**
 * Tracks transformations from original array indices to final array indices.
 * Optimized for efficient array mutations using splice operations.
 */
export interface IndexTransformationMap {
    /** Original array length before any transactions */
    originalLength: number;

    /** Final array length after all transactions */
    finalLength: number;

    /**
     * Splice operations to transform the array.
     * Applied from back to front to avoid index shifting issues.
     * Each operation represents a single splice call.
     */
    spliceOps: SpliceOperation[];

    /** Set of removed original indices */
    removedIndices: Set<number>;

    /** Total number of prepended items */
    totalPrependCount: number;

    /** Total number of appended items */
    totalAppendCount: number;

    /** True if this is an append-only transaction (no prepends, no removals) */
    isAppendOnly: boolean;

    /** True if this is a prepend-only transaction (no appends, no removals) */
    isPrependOnly: boolean;

    /** True if no items were removed (but may have prepends/appends) */
    hasNoRemovals: boolean;
}

/**
 * Abstract description of changes to be applied to source data.
 * Provides precise index mapping for optimized incremental updates.
 */
export class DataChangeDescription {
    /** Map from original to final indices */
    public readonly indexMap: IndexTransformationMap;
    private readonly prependValues: unknown[];
    private readonly appendValues: unknown[];

    constructor(indexMap: IndexTransformationMap, insertions: { prependValues: unknown[]; appendValues: unknown[] }) {
        this.indexMap = indexMap;
        this.prependValues = insertions.prependValues;
        this.appendValues = insertions.appendValues;
    }

    /** Get all indices that were removed from the original array */
    getRemovedIndices(): number[] {
        return Array.from(this.indexMap.removedIndices).sort((a, b) => a - b);
    }

    /** Iterate over preserved index mappings */
    forEachPreservedIndex(callback: (sourceIndex: number, destIndex: number) => void): void {
        // Lazily calculate preserved index mappings on-demand
        // Preserved indices are those not in removedIndices set
        // Their destination is: original position + totalPrependCount - (number of removals before them)
        const { originalLength, removedIndices, totalPrependCount } = this.indexMap;

        let removalsBeforeCount = 0;
        const sortedRemovals = Array.from(removedIndices).sort((a, b) => a - b);
        let removalIdx = 0;

        for (let srcIdx = 0; srcIdx < originalLength; srcIdx++) {
            // Update count of removals before current index
            while (removalIdx < sortedRemovals.length && sortedRemovals[removalIdx] < srcIdx) {
                removalsBeforeCount++;
                removalIdx++;
            }

            // If this index is not removed, calculate its destination
            if (!removedIndices.has(srcIdx)) {
                const destIdx = srcIdx + totalPrependCount - removalsBeforeCount;
                callback(srcIdx, destIdx);
            }
        }
    }

    getPrependedValues<T = unknown>(): T[] {
        return this.prependValues as T[];
    }

    getAppendedValues<T = unknown>(): T[] {
        return this.appendValues as T[];
    }

    /**
     * Applies the transformation to an array in-place using native Array operations.
     * This is a zero-copy operation that mutates the array directly.
     *
     * @param array - The array to transform in-place
     * @param processInsertion - Callback to generate values for inserted indices
     */
    applyToArray<T>(array: T[], processInsertion: (destIndex: number) => T): void {
        const { spliceOps, finalLength, originalLength } = this.indexMap;

        // Early exit if no changes
        if (originalLength === finalLength && spliceOps.length === 0) {
            return;
        }

        // Apply splice operations in the order they appear. Operations are generated to
        // mirror the transaction sequencing (prepends, removals, then appends).
        for (const op of spliceOps) {
            if (op.insertCount > 0 && op.deleteCount > 0) {
                // Replace operation (remove and insert in one go)
                const insertElements = new Array<T>(op.insertCount);
                for (let j = 0; j < op.insertCount; j++) {
                    insertElements[j] = processInsertion(op.index + j);
                }
                array.splice(op.index, op.deleteCount, ...insertElements);
            } else if (op.insertCount > 0) {
                // Pure insertion (prepend or append)
                const insertElements = new Array<T>(op.insertCount);
                for (let j = 0; j < op.insertCount; j++) {
                    insertElements[j] = processInsertion(op.index + j);
                }
                array.splice(op.index, 0, ...insertElements);
            } else if (op.deleteCount > 0) {
                // Pure removal
                array.splice(op.index, op.deleteCount);
            }
        }

        // Ensure final length is correct (should already be from splice operations)
        if (array.length !== finalLength) {
            array.length = finalLength;
        }
    }
}
