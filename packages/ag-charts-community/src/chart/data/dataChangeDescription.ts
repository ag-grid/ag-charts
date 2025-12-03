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

    /** Set of updated final indices (indices in the final array that have updated items) */
    updatedIndices: Set<number>;

    /** Total number of prepended items */
    totalPrependCount: number;

    /** Total number of appended items */
    totalAppendCount: number;
}

/**
 * Helper functions to compute derived properties from IndexTransformationMap.
 * These avoid storing redundant computed values and enable optimization checks.
 */

/**
 * Check if the change is append-only (no prepends, no removals).
 *
 * **Optimization:** Append-only operations don't shift existing indices,
 * so preserved items don't need to be marked as "moved".
 *
 * @param indexMap - The index transformation map to check
 * @returns True if only appends occurred
 *
 * @example
 * ```typescript
 * if (isAppendOnly(changeDesc.indexMap)) {
 *     // Skip tracking moved items - nothing moved
 * }
 * ```
 */
export function isAppendOnly(indexMap: IndexTransformationMap): boolean {
    return indexMap.removedIndices.size === 0 && indexMap.totalPrependCount === 0 && indexMap.totalAppendCount > 0;
}

/**
 * Check if the change is prepend-only (no appends, no removals).
 *
 * **Optimization:** Prepend-only operations shift ALL existing items by a fixed offset,
 * so we can bulk-mark them as moved without iteration.
 *
 * @param indexMap - The index transformation map to check
 * @returns True if only prepends occurred
 *
 * @example
 * ```typescript
 * if (isPrependOnly(changeDesc.indexMap)) {
 *     // All items shifted by totalPrependCount
 *     markAllAsMoved(changeDesc.indexMap.totalPrependCount);
 * }
 * ```
 */
export function isPrependOnly(indexMap: IndexTransformationMap): boolean {
    return indexMap.removedIndices.size === 0 && indexMap.totalAppendCount === 0 && indexMap.totalPrependCount > 0;
}

/**
 * Check if no items were removed (may have prepends/appends).
 *
 * **Optimization:** When no removals occurred, items are either:
 * - In their original positions (if no prepends)
 * - Shifted by a fixed offset (if prepends occurred)
 *
 * @param indexMap - The index transformation map to check
 * @returns True if no removals occurred
 *
 * @example
 * ```typescript
 * if (hasNoRemovals(changeDesc.indexMap) && indexMap.totalPrependCount > 0) {
 *     // All original items shifted by prepend count
 * }
 * ```
 */
export function hasNoRemovals(indexMap: IndexTransformationMap): boolean {
    return indexMap.removedIndices.size === 0;
}

/** Check if only in-place updates occurred (no adds/removes). */
export function isUpdateOnly(indexMap: IndexTransformationMap): boolean {
    return (
        indexMap.removedIndices.size === 0 &&
        indexMap.totalPrependCount === 0 &&
        indexMap.totalAppendCount === 0 &&
        indexMap.spliceOps.every((op) => op.insertCount === 0 && op.deleteCount === 0)
    );
}

/**
 * Check if only removals occurred (no prepends, appends, or other insertions).
 *
 * **Optimization:** Removal-only operations preserve sort order and uniqueness:
 * - Removing values can't create duplicates (only reduce them)
 * - Removing values can't change ascending to descending order
 * - KEY_SORT_ORDERS metadata can be preserved
 */
export function hasOnlyRemovals(indexMap: IndexTransformationMap): boolean {
    return (
        indexMap.removedIndices.size > 0 &&
        indexMap.totalPrependCount === 0 &&
        indexMap.totalAppendCount === 0 &&
        indexMap.spliceOps.every((op) => op.insertCount === 0)
    );
}

