import type { AgDataTransaction } from 'ag-charts-types';

import { Debug } from '../../util/debug';
import { DataChangeDescription, type IndexTransformationMap, type SpliceOperation } from './dataChangeDescription';
import { findIndicesInOriginalArray, normaliseRemoveReferences } from './transactionUtils';

// Re-export types for backward compatibility
export { DataChangeDescription, type IndexTransformationMap, type SpliceOperation } from './dataChangeDescription';

type DataTransaction<T> = AgDataTransaction<T>;

const debug = Debug.create(true, 'data-set');

/**
 * Encapsulates chart data with support for transactional updates.
 *
 * DataSet wraps a raw data array and manages pending transactions (append, prepend, remove operations)
 * that can be committed incrementally for high-performance data updates.
 *
 * @example
 * ```typescript
 * // Create a DataSet from raw data
 * const dataSet = new DataSet([{ x: 1, y: 2 }, { x: 2, y: 4 }]);
 *
 * // Apply transactions
 * dataSet.addTransaction({ append: [{ x: 3, y: 6 }] });
 * dataSet.commitPendingTransactions();
 * ```
 */
export class DataSet<T = unknown> {
    public readonly data: T[];
    private readonly pendingTransactions: DataTransaction<T>[];

    private cachedChangeDescription?: DataChangeDescription;

    constructor(data: T[], pendingTransactions: DataTransaction<T>[] = []) {
        this.data = data;
        this.pendingTransactions = pendingTransactions;
    }

    /**
     * Adds a new transaction to the pending queue.
     * Automatically invalidates the change description cache.
     */
    addTransaction(transaction: DataTransaction<T>): void {
        this.pendingTransactions.push(transaction);
        this.cachedChangeDescription = undefined;
    }

    /**
     * Wraps raw data array in a DataSet, or returns undefined if data is null/undefined.
     */
    static wrap<T>(data?: T[]): DataSet<T> | undefined {
        if (data == null) return undefined;
        return new DataSet<T>(data);
    }

    /**
     * Creates an empty DataSet with no data.
     */
    static empty<T = unknown>(): DataSet<T> {
        return new DataSet<T>([]);
    }

    /**
     * Type guard to check if a value is a DataSet instance.
     */
    static isDataSet(value: unknown): value is DataSet<any> {
        return value instanceof DataSet;
    }

    /**
     * Returns the net size of the data after applying all pending transactions.
     * This calculates the final data length without mutating the underlying array.
     *
     * Note: This assumes transactions don't have duplicate updates in a single transaction
     * (e.g. removing or adding the same item multiple times).
     */
    netSize(): number {
        if (!this.hasPendingTransactions()) {
            return this.data.length;
        }

        let netLength = this.data.length;

        for (const transaction of this.pendingTransactions) {
            const removeRefs = normaliseRemoveReferences(transaction.remove);
            netLength -= removeRefs.length;

            if (Array.isArray(transaction.prepend)) {
                netLength += transaction.prepend.length;
            }
            if (Array.isArray(transaction.append)) {
                netLength += transaction.append.length;
            }
        }

        return Math.max(0, netLength);
    }

    /**
     * Checks if there are any pending transactions waiting to be committed.
     */
    hasPendingTransactions(): boolean {
        return this.pendingTransactions.length > 0;
    }

    /**
     * Commits all pending transactions by applying them to the underlying data array in-place.
     * This mutates the data array and clears the pending transactions queue.
     *
     * Uses the optimized applyToArray() method for efficient bulk transformations.
     */
    commitPendingTransactions(): void {
        if (!this.hasPendingTransactions()) {
            return;
        }

        const changeDesc = this.getChangeDescription();
        if (!changeDesc) {
            return;
        }

        const { finalLength, totalPrependCount, totalAppendCount } = changeDesc.indexMap;

        if (debug.check()) {
            debug('DataSet.commitPendingTransactions() - starting', {
                beforeLength: this.data.length,
                finalLength,
            });
        }

        // Collect all prepend and append items from all transactions
        let prependItems: T[] = [];
        let appendItems: T[] = [];

        for (const transaction of this.pendingTransactions) {
            if (Array.isArray(transaction.prepend) && transaction.prepend.length > 0) {
                prependItems = prependItems.concat(transaction.prepend);
            }
            if (Array.isArray(transaction.append) && transaction.append.length > 0) {
                appendItems = appendItems.concat(transaction.append);
            }
        }

        // Apply all transactions using the efficient applyToArray method
        changeDesc.applyToArray(this.data, (destIndex) => {
            // Determine which source array this insertion comes from based on index position
            if (destIndex < totalPrependCount) {
                // This is a prepended item
                return prependItems[destIndex];
            } else {
                // This is an appended item
                const appendOffset = destIndex - (finalLength - totalAppendCount);
                return appendItems[appendOffset];
            }
        });

        this.pendingTransactions.length = 0;

        if (debug.check()) {
            debug('DataSet.commitPendingTransactions() - final length', { afterLength: this.data.length });
        }
    }

