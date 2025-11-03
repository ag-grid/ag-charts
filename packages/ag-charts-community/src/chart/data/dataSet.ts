import { DataChangeDescription, type IndexTransformationMap, type SpliceOperation } from './dataChangeDescription';

export { DataChangeDescription } from './dataChangeDescription';

/**
 * Encapsulates a single transaction to be applied to a DataSet.
 * Supports both the AG Grid-compatible API (add/addIndex) and the internal format (prepend/append/insertions).
 */
export interface DataSetTransaction<T> {
    /** Items to add at the specified index (AG Grid-compatible API). */
    add?: T[];
    /** Zero-based index for add operation. If undefined or >= length, items are appended. */
    addIndex?: number;
    /** Items to prepend to the beginning (internal format, converted from add with addIndex=0). */
    prepend?: T[];
    /** Items to append to the end (internal format, converted from add with no addIndex). */
    append?: T[];
    /** Items to remove by referential equality. */
    remove?: T[];
    /** Items to update by referential equality. Items should be mutated in place before calling update. */
    update?: T[];
    /** Arbitrary insertions at specific indices (internal format, converted from add with 0 < addIndex < length). */
    insertions?: Array<{ index: number; items: T[] }>;
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

    /**
     * Queues a transaction (applied on commit).
     * Normalizes AG Grid-compatible format (add/addIndex) to internal format (prepend/append).
     */
    addTransaction(transaction: DataSetTransaction<T>): void {
        const normalized = this.normalizeTransaction(transaction);
        this.pendingTransactions.push(normalized);
        this.cachedChangeDescription = undefined;
    }

