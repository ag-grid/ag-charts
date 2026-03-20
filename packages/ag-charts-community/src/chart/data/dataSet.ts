import { Logger } from 'ag-charts-core';

import {
    DataChangeDescription,
    type IndexTransformationMap,
    type SpliceOperation,
    contiguousRemovalCountAtStart,
} from './dataChangeDescription';

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
    /** Items to remove. Matched by referential equality, or by `dataIdKey` when set on the DataSet. */
    remove?: T[];
    /** Items to update. Matched by referential equality, or by `dataIdKey` when set on the DataSet. When matched by ID, the item replaces the existing datum. */
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

export interface TransactionCollectionState<T> {
    prependsList: T[][];
    appendsList: T[][];
    insertionsList: T[][];
    trackedInsertions: TrackedInsertion<T>[];
    removedOriginalIndices: Set<number>;
    updatedOriginalIndices: Set<number>;
    virtualLength: number;
    updateTracking?: UpdateIndexTracking;
    pendingReplacements?: Map<string | number, T>;
}

interface TransactionEffects<T> {
    prependsList: T[][];
    appendsList: T[][];
    insertionsList: T[][];
    trackedInsertions: TrackedInsertion<T>[];
    removedOriginalIndices: Set<number>;
    updatedOriginalIndices: Set<number>;
    updateTracking?: UpdateIndexTracking;
    pendingReplacements?: Map<string | number, T>;
}

/**
 * Manages transactional updates to an array of data with optimized batch processing.
 * Transactions are queued and can be applied in batch for efficient data transformations.
 */
export class DataSet<T = unknown> {
    private pendingTransactions: DataSetTransaction<T>[] = [];
    private cachedChangeDescription: DataChangeDescription | undefined;
    private cachedPendingReplacements: Map<string | number, T> | undefined;
    private itemToIndexCache: Map<T, number> | undefined;
    protected idToIndexCache: Map<string | number, number> | undefined;
    private dataIdKeyValidated = false;

    constructor(
        public data: T[],
        public readonly dataIdKey?: string
    ) {}

    /**
     * Creates an empty DataSet.
     */
    static empty<U = unknown>(dataIdKey?: string): DataSet<U> {
        return new DataSet<U>([], dataIdKey);
    }

