import { Logger } from 'ag-charts-core';

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

interface TrackedInsertion<T> {
    virtualIndex: number;
    items: T[];
}

interface UpdateIndexTracking {
    updatedPrependsIndices: number[];
    updatedAppendsIndices: number[];
    updatedInsertionsIndices: number[];
}

interface TransactionCollectionState<T> {
    prependsList: T[][];
    appendsList: T[][];
    insertionsList: T[][];
    trackedInsertions: TrackedInsertion<T>[];
    removedOriginalIndices: Set<number>;
    updatedOriginalIndices: Set<number>;
    virtualLength: number;
    updateTracking?: UpdateIndexTracking;
}

interface TransactionEffects<T> {
    prependsList: T[][];
    appendsList: T[][];
    insertionsList: T[][];
    trackedInsertions: TrackedInsertion<T>[];
    removedOriginalIndices: Set<number>;
    updatedOriginalIndices: Set<number>;
    updateTracking?: UpdateIndexTracking;
}

/**
 * Manages transactional updates to an array of data with optimized batch processing.
 * Transactions are queued and can be applied in batch for efficient data transformations.
 */
export class DataSet<T = unknown> {
    private pendingTransactions: DataSetTransaction<T>[] = [];
    private cachedChangeDescription: DataChangeDescription | undefined;
    private itemToIndexCache: Map<T, number> | undefined;

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
     * @returns A deep clone of the DataSet.
     */
    deepClone() {
        return new DataSet([...this.data]);
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
        changeDescription.applyToArray(this.data, function applyToArrayResultFn(destIndex: number) {
            if (insertionValueIndex >= allInsertionValues.length) {
                throw new Error(`AG Charts - Internal error: No insertion value found for index ${destIndex}`);
            }
            return allInsertionValues[insertionValueIndex++];
        });

        this.pendingTransactions = [];
        this.cachedChangeDescription = undefined;

        // Maintain index cache incrementally where possible, otherwise invalidate.
        this.updateItemToIndexCache(changeDescription, appendedValues, prependedValues, insertionValues);

        return true;
    }