    merge(data: T[]): DataSet<T> {
        return this.data === data ? this : new DataSet<T>(data);
    }

    /**
     * Returns an abstract description of the changes represented by pending transactions.
     * The result is cached until pendingTransactions is modified.
     *
     * @returns Change description with precise index mapping, or undefined if no pending transactions.
     */
    getChangeDescription(): DataChangeDescription | undefined {
        // Return cached result if available
        if (this.cachedChangeDescription != null) {
            return this.cachedChangeDescription;
        }

        if (!this.hasPendingTransactions()) {
            return undefined;
        }

        // Build the index transformation map
        const indexMap = this.buildIndexMap();

        // Create the change description instance
        const changeDescription = new DataChangeDescription(indexMap);

        this.cachedChangeDescription = changeDescription;
        return changeDescription;
    }

    /**
     * Builds the index transformation map by sequentially applying all pending transactions.
     */
    private buildIndexMap(): IndexTransformationMap {
        const originalLength = this.data.length;
        const removedIndices = new Set<number>();
        const spliceOps: SpliceOperation[] = [];

        let totalPrependCount = 0;
        let totalAppendCount = 0;

        // First pass: identify all removals and calculate prepend/append totals
        for (const transaction of this.pendingTransactions) {
            const removeRefs = normaliseRemoveReferences(transaction.remove);
            if (removeRefs.length > 0) {
                const indicesToRemove = findIndicesInOriginalArray(this.data, removeRefs);
                indicesToRemove.forEach((idx) => removedIndices.add(idx));
            }

            if (Array.isArray(transaction.prepend)) {
                totalPrependCount += transaction.prepend.length;
            }
            if (Array.isArray(transaction.append)) {
                totalAppendCount += transaction.append.length;
            }
        }

        // Build splice operations
        // We'll create consolidated operations for efficiency

        // 1. If we have prepends, create a splice operation at index 0
        if (totalPrependCount > 0) {
            spliceOps.push({
                index: 0,
                deleteCount: 0,
                insertCount: totalPrependCount,
            });
        }

        // 2. Process removals - group consecutive removals into single splice operations
        const sortedRemovals = Array.from(removedIndices).sort((a, b) => a - b);
        if (sortedRemovals.length > 0) {
            let currentStart = sortedRemovals[0];
            let currentCount = 1;

            for (let i = 1; i < sortedRemovals.length; i++) {
                if (sortedRemovals[i] === sortedRemovals[i - 1] + 1) {
                    // Consecutive removal
                    currentCount++;
                } else {
                    // Gap found, create splice operation for previous group
                    // Adjust index for prepends
                    spliceOps.push({
                        index: currentStart + totalPrependCount,
                        deleteCount: currentCount,
                        insertCount: 0,
                    });
                    currentStart = sortedRemovals[i];
                    currentCount = 1;
                }
            }
            // Don't forget the last group
            spliceOps.push({
                index: currentStart + totalPrependCount,
                deleteCount: currentCount,
                insertCount: 0,
            });
        }

        // 3. If we have appends, create a splice operation at the end
        if (totalAppendCount > 0) {
            const appendIndex = originalLength + totalPrependCount - removedIndices.size;
            spliceOps.push({
                index: appendIndex,
                deleteCount: 0,
                insertCount: totalAppendCount,
            });
        }

        // Sort splice operations by index (descending) for back-to-front application
        spliceOps.sort((a, b) => b.index - a.index);

        const finalLength = originalLength + totalPrependCount + totalAppendCount - removedIndices.size;

        // Calculate optimization flags
        const hasNoRemovals = removedIndices.size === 0;
        const isAppendOnly = hasNoRemovals && totalPrependCount === 0;
        const isPrependOnly = hasNoRemovals && totalAppendCount === 0;

        return {
            originalLength,
            finalLength,
            spliceOps,
            removedIndices,
            totalPrependCount,
            totalAppendCount,
            isAppendOnly,
            isPrependOnly,
            hasNoRemovals,
        };
    }
}
