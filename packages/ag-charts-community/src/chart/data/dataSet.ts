import { DataChangeDescription, type IndexTransformationMap, type SpliceOperation } from './dataChangeDescription';

export { DataChangeDescription } from './dataChangeDescription';

/**
 * Encapsulates a single transaction to be applied to a DataSet.
 */
export interface DataSetTransaction<T> {
    prepend?: T[];
    append?: T[];
    remove?: T[];
}

/**
 * Manages transactional updates to an array of data with optimized batch processing.
 * Transactions are queued and can be applied in batch for efficient data transformations.
 */
export class DataSet<T = unknown> {
    private pendingTransactions: DataSetTransaction<T>[] = [];
    private cachedChangeDescription: DataChangeDescription | undefined;

    constructor(public data: T[]) {}

    /**
     * Creates an empty DataSet.
     */
    static empty<U = unknown>(): DataSet<U> {
        return new DataSet<U>([]);
    }

    /**
     * Wraps existing data in a DataSet.
     */
    static wrap<U = unknown>(data: U[]): DataSet<U> {
        return new DataSet<U>(data);
    }

    /**
     * Gets the net size of the data (after pending transactions).
     */
    netSize(): number {
        if (!this.hasPendingTransactions()) {
            return this.data.length;
        }

        const changeDesc = this.getChangeDescription();
        return changeDesc ? changeDesc.indexMap.finalLength : this.data.length;
    }

    /**
     * Adds a transaction to the pending queue.
     * The transaction will not be applied until commitPendingTransactions() is called.
     * @param transaction The transaction to add to the queue
     */
    addTransaction(transaction: DataSetTransaction<T>): void {
        this.pendingTransactions.push(transaction);
        this.cachedChangeDescription = undefined; // Invalidate cache
    }

    /**
     * Checks if there are pending transactions to process.
     * @returns true if there are pending transactions
     */
    hasPendingTransactions(): boolean {
        return this.pendingTransactions.length > 0;
    }

    /**
     * Gets the number of pending transactions.
     * @returns The number of transactions waiting to be committed
     */
    getPendingTransactionCount(): number {
        return this.pendingTransactions.length;
    }

    /**
     * Commits all pending transactions by efficiently applying them to the data array.
     * Optimized to minimize array operations and avoid full data scans.
     * @returns true if any transactions were applied
     */
    commitPendingTransactions(): boolean {
        if (!this.hasPendingTransactions()) {
            return false;
        }

        // Get the optimized change description to understand what operations to perform
        const changeDescription = this.getChangeDescription();
        if (!changeDescription) {
            return false;
        }

        // Use DataChangeDescription's efficient applyToArrayWithStoredValues method
        changeDescription.applyToArrayWithStoredValues(this.data);

        this.pendingTransactions = [];
        this.cachedChangeDescription = undefined; // Clear cache after commit
        return true;
    }

    /**
     * Discards all pending transactions without applying them.
     * @returns The number of transactions that were discarded
     */
    clearPendingTransactions(): number {
        const count = this.pendingTransactions.length;
        this.pendingTransactions = [];
        this.cachedChangeDescription = undefined;
        return count;
    }

    /**
     * Gets the transactions that are currently pending.
     * @returns A copy of the pending transactions array
     */
    getPendingTransactions(): DataSetTransaction<T>[] {
        return [...this.pendingTransactions];
    }

    /**
     * Applies a DataChangeDescription to an array in a memory-efficient manner.
     * @param source The source array to transform
     * @param destination The destination array to populate (can be the same as source)
     * @param changeDescription The change description to apply
     */
    static applyChangesToArray<U>(source: U[], destination: U[], changeDescription: DataChangeDescription): void {
        const { indexMap } = changeDescription;

        // Early exit if no changes
        if (indexMap.originalLength === indexMap.finalLength && indexMap.spliceOps.length === 0) {
            if (source !== destination) {
                destination.length = 0;
                destination.push(...source);
            }
            return;
        }

        // Apply transformations
        changeDescription.applyToArray(destination, (destIndex) => {
            // This shouldn't be called for pure removals
            throw new Error(`Unexpected insertion at index ${destIndex}`);
        });
    }

    /**
     * Builds a DataChangeDescription that represents all pending transactions.
     * This does not modify the data array.
     * @returns A DataChangeDescription or undefined if no transactions are pending
     */
    getChangeDescription(): DataChangeDescription | undefined {
        if (!this.hasPendingTransactions()) {
            return undefined;
        }

        // Return cached version if available
        if (this.cachedChangeDescription) {
            return this.cachedChangeDescription;
        }

        const { indexMap, prependValues, appendValues } = this.buildIndexMap();
        const changeDescription = new DataChangeDescription(indexMap, {
            prependValues,
            appendValues,
        });

        this.cachedChangeDescription = changeDescription;
        return changeDescription;
    }