    /**
     * Wraps existing data in a DataSet.
     */
    static wrap<U = unknown>(data: U[], dataIdKey?: string): DataSet<U> {
        return new DataSet<U>(data, dataIdKey);
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
        return new DataSet([...this.data], this.dataIdKey);
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
                // Append to end (default behaviour)
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

    /** Validates dataIdKey on first commit so duplicate/missing-key warnings fire on initial load. */
    private validateDataIdKey(): void {
        if (this.dataIdKey != null && this.data.length > 0) {
            this.getIdToIndexMap();
        }
        this.dataIdKeyValidated = true;
    }

    /** Applies all pending transactions to the data array. */
    commitPendingTransactions(): boolean {
        if (!this.dataIdKeyValidated) {
            this.validateDataIdKey();
        }

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

        // Apply pending replacements for ID-based updates using final indices.
        // Only original-data updates populate pendingReplacements (via collectUpdatedOriginalIndicesById);
        // prepend/append/insertion updates are applied in-place during collectUpdatedIndicesFromGroupsById.
        if (this.cachedPendingReplacements && this.cachedPendingReplacements.size > 0) {
            const { updatedIndices } = changeDescription.indexMap;
            for (const finalIdx of updatedIndices) {
                const id = this.getIdValue(this.data[finalIdx]);
                if (id !== undefined && this.cachedPendingReplacements.has(id)) {
                    this.data[finalIdx] = this.cachedPendingReplacements.get(id)!;
                }
            }
        }

        this.pendingTransactions = [];
        this.cachedChangeDescription = undefined;
        this.cachedPendingReplacements = undefined;

        // Maintain index cache incrementally where possible, otherwise invalidate.
        this.updateItemToIndexCache(changeDescription, appendedValues, prependedValues, insertionValues);
        this.updateIdToIndexCache(changeDescription, appendedValues, prependedValues, insertionValues);

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

        // When dataIdKey is set, reference-based cache is not useful — invalidate.
        if (this.dataIdKey) {
            this.itemToIndexCache = undefined;
            return;
        }

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

        const contiguousRemovalCount = contiguousRemovalCountAtStart(removedIndices);
        if (hasRemovals && contiguousRemovalCount === 0) {
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

    /** Updates id→index cache incrementally, or invalidates for complex changes. */
    private updateIdToIndexCache(
        changeDescription: DataChangeDescription,
        appendedValues: T[],
        prependedValues: T[],
        insertionValues: T[]
    ): void {
        if (!this.idToIndexCache) return;

        const { indexMap } = changeDescription;
        const { totalPrependCount, totalAppendCount, removedIndices } = indexMap;
        const hasRemovals = removedIndices.size > 0;
        const hasArbitraryInsertions = insertionValues.length > 0;

        // Update-only: no index changes, cache is still valid.
        if (!hasRemovals && totalPrependCount === 0 && totalAppendCount === 0 && !hasArbitraryInsertions) {
            return;
        }

        // Complex cases: invalidate and let lazy rebuild handle it.
        if (hasArbitraryInsertions) {
            this.idToIndexCache = undefined;
            return;
        }

        const contiguousRemovalCount = contiguousRemovalCountAtStart(removedIndices);
        if (hasRemovals && contiguousRemovalCount === 0) {
            this.idToIndexCache = undefined;
            return;
        }

        // Incremental maintenance: shift indices, remove deleted entries, add new entries.
        // Safe to mutate Map during for..of: delete of current/visited keys is spec-safe,
        // set of existing keys updates value without affecting iteration order.
        const idCache = this.idToIndexCache;
        const indexShift = totalPrependCount - contiguousRemovalCount;

        if (indexShift !== 0) {
            for (const [id, oldIndex] of idCache) {
                if (removedIndices.has(oldIndex)) {
                    idCache.delete(id);
                } else {
                    idCache.set(id, oldIndex + indexShift);
                }
            }
        } else if (hasRemovals) {
            for (const [id, oldIndex] of idCache) {
                if (removedIndices.has(oldIndex)) {
                    idCache.delete(id);
                }
            }
        }

        // Add entries for prepended items (reverse to preserve "first occurrence" rule).
        // Prepended items have lower indices than shifted originals, so must override existing mappings.
        for (let i = prependedValues.length - 1; i >= 0; i--) {
            const id = this.getIdValue(prependedValues[i]);
            if (id !== undefined) {
                idCache.set(id, i);
            }
        }

        // Add entries for appended items.
        const appendStartIndex = indexMap.finalLength - totalAppendCount;
        for (let i = 0; i < appendedValues.length; i++) {
            const id = this.getIdValue(appendedValues[i]);
            if (id !== undefined && !idCache.has(id)) {
                idCache.set(id, appendStartIndex + i);
            }
        }
    }

    clearPendingTransactions(): number {
        const count = this.pendingTransactions.length;
        this.pendingTransactions = [];
        this.cachedChangeDescription = undefined;
        this.cachedPendingReplacements = undefined;
        return count;
    }

    getPendingTransactions(): DataSetTransaction<T>[] {
        return [...this.pendingTransactions];
    }

    /** Custom JSON serialization (avoids snapshot bloat). */
    toJSON(): T[] {
        return this.data;
    }

    /** Builds a DataChangeDescription from pending transactions. */
    getChangeDescription(): DataChangeDescription | undefined {
        if (!this.hasPendingTransactions()) {
            return undefined;
        }

        // Return cached version if available
        if (this.cachedChangeDescription) {
            return this.cachedChangeDescription;
        }

        const { indexMap, prependValues, appendValues, insertionValues, pendingReplacements } = this.buildIndexMap();
        const changeDescription = new DataChangeDescription(indexMap, {
            prependValues,
            appendValues,
            insertionValues,
        });

        this.cachedChangeDescription = changeDescription;
        this.cachedPendingReplacements = pendingReplacements;
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
        pendingReplacements?: Map<string | number, T>;
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
            pendingReplacements: effects.pendingReplacements,
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
            pendingReplacements: state.pendingReplacements,
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

        if (this.dataIdKey) {
            this.applyRemovalsById(remove, state);
        } else {
            this.applyRemovalsByRef(remove, state);
        }
    }

    private applyRemovalsByRef(remove: T[], state: TransactionCollectionState<T>): void {
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

        if (toRemove.size > 0) {
            Logger.warnOnce(
                'applyTransaction() remove includes items not present in current data; ignoring missing items.'
            );
        }
    }

    protected applyRemovalsById(remove: T[], state: TransactionCollectionState<T>): void {
        const idsToRemove = new Set<string | number>();
        for (const item of remove) {
            const id = this.getIdValue(item);
            if (id === undefined) {
                Logger.warnOnce(`applyTransaction() remove item is missing '${this.dataIdKey}' field; ignoring.`);
            } else {
                idsToRemove.add(id);
            }
        }

        if (idsToRemove.size === 0) return;

        this.removeFromGroupsById(state.prependsList, idsToRemove);

        if (idsToRemove.size > 0) {
            this.removeFromGroupsById(state.insertionsList, idsToRemove);
        }

        if (state.trackedInsertions.length > 0) {
            this.removeFromTrackedInsertionsById(remove, state);
        }

        if (idsToRemove.size > 0) {
            this.removeFromGroupsById(state.appendsList, idsToRemove);
        }

        if (idsToRemove.size > 0) {
            const idMap = this.getIdToIndexMap();
            for (const id of idsToRemove) {
                const idx = idMap.get(id);
                if (idx !== undefined) {
                    state.removedOriginalIndices.add(idx);
                    state.virtualLength--;
                    idsToRemove.delete(id);
                }
            }
        }

        if (idsToRemove.size > 0) {
            Logger.warnOnce(
                'applyTransaction() remove includes items not present in current data; ignoring missing items.'
            );
        }
    }

    private applyUpdates(update: T[] | undefined, state: TransactionCollectionState<T>): void {
        if (!Array.isArray(update) || update.length === 0) {
            return;
        }

        if (this.dataIdKey) {
            this.applyUpdatesById(update, state);
        } else {
            this.applyUpdatesByRef(update, state);
        }
    }

    private applyUpdatesByRef(update: T[], state: TransactionCollectionState<T>): void {
        const toUpdate = new Set(update);
        const updatedPrependsIndices = this.collectUpdatedIndicesFromGroups(state.prependsList, toUpdate);
        const updatedInsertionsIndices =
            toUpdate.size > 0 ? this.collectUpdatedIndicesFromGroups(state.insertionsList, toUpdate) : [];
        const updatedAppendsIndices =
            toUpdate.size > 0 ? this.collectUpdatedIndicesFromGroups(state.appendsList, toUpdate) : [];

        if (toUpdate.size > 0) {
            this.collectUpdatedOriginalIndices(toUpdate, state);
        }

        state.updateTracking = {
            updatedPrependsIndices,
            updatedAppendsIndices,
            updatedInsertionsIndices,
        };

        if (toUpdate.size > 0) {
            Logger.warnOnce(
                'applyTransaction() update includes items not present in current data; ignoring missing items.'
            );
        }
    }

    private applyUpdatesById(update: T[], state: TransactionCollectionState<T>): void {
        const toUpdate = new Map<string | number, T>();
        for (const item of update) {
            const id = this.getIdValue(item);
            if (id === undefined) {
                Logger.warnOnce(`applyTransaction() update item is missing '${this.dataIdKey}' field; ignoring.`);
            } else {
                toUpdate.set(id, item);
            }
        }

        if (toUpdate.size === 0) return;

        const updatedPrependsIndices = this.collectUpdatedIndicesFromGroupsById(state.prependsList, toUpdate);
        const updatedInsertionsIndices =
            toUpdate.size > 0 ? this.collectUpdatedIndicesFromGroupsById(state.insertionsList, toUpdate) : [];
        const updatedAppendsIndices =
            toUpdate.size > 0 ? this.collectUpdatedIndicesFromGroupsById(state.appendsList, toUpdate) : [];

        if (toUpdate.size > 0) {
            this.collectUpdatedOriginalIndicesById(toUpdate, state);
        }

        state.updateTracking = {
            updatedPrependsIndices,
            updatedAppendsIndices,
            updatedInsertionsIndices,
        };

        if (toUpdate.size > 0) {
            Logger.warnOnce(
                'applyTransaction() update includes items not present in current data; ignoring missing items.'
            );
        }
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

    /** Extracts the ID value from a datum; returns `undefined` if missing or not a string/number. */
    protected getIdValue(item: T): string | number | undefined {
        if (this.dataIdKey == null || item == null || typeof item !== 'object') return undefined;
        const value = (item as any)[this.dataIdKey];
        if (typeof value === 'string' || (typeof value === 'number' && !Number.isNaN(value))) return value;
        return undefined;
    }

    /** Lazy ID→index map for O(1) lookups when `dataIdKey` is set. */
    protected getIdToIndexMap(): Map<string | number, number> {
        if (this.idToIndexCache === undefined) {
            this.idToIndexCache = new Map();
            for (let i = 0; i < this.data.length; i++) {
                const id = this.getIdValue(this.data[i]);
                if (id === undefined) continue;
                if (this.idToIndexCache.has(id)) {
                    Logger.warnOnce(
                        `dataIdKey '${this.dataIdKey}' has duplicate value '${id}'; first occurrence used.`
                    );
                } else {
                    this.idToIndexCache.set(id, i);
                }
            }
            if (this.idToIndexCache.size === 0 && this.data.length > 0) {
                Logger.warnOnce(`dataIdKey '${this.dataIdKey}' was not found on any data item.`);
            }
        }
        return this.idToIndexCache;
    }

    /** Removes items from groups by matching their ID values against a set of IDs. */
    private removeFromGroupsById(groups: T[][], idsToRemove: Set<string | number>): void {
        for (const group of groups) {
            let i = 0;
            while (i < group.length && idsToRemove.size > 0) {
                const id = this.getIdValue(group[i]);
                if (id !== undefined && idsToRemove.has(id)) {
                    idsToRemove.delete(id);
                    group.splice(i, 1);
                } else {
                    i++;
                }
            }
            if (idsToRemove.size === 0) break;
        }
    }

    /** Collects updated indices from groups by matching their ID values against a map of IDs to new datums. */
    private collectUpdatedIndicesFromGroupsById(groups: T[][], toUpdate: Map<string | number, T>): number[] {
        if (toUpdate.size === 0 || groups.length === 0) return [];

        const updatedIndices: number[] = [];
        let flatIndex = 0;

        for (const group of groups) {
            for (let i = 0; i < group.length; i++) {
                const id = this.getIdValue(group[i]);
                if (id !== undefined && toUpdate.has(id)) {
                    group[i] = toUpdate.get(id)!;
                    updatedIndices.push(flatIndex);
                    toUpdate.delete(id);
                }
                flatIndex++;
            }
            if (toUpdate.size === 0) break;
        }

        return updatedIndices;
    }

    /** Collects updated original indices by ID, storing replacements (keyed by ID) in state for commit. */
    protected collectUpdatedOriginalIndicesById(
        toUpdate: Map<string | number, T>,
        state: TransactionCollectionState<T>
    ): void {
        const idMap = this.getIdToIndexMap();

        for (const [id, newDatum] of toUpdate) {
            const idx = idMap.get(id);
            if (idx !== undefined && !state.removedOriginalIndices.has(idx)) {
                state.updatedOriginalIndices.add(idx);
                state.pendingReplacements ??= new Map();
                state.pendingReplacements.set(id, newDatum);
                toUpdate.delete(id);
            }
        }
    }

    private collectUpdatedOriginalIndices(toUpdate: Set<T>, state: TransactionCollectionState<T>): void {
        const indexMap = this.getItemToIndexMap();

        for (const item of toUpdate) {
            const idx = indexMap.get(item);
            if (idx !== undefined && !state.removedOriginalIndices.has(idx)) {
                state.updatedOriginalIndices.add(idx);
                toUpdate.delete(item);
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

    protected removeFromTrackedInsertionsById(removeValues: T[], state: TransactionCollectionState<T>): void {
        const idsToRemove = new Set<string | number>();
        for (const item of removeValues) {
            const id = this.getIdValue(item);
            if (id !== undefined) idsToRemove.add(id);
        }
        if (idsToRemove.size === 0) return;

        for (let trackedIdx = 0; trackedIdx < state.trackedInsertions.length; trackedIdx++) {
            const tracked = state.trackedInsertions[trackedIdx];
            const previousLength = tracked.items.length;
            const removedOffsets: number[] = [];
            let itemIndex = 0;

            while (itemIndex < tracked.items.length) {
                const id = this.getIdValue(tracked.items[itemIndex]);
                if (id !== undefined && idsToRemove.has(id)) {
                    removedOffsets.push(itemIndex + removedOffsets.length);
                    tracked.items.splice(itemIndex, 1);
                    state.virtualLength--;
                    idsToRemove.delete(id);
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

            if (idsToRemove.size === 0) break;
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
