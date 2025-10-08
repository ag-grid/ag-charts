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

    netSize(): number {
        if (!this.hasPendingTransactions()) {
            return this.data.length;
        }

        const changeDesc = this.getChangeDescription();
        return changeDesc ? changeDesc.indexMap.finalLength : this.data.length;
    }

    /** Queues a transaction (applied on commit). */
    addTransaction(transaction: DataSetTransaction<T>): void {
        this.pendingTransactions.push(transaction);
        this.cachedChangeDescription = undefined;
    }

    hasPendingTransactions(): boolean {
        return this.pendingTransactions.length > 0;
    }

    getPendingTransactionCount(): number {
        return this.pendingTransactions.length;
    }

    /** Applies all pending transactions to the data array. */
    commitPendingTransactions(): boolean {
        if (!this.hasPendingTransactions()) {
            return false;
        }

        const changeDescription = this.getChangeDescription();
        if (!changeDescription) {
            return false;
        }

        const allInsertions = [
            ...changeDescription.getPrependedValues<T>(),
            ...changeDescription.getAppendedValues<T>(),
        ];
        let insertionIndex = 0;
        changeDescription.applyToArray(this.data, () => allInsertions[insertionIndex++]);

        this.pendingTransactions = [];
        this.cachedChangeDescription = undefined;
        return true;
    }

    clearPendingTransactions(): number {
        const count = this.pendingTransactions.length;
        this.pendingTransactions = [];
        this.cachedChangeDescription = undefined;
        return count;
    }

    getPendingTransactions(): DataSetTransaction<T>[] {
        return [...this.pendingTransactions];
    }

    /** Custom JSON serialization (avoids snapshot bloat). */
    toJSON(): T[] {
        return this.data;
    }

    /** Builds a DataChangeDescription from pending transactions (does not modify data). */
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
     * Helper method to remove items from a list of groups.
     * Mutates the groups in-place and removes found items from toRemove set.
     * @param groups List of groups to search and remove from
     * @param toRemove Set of items to remove (modified in-place)
     */
    private removeFromGroups(groups: T[][], toRemove: Set<T>): void {
        for (const group of groups) {
            let i = 0;
            while (i < group.length && toRemove.size > 0) {
                if (toRemove.has(group[i])) {
                    toRemove.delete(group[i]);
                    group.splice(i, 1);
                } else {
                    i++;
                }
            }
            if (toRemove.size === 0) break;
        }
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

        const prependsList: T[][] = [];
        const appendsList: T[][] = [];
        const removedOriginalIndices = new Set<number>();

        for (const transaction of this.pendingTransactions) {
            const { prepend, append, remove } = transaction;

            if (Array.isArray(prepend) && prepend.length > 0) {
                prependsList.unshift([...prepend]); // LIFO order
            }

            if (Array.isArray(append) && append.length > 0) {
                appendsList.push([...append]);
            }

            // Removals check prepends, originals, then appends
            if (Array.isArray(remove) && remove.length > 0) {
                const toRemove = new Set(remove);

                // OPTIMIZATION 3: Remove from prepends first (FIFO - front to back)
                // These are typically much smaller sets than original data
                this.removeFromGroups(prependsList, toRemove);

                // OPTIMIZATION 3: Remove from appends next (FIFO - front to back)
                // Also typically much smaller than original data
                if (toRemove.size > 0) {
                    this.removeFromGroups(appendsList, toRemove);
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
                    currentGroupCount++;
                } else {
                    spliceOps.push({
                        index: currentGroupStart - currentGroupCount + 1 + totalPrependCount,
                        deleteCount: currentGroupCount,
                        insertCount: 0,
                    });

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

        const indexMap: IndexTransformationMap = {
            originalLength,
            finalLength,
            spliceOps,
            removedIndices: removedOriginalIndices,
            totalPrependCount,
            totalAppendCount,
        };

        return {
            indexMap,
            prependValues: survivingPrepends,
            appendValues: survivingAppends,
        };
    }
}