    /**
     * Converts AG Grid-compatible transaction format to internal format.
     * Maps `add` + `addIndex` to prepend, append, or arbitrary insertion based on the index.
     */
    private normalizeTransaction(transaction: DataSetTransaction<T>): DataSetTransaction<T> {
        const { add, addIndex, prepend, append, remove, update } = transaction;

        // If using legacy format, return as-is
        if (add === undefined) {
            return transaction;
        }

        // Convert add+addIndex to prepend/append/insertions
        const result: DataSetTransaction<T> = { remove, update };

        // Preserve any existing prepend/append (shouldn't happen in practice)
        if (prepend) result.prepend = prepend;
        if (append) result.append = append;

        // Convert add to prepend, append, or arbitrary insertion based on addIndex
        if (add && add.length > 0) {
            const currentSize = this.netSize();

            if (addIndex === undefined || addIndex >= currentSize) {
                // Append to end (default behavior)
                result.append = append ? [...append, ...add] : add;
            } else if (addIndex === 0) {
                // Prepend to beginning
                result.prepend = prepend ? [...add, ...prepend] : add;
            } else {
                // Arbitrary insertion: store in insertions array
                // Index is relative to current data state (after previous transactions)
                result.insertions = [{ index: addIndex, items: add }];
            }
        }

        return result;
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

        // Get all insertion values in order: prepends, insertions, appends
        const prependedValues = changeDescription.getPrependedValues<T>();
        const insertionValues = changeDescription.getInsertionValues<T>();
        const appendedValues = changeDescription.getAppendedValues<T>();

        // Create a flat list of all values to insert, in the order they'll be consumed
        const allInsertionValues = [...prependedValues, ...insertionValues, ...appendedValues];

        // Use a sequential index to consume insertion values in order instead of a map
        // keyed by destination index (which causes collisions when multiple insertions
        // target overlapping indices)
        let insertionValueIndex = 0;

        // Apply transformations using sequential consumption
        changeDescription.applyToArray(this.data, (destIndex) => {
            if (insertionValueIndex >= allInsertionValues.length) {
                throw new Error(`AG Charts - Internal error: No insertion value found for index ${destIndex}`);
            }
            return allInsertionValues[insertionValueIndex++];
        });

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

        const { indexMap, prependValues, appendValues, insertionValues } = this.buildIndexMap();
        const changeDescription = new DataChangeDescription(indexMap, {
            prependValues,
            appendValues,
            insertionValues,
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
     * Helper method to search for items in grouped lists and invoke a callback when found.
     * Removes found items from the toFind set for efficient early termination.
     * @param groups List of groups to search through
     * @param toFind Set of items to find (modified in-place as items are found)
     * @param onFound Callback invoked when an item is found, receives (item, globalIndex)
     */
    private searchItemsInGroupedLists(groups: T[][], toFind: Set<T>, onFound: (item: T, index: number) => void): void {
        let index = 0;
        for (const group of groups) {
            for (const item of group) {
                if (toFind.has(item)) {
                    onFound(item, index);
                    toFind.delete(item);
                }
                index++;
            }
            if (toFind.size === 0) break;
        }
    }

    /**
     * Helper method to count how many items in a sorted array of indices occur before a target index.
     * Assumes sortedIndices is sorted in ascending order.
     * @param sortedIndices Sorted array of indices
     * @param targetIndex The index to compare against
     * @returns Count of indices that are less than targetIndex
     */
    private countRemovalsBefore(sortedIndices: number[], targetIndex: number): number {
        let count = 0;
        for (const idx of sortedIndices) {
            if (idx < targetIndex) {
                count++;
            } else {
                break;
            }
        }
        return count;
    }

    /**
     * Adjusts trackedInsertions when items are removed from them.
     * When items are removed from an insertion, later insertions need their virtualIndex adjusted.
     * This maintains the correct virtual index for each insertion accounting for removals.
     * @param trackedInsertions Array of tracked insertions with virtual indices
     * @param itemsToRemove Items to remove by referential equality
     * @returns Number of items removed (used to adjust virtualLength)
     */
    private adjustInsertionsForRemovals(
        trackedInsertions: Array<{ virtualIndex: number; items: T[] }>,
        itemsToRemove: T[]
    ): number {
        let totalRemoved = 0;

        // Remove items from trackedInsertions and adjust virtualIndex of subsequent insertions
        for (let trackedIdx = 0; trackedIdx < trackedInsertions.length; trackedIdx++) {
            const tracked = trackedInsertions[trackedIdx];
            const previousLength = tracked.items.length;
            const removedOffsets: number[] = [];
            let i = 0;

            while (i < tracked.items.length) {
                if (itemsToRemove.includes(tracked.items[i])) {
                    removedOffsets.push(i + removedOffsets.length);
                    tracked.items.splice(i, 1);
                    totalRemoved++;
                } else {
                    i++;
                }
            }

            const removedCount = removedOffsets.length;

            // Adjust later insertions based on how many removed items existed before their positions
            if (removedCount > 0) {
                for (let j = trackedIdx + 1; j < trackedInsertions.length; j++) {
                    const later = trackedInsertions[j];

                    if (later.virtualIndex <= tracked.virtualIndex) {
                        continue;
                    }

                    const relativeInsertionPosition = Math.min(
                        Math.max(later.virtualIndex - tracked.virtualIndex, 0),
                        previousLength
                    );

                    let removedBeforeInsertion = 0;
                    for (const offset of removedOffsets) {
                        if (offset < relativeInsertionPosition) {
                            removedBeforeInsertion++;
                        } else {
                            break;
                        }
                    }

                    if (relativeInsertionPosition === previousLength) {
                        removedBeforeInsertion = removedCount;
                    }

                    if (removedBeforeInsertion > 0) {
                        later.virtualIndex -= removedBeforeInsertion;
                    }
                }
            }
        }

        return totalRemoved;
    }

    /**
     * Tracks which items were updated across all groups (prepends, insertions, appends, and original data).
     * Searches for items by referential equality and records their indices for later conversion to final positions.
     * @param itemsToUpdate Array of items to find and mark as updated
     * @param prependsList List of prepend groups
     * @param insertionsList List of insertion groups
     * @param appendsList List of append groups
     * @param originalData The original data array
     * @param removedOriginalIndices Set of original indices that were removed (to avoid marking removed items as updated)
     * @param updatedOriginalIndices Set to accumulate original data indices that were updated
     * @returns Tracking info with indices of updated items in prepends, insertions, and appends
     */
    private trackUpdatesAcrossAllGroups(
        itemsToUpdate: T[],
        prependsList: T[][],
        insertionsList: T[][],
        appendsList: T[][],
        originalData: T[],
        removedOriginalIndices: Set<number>,
        updatedOriginalIndices: Set<number>
    ): { updatedPrependsIndices: number[]; updatedAppendsIndices: number[]; updatedInsertionsIndices: number[] } {
        const toUpdate = new Set(itemsToUpdate);
        const updatedPrependsIndices: number[] = [];
        const updatedAppendsIndices: number[] = [];
        const updatedInsertionsIndices: number[] = [];

        // Check prepends for items to update (unlikely but possible if user queued transactions)
        this.searchItemsInGroupedLists(prependsList, toUpdate, (_item, index) => {
            updatedPrependsIndices.push(index);
        });

        // Check insertions for items to update
        if (toUpdate.size > 0) {
            this.searchItemsInGroupedLists(insertionsList, toUpdate, (_item, index) => {
                updatedInsertionsIndices.push(index);
            });
        }

        // Check appends for items to update
        if (toUpdate.size > 0) {
            this.searchItemsInGroupedLists(appendsList, toUpdate, (_item, index) => {
                updatedAppendsIndices.push(index);
            });
        }

        // Scan original data for items to update
        if (toUpdate.size > 0) {
            for (let i = 0; i < originalData.length && toUpdate.size > 0; i++) {
                const value = originalData[i];
                // Only update if not already removed
                if (toUpdate.has(value) && !removedOriginalIndices.has(i)) {
                    updatedOriginalIndices.add(i);
                    toUpdate.delete(value);
                }
            }
        }

        return {
            updatedPrependsIndices,
            updatedAppendsIndices,
            updatedInsertionsIndices,
        };
    }

    /**
     * Converts updated indices from original positions to final positions after all transformations.
     * Accounts for prepends shifting indices right and removals shifting indices left.
     * @param updatedOriginalIndices Set of original array indices that were updated
     * @param updateTracking Tracking info for updates in prepends, appends, and insertions
     * @param totalPrependCount Number of items prepended
     * @param removedOriginalIndices Set of original indices that were removed
     * @param survivingOriginalCount Number of original items that survived
     * @param totalInsertionCount Total count of all inserted items
     * @returns Set of final indices where updated items will be located
     */
    private convertUpdatedIndicesToFinal(
        updatedOriginalIndices: Set<number>,
        updateTracking:
            | {
                  updatedPrependsIndices: number[];
                  updatedAppendsIndices: number[];
                  updatedInsertionsIndices: number[];
              }
            | undefined,
        totalPrependCount: number,
        removedOriginalIndices: Set<number>,
        survivingOriginalCount: number,
        totalInsertionCount: number
    ): Set<number> {
        const updatedFinalIndices = new Set<number>();

        // Add updated prepends (these are at the beginning of the final array)
        if (updateTracking) {
            for (const prependIdx of updateTracking.updatedPrependsIndices) {
                updatedFinalIndices.add(prependIdx);
            }
        }

        // Convert updated original indices to final indices
        if (updatedOriginalIndices.size > 0) {
            const sortedRemovals = Array.from(removedOriginalIndices).sort((a, b) => a - b);

            for (const originalIdx of updatedOriginalIndices) {
                // Count how many removals occurred before this index
                const removalsBeforeCount = this.countRemovalsBefore(sortedRemovals, originalIdx);

                // Calculate final index: shift by prepends, subtract removals before it
                const finalIdx = originalIdx + totalPrependCount - removalsBeforeCount;
                updatedFinalIndices.add(finalIdx);
            }
        }

        // Add updated appends (these are at the end of the final array)
        if (updateTracking) {
            const appendStartIdx = totalPrependCount + survivingOriginalCount + totalInsertionCount;
            for (const appendIdx of updateTracking.updatedAppendsIndices) {
                updatedFinalIndices.add(appendStartIdx + appendIdx);
            }
        }

        // Add updated insertions (need to calculate their final positions)
        if (updateTracking && updateTracking.updatedInsertionsIndices.length > 0) {
            // Map insertion indices to their final positions
            let insertionOffset = 0;
            const finalInsertionStartIdx = totalPrependCount;

            for (const insertionIdx of updateTracking.updatedInsertionsIndices) {
                // Calculate position in final array
                // This is simplified - in reality we'd need to account for the specific insertion positions
                // But for now, insertions are tracked separately and will be reprocessed anyway
                const finalIdx = finalInsertionStartIdx + insertionOffset + insertionIdx;
                updatedFinalIndices.add(finalIdx);
                insertionOffset++;
            }
        }

        return updatedFinalIndices;
    }

    /**
     * Generates splice operations for all changes: prepends, removals, insertions, and appends.
     * Splice operations are ordered to be applied efficiently to an array.
     * @param totalPrependCount Number of items prepended
     * @param removedOriginalIndices Set of original indices that were removed
     * @param trackedInsertions Array of tracked insertions with virtual indices
     * @param totalAppendCount Number of items appended
     * @param survivingOriginalCount Number of original items that survived (not removed)
     * @param totalInsertionCount Total count of all inserted items
     * @returns Array of splice operations
     */
    private generateSpliceOperations(
        totalPrependCount: number,
        removedOriginalIndices: Set<number>,
        trackedInsertions: Array<{ virtualIndex: number; items: T[] }>,
        totalAppendCount: number,
        survivingOriginalCount: number,
        totalInsertionCount: number
    ): SpliceOperation[] {
        const spliceOps: SpliceOperation[] = [];

        // 1. Prepend operation (always at index 0)
        if (totalPrependCount > 0) {
            spliceOps.push({
                index: 0,
                deleteCount: 0,
                insertCount: totalPrependCount,
            });
        }

        // 2. Removal operations (back to front to avoid index shifting)
        if (removedOriginalIndices.size > 0) {
            const sortedRemovals = Array.from(removedOriginalIndices).sort((a, b) => b - a);

            // Group consecutive indices for optimized splice operations
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

            spliceOps.push({
                index: currentGroupStart - currentGroupCount + 1 + totalPrependCount,
                deleteCount: currentGroupCount,
                insertCount: 0,
            });
        }

        // 3. Arbitrary insertion operations
        // Important: Insertions must be applied in the order they were tracked (NOT sorted)
        // because each insertion's virtualIndex accounts for previous insertions
        // We also need to adjust for removals that shift indices
        if (trackedInsertions.length > 0) {
            // Pre-calculate virtual indices of all removals (with prepend offset)
            const virtualRemovalIndices = Array.from(removedOriginalIndices)
                .map((idx) => idx + totalPrependCount)
                .sort((a, b) => a - b);

            for (const insertion of trackedInsertions) {
                // Calculate how many removals occurred before this insertion's virtual index
                const removalsBeforeInsertion = this.countRemovalsBefore(virtualRemovalIndices, insertion.virtualIndex);

                // Adjust insertion index to account for removals
                const adjustedIndex = insertion.virtualIndex - removalsBeforeInsertion;

                spliceOps.push({
                    index: adjustedIndex,
                    deleteCount: 0,
                    insertCount: insertion.items.length,
                });
            }
        }

        // 4. Append operation (at the end)
        if (totalAppendCount > 0) {
            spliceOps.push({
                index: totalPrependCount + survivingOriginalCount + totalInsertionCount,
                deleteCount: 0,
                insertCount: totalAppendCount,
            });
        }

        return spliceOps;
    }

    /**
     * Builds the index transformation map by sequentially applying all pending transactions.
     * Optimized to:
     * - Track operation boundaries instead of individual items
     * - Only scan for values that are actually being removed
     * - Stop scanning early when all removed values are found
     * - Support arbitrary insertions at any index
     * - Track updated items by referential equality
     */
    private buildIndexMap(): {
        indexMap: IndexTransformationMap;
        prependValues: T[];
        appendValues: T[];
        insertionValues: T[];
    } {
        const originalLength = this.data.length;

        const prependsList: T[][] = [];
        const appendsList: T[][] = [];
        const insertionsList: T[][] = [];
        const removedOriginalIndices = new Set<number>();
        const updatedOriginalIndices = new Set<number>();
        let updateTracking:
            | {
                  updatedPrependsIndices: number[];
                  updatedAppendsIndices: number[];
                  updatedInsertionsIndices: number[];
              }
            | undefined;

        // Track insertions with their virtual indices for later splice operation generation
        interface TrackedInsertion {
            virtualIndex: number; // Index at time of transaction (relative to current state)
            items: T[];
        }
        const trackedInsertions: TrackedInsertion[] = [];

        // Track virtual array length as we process transactions
        let virtualLength = originalLength;

        for (const transaction of this.pendingTransactions) {
            // Note: transactions are already normalized in addTransaction()
            const { prepend, append, insertions, remove, update } = transaction;

            // Handle prepends (special case: always at virtual index 0)
            if (Array.isArray(prepend) && prepend.length > 0) {
                prependsList.unshift([...prepend]); // LIFO order
                virtualLength += prepend.length;
            }

            // Handle arbitrary insertions
            if (Array.isArray(insertions)) {
                for (const { index, items } of insertions) {
                    if (index >= 0 && index <= virtualLength && items.length > 0) {
                        // Store insertion with its virtual index for later processing
                        trackedInsertions.push({
                            virtualIndex: index,
                            items: [...items],
                        });
                        insertionsList.push([...items]);
                        virtualLength += items.length;
                    }
                }
            }

            // Handle appends
            if (Array.isArray(append) && append.length > 0) {
                appendsList.push([...append]);
                virtualLength += append.length;
            }

            // Removals check prepends, insertions, originals, then appends
            if (Array.isArray(remove) && remove.length > 0) {
                const toRemove = new Set(remove);

                // OPTIMIZATION 3: Remove from prepends first (FIFO - front to back)
                this.removeFromGroups(prependsList, toRemove);

                // Remove from insertions
                if (toRemove.size > 0) {
                    this.removeFromGroups(insertionsList, toRemove);

                    // Adjust trackedInsertions for removed items
                    const removedFromInsertions = this.adjustInsertionsForRemovals(trackedInsertions, remove);
                    virtualLength -= removedFromInsertions;
                }

                // Remove from appends
                if (toRemove.size > 0) {
                    this.removeFromGroups(appendsList, toRemove);
                }

                // OPTIMIZATIONS 1 & 2: Only scan original data for remaining values
                if (toRemove.size > 0) {
                    for (let i = 0; i < this.data.length && toRemove.size > 0; i++) {
                        const value = this.data[i];
                        if (toRemove.has(value)) {
                            removedOriginalIndices.add(i);
                            toRemove.delete(value);
                            virtualLength--;
                        }
                    }
                }
            }

            // Handle updates - find items by referential equality in original data
            // Updates don't change virtualLength, they just mark indices as updated
            if (Array.isArray(update) && update.length > 0) {
                updateTracking = this.trackUpdatesAcrossAllGroups(
                    update,
                    prependsList,
                    insertionsList,
                    appendsList,
                    this.data,
                    removedOriginalIndices,
                    updatedOriginalIndices
                );
            }
        }

        // Flatten the prepends, appends, and insertions lists
        const survivingPrepends = prependsList.flat();
        const survivingAppends = appendsList.flat();
        const survivingInsertions = insertionsList.flat();

        const totalPrependCount = survivingPrepends.length;
        const totalAppendCount = survivingAppends.length;
        const totalInsertionCount = survivingInsertions.length;
        const survivingOriginalCount = originalLength - removedOriginalIndices.size;
        const finalLength = totalPrependCount + survivingOriginalCount + totalInsertionCount + totalAppendCount;

        // Generate splice operations for all insertions, removals, prepends, and appends
        const spliceOps = this.generateSpliceOperations(
            totalPrependCount,
            removedOriginalIndices,
            trackedInsertions,
            totalAppendCount,
            survivingOriginalCount,
            totalInsertionCount
        );

        // Convert updated original indices to final indices
        const updatedFinalIndices = this.convertUpdatedIndicesToFinal(
            updatedOriginalIndices,
            updateTracking,
            totalPrependCount,
            removedOriginalIndices,
            survivingOriginalCount,
            totalInsertionCount
        );

        const indexMap: IndexTransformationMap = {
            originalLength,
            finalLength,
            spliceOps,
            removedIndices: removedOriginalIndices,
            updatedIndices: updatedFinalIndices,
            totalPrependCount,
            totalAppendCount,
        };

        return {
            indexMap,
            prependValues: survivingPrepends,
            appendValues: survivingAppends,
            insertionValues: survivingInsertions,
        };
    }
}