/** Check if all removals are contiguous starting at index 0. */
export function hasContiguousRemovalsAtStart(indexMap: IndexTransformationMap): boolean {
    const { removedIndices } = indexMap;
    if (removedIndices.size === 0) return false;

    const sorted = Array.from(removedIndices).sort((a, b) => a - b);
    if (sorted[0] !== 0) return false;

    for (let i = 0; i < sorted.length; i++) {
        if (sorted[i] !== i) return false;
    }
    return true;
}

/** Check for rolling window pattern: contiguous removals at start + appends at end. */
export function isRollingWindow(indexMap: IndexTransformationMap): boolean {
    return hasContiguousRemovalsAtStart(indexMap) && indexMap.totalAppendCount > 0 && indexMap.totalPrependCount === 0;
}

/**
 * Abstract description of changes to be applied to source data.
 * Provides precise index mapping for optimized incremental updates.
 *
 * **Responsibilities:**
 * - Describes what changed (splice operations, index mappings, prepend/append counts)
 * - Provides transformation methods for applying changes to arrays
 * - Enables iteration over preserved/moved elements
 *
 * **Usage Pattern:**
 * 1. DataSet builds DataChangeDescription from pending transactions
 * 2. DataController passes it to DataModel for incremental updates
 * 3. DataModel uses methods below to transform keys, columns, and invalidity arrays
 *
 * **Design Note:**
 * This class intentionally separates "change description" from "transaction management" (DataSet)
 * and "data processing" (DataModel). This enables:
 * - Multiple consumers (DataController, DataModel)
 * - Independent testing
 * - Clear separation of concerns
 */
export class DataChangeDescription {
    /**
     * Map from original to final indices.
     *
     * Contains splice operations, removed indices, and counts needed for transformations.
     * Access directly for low-level operations (e.g., updating banded domains).
     */
    public readonly indexMap: IndexTransformationMap;
    private readonly prependValues: unknown[];
    private readonly appendValues: unknown[];
    private readonly insertionValues: unknown[];

    constructor(
        indexMap: IndexTransformationMap,
        insertions: { prependValues: unknown[]; appendValues: unknown[]; insertionValues: unknown[] }
    ) {
        this.indexMap = indexMap;
        this.prependValues = insertions.prependValues;
        this.appendValues = insertions.appendValues;
        this.insertionValues = insertions.insertionValues;
    }

    /**
     * Get all indices that were removed from the original array, sorted ascending.
     *
     * @returns Array of removed indices (e.g., [2, 5, 8])
     *
     * @example
     * ```typescript
     * const removed = changeDesc.getRemovedIndices();
     * console.log(`Removed ${removed.length} items at indices: ${removed}`);
     * ```
     */
    getRemovedIndices(): number[] {
        return Array.from(this.indexMap.removedIndices).sort((a, b) => a - b);
    }

    /**
     * Get all indices that were updated in the final array, sorted ascending.
     *
     * @returns Array of updated indices (e.g., [1, 3, 7])
     *
     * @example
     * ```typescript
     * const updated = changeDesc.getUpdatedIndices();
     * console.log(`Updated ${updated.length} items at indices: ${updated}`);
     * ```
     */
    getUpdatedIndices(): number[] {
        return Array.from(this.indexMap.updatedIndices).sort((a, b) => a - b);
    }

    /**
     * Iterate over preserved elements, mapping source index to destination index.
     * Only calls callback for elements that were NOT removed.
     *
     * **Use this for:**
     * - Tracking which elements moved (when sourceIndex !== destIndex)
     * - Generating diff metadata (added/removed/moved items)
     * - Understanding index shifts caused by prepends/removes
     *
     * @param callback - Called for each preserved element with (sourceIndex, destIndex)
     *
     * @example Detecting moved items
     * ```typescript
     * const movedItems = new Set<number>();
     * changeDesc.forEachPreservedIndex((srcIdx, destIdx) => {
     *     if (srcIdx !== destIdx) {
     *         movedItems.add(destIdx);
     *     }
     * });
     * ```
     */
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

