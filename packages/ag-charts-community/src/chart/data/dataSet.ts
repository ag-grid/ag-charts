import type { AgDataTransaction } from 'ag-charts-types';

import { Debug } from '../../util/debug';
import { DataChangeDescription, type IndexTransformationMap, type SpliceOperation } from './dataChangeDescription';

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
            if (Array.isArray(transaction.remove)) {
                netLength -= transaction.remove.length;
            }
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

        const prependValues = changeDesc.getPrependedValues<T>();
        const appendValues = changeDesc.getAppendedValues<T>();

        changeDesc.applyToArray(this.data, (destIndex) => {
            if (destIndex < totalPrependCount) {
                return prependValues[destIndex];
            }
            const appendStartIndex = finalLength - totalAppendCount;
            if (totalAppendCount > 0 && destIndex >= appendStartIndex) {
                return appendValues[destIndex - appendStartIndex];
            }
            throw new Error(`Unexpected insertion at index ${destIndex}`);
        });

        this.pendingTransactions.length = 0;
        // Keep the cached change description so consumers can see what changes were applied
        // It will be invalidated when new transactions are added

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
        // Return cached result if available (may be from previously committed transactions)
        if (this.cachedChangeDescription != null) {
            return this.cachedChangeDescription;
        }

        if (!this.hasPendingTransactions()) {
            return undefined;
        }

        // Build the index transformation map
        const { indexMap, prependValues, appendValues } = this.buildIndexMap();

        // Create the change description instance
        const changeDescription = new DataChangeDescription(indexMap, {
            prependValues,
            appendValues,
        });

        this.cachedChangeDescription = changeDescription;
        return changeDescription;
    }

    /**
     * Builds the index transformation map by sequentially applying all pending transactions.
     */
    private buildIndexMap(): {
        indexMap: IndexTransformationMap;
        prependValues: T[];
        appendValues: T[];
    } {
        const originalLength = this.data.length;

        type Entry = {
            kind: 'original' | 'prepend' | 'append';
            value: T;
            originalIndex?: number;
        };

        const entries: Entry[] = this.data.map((value, index) => ({
            kind: 'original',
            value,
            originalIndex: index,
        }));

        const removedOriginalIndices = new Set<number>();

        for (const transaction of this.pendingTransactions) {
            const { prepend, append, remove } = transaction;

            if (Array.isArray(prepend) && prepend.length > 0) {
                const prependEntries = prepend.map(
                    (value): Entry => ({
                        kind: 'prepend',
                        value,
                    })
                );
                entries.unshift(...prependEntries);
            }

            if (Array.isArray(append) && append.length > 0) {
                const appendEntries = append.map(
                    (value): Entry => ({
                        kind: 'append',
                        value,
                    })
                );
                entries.push(...appendEntries);
            }

            if (Array.isArray(remove) && remove.length > 0) {
                const removeSet = new Set(remove);
                let writeIndex = 0;
                for (const element of entries) {
                    const entry = element;
                    if (removeSet.has(entry.value)) {
                        if (entry.kind === 'original' && entry.originalIndex != null) {
                            removedOriginalIndices.add(entry.originalIndex);
                        }
                        continue;
                    }

                    entries[writeIndex++] = entry;
                }
                entries.length = writeIndex;
            }
        }

        const survivingPrepends: T[] = [];
        const survivingAppends: T[] = [];
        let survivingOriginalCount = 0;

        for (const entry of entries) {
            if (entry.kind === 'prepend') {
                survivingPrepends.push(entry.value);
            } else if (entry.kind === 'append') {
                survivingAppends.push(entry.value);
            } else if (entry.kind === 'original') {
                survivingOriginalCount++;
            }
        }

        const totalPrependCount = survivingPrepends.length;
        const totalAppendCount = survivingAppends.length;
        const finalLength = entries.length;

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
            for (const originalIndex of sortedRemovals) {
                spliceOps.push({
                    index: originalIndex + totalPrependCount,
                    deleteCount: 1,
                    insertCount: 0,
                });
            }
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