    /** Updates item→index cache incrementally, or invalidates for complex changes. */
    private updateItemToIndexCache(
        changeDescription: DataChangeDescription,
        appendedValues: T[],
        prependedValues: T[],
        insertionValues: T[]
    ): void {
        if (!this.itemToIndexCache) return;

        const { indexMap } = changeDescription;
        const { totalPrependCount, totalAppendCount, removedIndices } = indexMap;
        const hasRemovals = removedIndices.size > 0;
        const hasArbitraryInsertions = insertionValues.length > 0;

        if (!hasRemovals && totalPrependCount === 0 && totalAppendCount === 0 && !hasArbitraryInsertions) {
            return; // Update-only: no index changes
        }

        if (hasArbitraryInsertions) {
            this.itemToIndexCache = undefined;
            return; // Arbitrary insertions are complex
        }

        let removalsAreContiguousAtStart = false;
        let contiguousRemovalCount = 0;
        if (hasRemovals) {
            const sortedRemovals = Array.from(removedIndices).sort((a, b) => a - b);
            removalsAreContiguousAtStart = sortedRemovals[0] === 0;
            if (removalsAreContiguousAtStart) {
                for (let i = 0; i < sortedRemovals.length; i++) {
                    if (sortedRemovals[i] !== i) {
                        removalsAreContiguousAtStart = false;
                        break;
                    }
                }
                if (removalsAreContiguousAtStart) {
                    contiguousRemovalCount = sortedRemovals.length;
                }
            }
        }

        if (hasRemovals && !removalsAreContiguousAtStart) {
            this.itemToIndexCache = undefined;
            return; // Complex removal pattern
        }

        const cache = this.itemToIndexCache;
        const indexShift = totalPrependCount - contiguousRemovalCount;

        if (indexShift !== 0) {
            for (const [item, oldIndex] of cache) {
                if (removedIndices.has(oldIndex)) {
                    cache.delete(item);
                } else {
                    cache.set(item, oldIndex + indexShift);
                }
            }
        } else if (hasRemovals) {
            for (const [item, oldIndex] of cache) {
                if (removedIndices.has(oldIndex)) {
                    cache.delete(item);
                }
            }
        }

        for (let i = 0; i < prependedValues.length; i++) {
            const item = prependedValues[i];
            if (!cache.has(item)) {
                cache.set(item, i);
            }
        }

        const appendStartIndex = indexMap.finalLength - totalAppendCount;
        for (let i = 0; i < appendedValues.length; i++) {
            const item = appendedValues[i];
            if (!cache.has(item)) {
                cache.set(item, appendStartIndex + i);
            }
        }
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
        const effects = this.collectTransactionEffects();

        const survivingPrepends = effects.prependsList.flat();
        const survivingAppends = effects.appendsList.flat();
        const survivingInsertions = effects.insertionsList.flat();

        const totalPrependCount = survivingPrepends.length;
        const totalAppendCount = survivingAppends.length;
        const totalInsertionCount = survivingInsertions.length;
        const survivingOriginalCount = originalLength - effects.removedOriginalIndices.size;
        const finalLength = totalPrependCount + survivingOriginalCount + totalInsertionCount + totalAppendCount;

        const sortedRemoved =
            effects.removedOriginalIndices.size > 0
                ? this.getSortedRemovedIndices(effects.removedOriginalIndices)
                : undefined;

        const spliceOps = this.buildSpliceOperations(
            totalPrependCount,
            totalInsertionCount,
            totalAppendCount,
            survivingOriginalCount,
            effects.trackedInsertions,
            sortedRemoved?.desc,
            sortedRemoved?.asc
        );

        const updatedFinalIndices = this.resolveUpdatedIndices(
            totalPrependCount,
            totalInsertionCount,
            survivingOriginalCount,
            effects.updateTracking,
            sortedRemoved?.asc,
            effects.updatedOriginalIndices,
            effects.trackedInsertions
        );

        const indexMap: IndexTransformationMap = {
            originalLength,
            finalLength,
            spliceOps,
            removedIndices: effects.removedOriginalIndices,
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

    private getSortedRemovedIndices(removedOriginalIndices: Set<number>): { asc: number[]; desc: number[] } {
        const asc = Array.from(removedOriginalIndices).sort((a, b) => a - b);
        return { asc, desc: [...asc].reverse() };
    }

    private collectTransactionEffects(): TransactionEffects<T> {
        const state: TransactionCollectionState<T> = {
            prependsList: [],
            appendsList: [],
            insertionsList: [],
            trackedInsertions: [],
            removedOriginalIndices: new Set<number>(),
            updatedOriginalIndices: new Set<number>(),
            virtualLength: this.data.length,
        };

        for (const transaction of this.pendingTransactions) {
            const { prepend, append, insertions, remove, update } = transaction;

            this.applyPrepends(prepend, state);
            this.applyInsertions(insertions, state);
            this.applyAppends(append, state);
            this.applyRemovals(remove, state);
            this.applyUpdates(update, state);
        }

        return {
            prependsList: state.prependsList,
            appendsList: state.appendsList,
            insertionsList: state.insertionsList,
            trackedInsertions: state.trackedInsertions,
            removedOriginalIndices: state.removedOriginalIndices,
            updatedOriginalIndices: state.updatedOriginalIndices,
            updateTracking: state.updateTracking,
        };
    }

    private applyPrepends(prepend: T[] | undefined, state: TransactionCollectionState<T>): void {
        if (!Array.isArray(prepend) || prepend.length === 0) {
            return;
        }

        state.prependsList.unshift([...prepend]);
        state.virtualLength += prepend.length;
    }

    private applyInsertions(
        insertions: Array<{ index: number; items: T[] }> | undefined,
        state: TransactionCollectionState<T>
    ): void {
        if (!Array.isArray(insertions)) {
            return;
        }

        for (const { index, items } of insertions) {
            if (index >= 0 && index <= state.virtualLength && items.length > 0) {
                state.trackedInsertions.push({
                    virtualIndex: index,
                    items: [...items],
                });
                state.insertionsList.push([...items]);
                state.virtualLength += items.length;
            }
        }
    }

    private applyAppends(append: T[] | undefined, state: TransactionCollectionState<T>): void {
        if (!Array.isArray(append) || append.length === 0) {
            return;
        }

        state.appendsList.push([...append]);
        state.virtualLength += append.length;
    }

    private applyRemovals(remove: T[] | undefined, state: TransactionCollectionState<T>): void {
        if (!Array.isArray(remove) || remove.length === 0) {
            return;
        }

        // Track which items are primitives (for warning purposes)
        // Note: null is typeof 'object' in JavaScript but is a valid value, so we allow it
        const primitiveItems = new Set<T>();
        for (const item of remove) {
            if (item !== null && typeof item !== 'object' && typeof item !== 'function') {
                primitiveItems.add(item);
            }
        }

        const toRemove = new Set(remove);

        this.removeFromGroups(state.prependsList, toRemove);

        if (toRemove.size > 0) {
            this.removeFromGroups(state.insertionsList, toRemove);
        }

        if (state.trackedInsertions.length > 0) {
            this.removeFromTrackedInsertions(remove, state);
        }

        if (toRemove.size > 0) {
            this.removeFromGroups(state.appendsList, toRemove);
        }

        if (toRemove.size > 0) {
            for (let i = 0; i < this.data.length && toRemove.size > 0; i++) {
                const value = this.data[i];
                if (toRemove.has(value)) {
                    state.removedOriginalIndices.add(i);
                    toRemove.delete(value);
                    state.virtualLength--;
                }
            }
        }

        // Warn if any items were not found
        // JIRA AG-16074 issue 5: Warn when string arrays (non-object values) are passed and not found
        if (toRemove.size > 0) {
            const unfoundPrimitives: T[] = [];
            for (const item of toRemove) {
                if (primitiveItems.has(item)) {
                    unfoundPrimitives.push(item);
                }
            }

            // Issue 5: Warn about primitives that weren't found
            if (unfoundPrimitives.length > 0) {
                const types = Array.from(new Set(unfoundPrimitives.map((v) => typeof v))).join(', ');
                Logger.warnOnce(
                    `applyTransaction() remove array contains non-object values. Expected object references, received: ${types}. These items will be ignored.`
                );
            }
            // Note: We don't warn for objects that aren't found in remove operations,
            // as rolling window patterns legitimately use new object instances
        }
    }

    private applyUpdates(update: T[] | undefined, state: TransactionCollectionState<T>): void {
        if (!Array.isArray(update) || update.length === 0) {
            return;
        }

        // Track which items are primitives (for warning purposes)
        // Note: null is typeof 'object' in JavaScript but is a valid value, so we allow it
        const primitiveItems = new Set<T>();
        for (const item of update) {
            if (item !== null && typeof item !== 'object' && typeof item !== 'function') {
                primitiveItems.add(item);
            }
        }

        const toUpdate = new Set(update);
        const updatedPrependsIndices = this.collectUpdatedIndicesFromGroups(state.prependsList, toUpdate);
        const updatedInsertionsIndices =
            toUpdate.size > 0 ? this.collectUpdatedIndicesFromGroups(state.insertionsList, toUpdate) : [];
        const updatedAppendsIndices =
            toUpdate.size > 0 ? this.collectUpdatedIndicesFromGroups(state.appendsList, toUpdate) : [];

        if (toUpdate.size > 0) {
            this.collectUpdatedOriginalIndices(toUpdate, state);
        }

        // Warn if any items were not found
        // JIRA AG-16074 issue 5: Warn when string arrays (non-object values) are passed and not found
        // JIRA AG-16074 issue 6: Warn-once when attempting to update a non-existent datum (object)
        // Note: We check this after collectUpdatedOriginalIndices which removes found items from toUpdate
        if (toUpdate.size > 0) {
            const unfoundPrimitives: T[] = [];
            const unfoundObjects: T[] = [];
            for (const item of toUpdate) {
                if (primitiveItems.has(item)) {
                    unfoundPrimitives.push(item);
                } else {
                    unfoundObjects.push(item);
                }
            }

            // Issue 5: Warn about primitives that weren't found
            if (unfoundPrimitives.length > 0) {
                const types = Array.from(new Set(unfoundPrimitives.map((v) => typeof v))).join(', ');
                Logger.warnOnce(
                    `applyTransaction() update array contains non-object values. Expected object references, received: ${types}. These items will be ignored.`
                );
            }

            // Issue 6: Warn-once for objects that weren't found (non-existent datums)
            // Only warn if we actually tried to update objects (not just primitives)
            if (unfoundObjects.length > 0 && primitiveItems.size < update.length) {
                Logger.warnOnce(
                    `applyTransaction() could not find ${unfoundObjects.length} item(s) to update. Ensure you pass the same object references that exist in the data.`
                );
            }
        }

        state.updateTracking = {
            updatedPrependsIndices,
            updatedAppendsIndices,
            updatedInsertionsIndices,
        };
    }

    // Flattens grouped inserts to find updated item offsets while consuming the lookup set.
    private collectUpdatedIndicesFromGroups(groups: T[][], toUpdate: Set<T>): number[] {
        if (toUpdate.size === 0 || groups.length === 0) {
            return [];
        }

        const updatedIndices: number[] = [];
        let flatIndex = 0;

        for (const group of groups) {
            for (const item of group) {
                if (toUpdate.has(item)) {
                    updatedIndices.push(flatIndex);
                    toUpdate.delete(item);
                }
                flatIndex++;
            }

            if (toUpdate.size === 0) {
                break;
            }
        }

        return updatedIndices;
    }

    /** Lazy item→index map for O(1) lookups. */
    private getItemToIndexMap(): Map<T, number> {
        if (this.itemToIndexCache === undefined) {
            this.itemToIndexCache = new Map();
            for (let i = 0; i < this.data.length; i++) {
                if (!this.itemToIndexCache.has(this.data[i])) {
                    this.itemToIndexCache.set(this.data[i], i);
                }
            }
        }
        return this.itemToIndexCache;
    }

    private collectUpdatedOriginalIndices(toUpdate: Set<T>, state: TransactionCollectionState<T>): void {
        const indexMap = this.getItemToIndexMap();

        for (const item of toUpdate) {
            const idx = indexMap.get(item);
            if (idx !== undefined && !state.removedOriginalIndices.has(idx)) {
                state.updatedOriginalIndices.add(idx);
                toUpdate.delete(item); // Remove found items from toUpdate set
            }
        }
    }

    private removeFromTrackedInsertions(removeValues: T[], state: TransactionCollectionState<T>): void {
        for (let trackedIdx = 0; trackedIdx < state.trackedInsertions.length; trackedIdx++) {
            const tracked = state.trackedInsertions[trackedIdx];
            const previousLength = tracked.items.length;
            const removedOffsets: number[] = [];
            let itemIndex = 0;

            while (itemIndex < tracked.items.length) {
                if (removeValues.includes(tracked.items[itemIndex])) {
                    removedOffsets.push(itemIndex + removedOffsets.length);
                    tracked.items.splice(itemIndex, 1);
                    state.virtualLength--;
                } else {
                    itemIndex++;
                }
            }

            if (removedOffsets.length > 0) {
                this.adjustLaterInsertionsAfterRemoval(
                    state.trackedInsertions,
                    trackedIdx,
                    tracked,
                    previousLength,
                    removedOffsets
                );
            }
        }
    }

    private adjustLaterInsertionsAfterRemoval(
        trackedInsertions: TrackedInsertion<T>[],
        trackedIdx: number,
        tracked: TrackedInsertion<T>,
        previousLength: number,
        removedOffsets: number[]
    ): void {
        const removedCount = removedOffsets.length;

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

    private buildSpliceOperations(
        totalPrependCount: number,
        totalInsertionCount: number,
        totalAppendCount: number,
        survivingOriginalCount: number,
        trackedInsertions: TrackedInsertion<T>[],
        sortedRemovedDesc: number[] | undefined,
        sortedRemovedAsc: number[] | undefined
    ): SpliceOperation[] {
        const spliceOps: SpliceOperation[] = [];

        if (totalPrependCount > 0) {
            spliceOps.push({
                index: 0,
                deleteCount: 0,
                insertCount: totalPrependCount,
            });
        }

        if (sortedRemovedDesc && sortedRemovedDesc.length > 0) {
            let currentGroupStart = sortedRemovedDesc[0];
            let currentGroupCount = 1;

            for (let i = 1; i < sortedRemovedDesc.length; i++) {
                const currentIndex = sortedRemovedDesc[i];
                const prevIndex = sortedRemovedDesc[i - 1];

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

        if (trackedInsertions.length > 0) {
            for (const insertion of trackedInsertions) {
                const removalsBeforeInsertion = this.countRemovalsBeforeIndex(
                    sortedRemovedAsc,
                    totalPrependCount,
                    insertion.virtualIndex
                );

                const adjustedIndex = insertion.virtualIndex - removalsBeforeInsertion;

                spliceOps.push({
                    index: adjustedIndex,
                    deleteCount: 0,
                    insertCount: insertion.items.length,
                });
            }
        }

        if (totalAppendCount > 0) {
            spliceOps.push({
                index: totalPrependCount + survivingOriginalCount + totalInsertionCount,
                deleteCount: 0,
                insertCount: totalAppendCount,
            });
        }

        return spliceOps;
    }

    private countRemovalsBeforeIndex(
        sortedRemovedAsc: number[] | undefined,
        totalPrependCount: number,
        insertionVirtualIndex: number
    ): number {
        if (!sortedRemovedAsc || sortedRemovedAsc.length === 0) {
            return 0;
        }

        let removalsBeforeInsertion = 0;

        for (const removedIndex of sortedRemovedAsc) {
            const virtualIndexOfRemoval = removedIndex + totalPrependCount;
            if (virtualIndexOfRemoval < insertionVirtualIndex) {
                removalsBeforeInsertion++;
            } else {
                break;
            }
        }

        return removalsBeforeInsertion;
    }

    private resolveUpdatedIndices(
        totalPrependCount: number,
        totalInsertionCount: number,
        survivingOriginalCount: number,
        updateTracking: UpdateIndexTracking | undefined,
        sortedRemovedAsc: number[] | undefined,
        updatedOriginalIndices: Set<number>,
        trackedInsertions: TrackedInsertion<T>[]
    ): Set<number> {
        const updatedFinalIndices = new Set<number>();

        if (updateTracking) {
            for (const prependIdx of updateTracking.updatedPrependsIndices) {
                updatedFinalIndices.add(prependIdx);
            }
        }

        if (updatedOriginalIndices.size > 0) {
            const sortedUpdatedOriginals = Array.from(updatedOriginalIndices).sort((a, b) => a - b);
            let removalPtr = 0;

            for (const originalIdx of sortedUpdatedOriginals) {
                if (sortedRemovedAsc) {
                    while (removalPtr < sortedRemovedAsc.length && sortedRemovedAsc[removalPtr] < originalIdx) {
                        removalPtr++;
                    }
                }

                const removalsBeforeCount = sortedRemovedAsc ? removalPtr : 0;

                // Count insertions that occur before this original's position in the virtual array.
                // An original at index `originalIdx` has virtual index `originalIdx + totalPrependCount`.
                // Insertions with virtualIndex <= that position shift the original forward.
                const virtualPosOfOriginal = originalIdx + totalPrependCount;
                let insertionsBeforeCount = 0;
                for (const insertion of trackedInsertions) {
                    if (insertion.virtualIndex <= virtualPosOfOriginal) {
                        insertionsBeforeCount += insertion.items.length;
                    }
                }

                const finalIdx = originalIdx + totalPrependCount - removalsBeforeCount + insertionsBeforeCount;
                updatedFinalIndices.add(finalIdx);
            }
        }

        if (updateTracking) {
            const appendStartIdx = totalPrependCount + survivingOriginalCount + totalInsertionCount;
            for (const appendIdx of updateTracking.updatedAppendsIndices) {
                updatedFinalIndices.add(appendStartIdx + appendIdx);
            }

            // Handle updated insertions - need to calculate their actual final positions
            if (updateTracking.updatedInsertionsIndices.length > 0 && trackedInsertions.length > 0) {
                // Map from flat insertion index to the actual tracked insertion and offset within it
                let flatIdx = 0;
                for (const insertion of trackedInsertions) {
                    const removalsBeforeInsertion = this.countRemovalsBeforeIndex(
                        sortedRemovedAsc,
                        totalPrependCount,
                        insertion.virtualIndex
                    );
                    const insertionFinalIdx = insertion.virtualIndex - removalsBeforeInsertion;

                    for (let itemOffset = 0; itemOffset < insertion.items.length; itemOffset++) {
                        if (updateTracking.updatedInsertionsIndices.includes(flatIdx)) {
                            updatedFinalIndices.add(insertionFinalIdx + itemOffset);
                        }
                        flatIdx++;
                    }
                }
            }
        }

        return updatedFinalIndices;
    }
}