    /**
     * Builds the index transformation map by sequentially applying all pending transactions.
     * Optimized to:
     * - Track operation boundaries instead of individual items
     * - Only scan for values that are actually being removed
     * - Stop scanning early when all removed values are found
     */
    private buildIndexMap(): {
        indexMap: IndexTransformationMap;
        prependValues: T[];
        appendValues: T[];
    } {
        const originalLength = this.data.length;

        // Track the conceptual structure: [prepends] [original elements] [appends]
        const prependsList: T[][] = []; // Each transaction's prepends (in reverse order for LIFO)
        const appendsList: T[][] = []; // Each transaction's appends
        const removedOriginalIndices = new Set<number>();

        // Process each transaction sequentially to maintain correct semantics
        for (const transaction of this.pendingTransactions) {
            const { prepend, append, remove } = transaction;

            // Add prepends (they go to the front)
            if (Array.isArray(prepend) && prepend.length > 0) {
                prependsList.unshift([...prepend]);
            }

            // Add appends (they go to the back)
            if (Array.isArray(append) && append.length > 0) {
                appendsList.push([...append]);
            }

            // Process removals - must check in order: prepends, originals, appends
            if (Array.isArray(remove) && remove.length > 0) {
                const toRemove = new Set(remove);

                // OPTIMIZATION 3: Remove from prepends first (FIFO - front to back)
                // These are typically much smaller sets than original data
                for (const prependGroup of prependsList) {
                    let i = 0;
                    while (i < prependGroup.length) {
                        if (toRemove.has(prependGroup[i])) {
                            toRemove.delete(prependGroup[i]);
                            prependGroup.splice(i, 1);
                            // Don't increment i, stay at same position after removal
                            if (toRemove.size === 0) break;
                        } else {
                            i++;
                        }
                    }
                    if (toRemove.size === 0) break;
                }

                // OPTIMIZATION 3: Remove from appends next (FIFO - front to back)
                // Also typically much smaller than original data
                if (toRemove.size > 0) {
                    for (const appendGroup of appendsList) {
                        let i = 0;
                        while (i < appendGroup.length) {
                            if (toRemove.has(appendGroup[i])) {
                                toRemove.delete(appendGroup[i]);
                                appendGroup.splice(i, 1);
                                // Don't increment i, stay at same position after removal
                                if (toRemove.size === 0) break;
                            } else {
                                i++;
                            }
                        }
                        if (toRemove.size === 0) break;
                    }
                }

                // OPTIMIZATIONS 1 & 2: Only scan original data for remaining values
                // Build index map lazily and only for values we're actually looking for
                if (toRemove.size > 0) {
                    // Only scan the data for values that still need to be removed
                    for (let i = 0; i < this.data.length && toRemove.size > 0; i++) {
                        const value = this.data[i];
                        if (toRemove.has(value)) {
                            removedOriginalIndices.add(i);
                            toRemove.delete(value);
                            // OPTIMIZATION 2: Stop early if we've found all values
                            // (assumes each value appears only once, which is common)
                        }
                    }
                }
            }
        }

        // Flatten the prepends and appends lists
        const survivingPrepends = prependsList.flat();
        const survivingAppends = appendsList.flat();

        const totalPrependCount = survivingPrepends.length;
        const totalAppendCount = survivingAppends.length;
        const survivingOriginalCount = originalLength - removedOriginalIndices.size;
        const finalLength = totalPrependCount + survivingOriginalCount + totalAppendCount;

        const spliceOps: SpliceOperation[] = [];
        if (totalPrependCount > 0) {
            spliceOps.push({
                index: 0,
                deleteCount: 0,
                insertCount: totalPrependCount,
            });
        }

        if (removedOriginalIndices.size > 0) {
            const sortedRemovals = Array.from(removedOriginalIndices).sort((a, b) => b - a);

            // Group consecutive indices and create optimized splice operations
            let currentGroupStart = sortedRemovals[0];
            let currentGroupCount = 1;

            for (let i = 1; i < sortedRemovals.length; i++) {
                const currentIndex = sortedRemovals[i];
                const prevIndex = sortedRemovals[i - 1];

                if (prevIndex - currentIndex === 1) {
                    // Consecutive (descending), continue the group
                    currentGroupCount++;
                } else {
                    // Non-consecutive, finalize current group
                    spliceOps.push({
                        index: currentGroupStart - currentGroupCount + 1 + totalPrependCount,
                        deleteCount: currentGroupCount,
                        insertCount: 0,
                    });

                    // Start new group
                    currentGroupStart = currentIndex;
                    currentGroupCount = 1;
                }
            }

            // Add the last group
            spliceOps.push({
                index: currentGroupStart - currentGroupCount + 1 + totalPrependCount,
                deleteCount: currentGroupCount,
                insertCount: 0,
            });
        }

        if (totalAppendCount > 0) {
            spliceOps.push({
                index: totalPrependCount + survivingOriginalCount,
                deleteCount: 0,
                insertCount: totalAppendCount,
            });
        }

        const removedCount = removedOriginalIndices.size;
        const hasNoRemovals = removedCount === 0;
        const indexMap: IndexTransformationMap = {
            originalLength,
            finalLength,
            spliceOps,
            removedIndices: removedOriginalIndices,
            totalPrependCount,
            totalAppendCount,
            isAppendOnly: hasNoRemovals && totalPrependCount === 0 && totalAppendCount > 0,
            isPrependOnly: hasNoRemovals && totalAppendCount === 0 && totalPrependCount > 0,
            hasNoRemovals,
        };

        return {
            indexMap,
            prependValues: survivingPrepends,
            appendValues: survivingAppends,
        };
    }
}