    /**
     * Get the values that were prepended to the beginning of the array.
     *
     * These values are stored during change description construction and can be used
     * to avoid reprocessing prepended data.
     *
     * @returns Array of prepended values in order
     *
     * @example Processing prepended data
     * ```typescript
     * const prependedData = changeDesc.getPrependedValues<DataRow>();
     * for (const row of prependedData) {
     *     processRow(row);
     * }
     * ```
     */
    getPrependedValues<T = unknown>(): T[] {
        return this.prependValues as T[];
    }

    /**
     * Get the values that were appended to the end of the array.
     *
     * These values are stored during change description construction and can be used
     * to avoid reprocessing appended data.
     *
     * @returns Array of appended values in order
     *
     * @example Processing appended data
     * ```typescript
     * const appendedData = changeDesc.getAppendedValues<DataRow>();
     * for (const row of appendedData) {
     *     processRow(row);
     * }
     * ```
     */
    getAppendedValues<T = unknown>(): T[] {
        return this.appendValues as T[];
    }

    /**
     * Get the values that were inserted at arbitrary indices.
     *
     * These values are stored during change description construction and can be used
     * to avoid reprocessing inserted data.
     *
     * @returns Array of insertion values in the order they appear in splice operations
     *
     * @example Processing inserted data
     * ```typescript
     * const insertedData = changeDesc.getInsertionValues<DataRow>();
     * for (const row of insertedData) {
     *     processRow(row);
     * }
     * ```
     */
    getInsertionValues<T = unknown>(): T[] {
        return this.insertionValues as T[];
    }

    /**
     * Applies the transformation to an array in-place using native Array operations.
     * This is a zero-copy operation that mutates the array directly.
     *
     * **Use this for:**
     * - Transforming processed data arrays (keys, columns, invalidity)
     * - Applying prepends, removals, and appends in a single pass
     * - Maintaining synchronization between data and processed arrays
     *
     * **How it works:**
     * 1. Applies splice operations in order (prepends, removals, appends)
     * 2. Calls processInsertion callback for each inserted element
     * 3. Mutates the array in-place for zero-copy efficiency
     *
     * @param array - The array to transform in-place (will be mutated)
     * @param processInsertion - Callback to generate values for inserted indices
     *
     * @example Transforming a column array
     * ```typescript
     * // Transform processed column to match new data layout
     * const insertionCache = new Map(); // Pre-computed processed values
     * changeDesc.applyToArray(columnArray, (destIndex) => {
     *     return insertionCache.get(destIndex) ?? defaultValue;
     * });
     * ```
     *
     * @example Transforming an invalidity array
     * ```typescript
     * // Transform invalidity flags to match new data
     * changeDesc.applyToArray(invalidityArray, (destIndex) => {
     *     const cached = insertionCache.get(destIndex);
     *     return cached?.hasInvalidKey ?? false;
     * });
     * ```
     */
    applyToArray<T>(
        array: T[],
        processInsertion: (destIndex: number) => T,
        onRemove?: (removed: T[], op: SpliceOperation) => void
    ): void {
        const { spliceOps, finalLength, originalLength } = this.indexMap;

        // Early exit if no changes
        if (originalLength === finalLength && spliceOps.length === 0) {
            return;
        }

        // Apply splice operations in the order they appear. Operations are generated to
        // mirror the transaction sequencing (prepends, removals, then appends).
        for (const op of spliceOps) {
            // Generate insertion elements if needed
            const insertElements =
                op.insertCount > 0
                    ? Array.from({ length: op.insertCount }, function processOpInsertion(_, j: number) {
                          return processInsertion(op.index + j);
                      })
                    : [];

            // Apply the splice operation (handles insert, delete, or both)
            const removed = array.splice(op.index, op.deleteCount, ...insertElements);
            if (onRemove && removed.length > 0) {
                onRemove(removed, op);
            }
        }

        // Ensure final length is correct (should already be from splice operations)
        if (array.length !== finalLength) {
            array.length = finalLength;
        }
    }
}
