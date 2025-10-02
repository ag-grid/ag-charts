import type { AgDataTransaction } from 'ag-charts-types';

import { Debug } from '../../util/debug';
import { applyRemoveByReference, mapToCanonicalReferences, normaliseRemoveReferences } from './transactionUtils';

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
 * dataSet.pendingTransactions.push({ append: [{ x: 3, y: 6 }] });
 * dataSet.commitPendingTransactions();
 * ```
 */
export class DataSet<T = unknown> {
    public data: T[];
    public pendingTransactions: DataTransaction<T>[];

    constructor(data: T[], pendingTransactions: DataTransaction<T>[] = []) {
        this.data = data;
        this.pendingTransactions = pendingTransactions;
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
     * Note: This assumes transactions don't have overlapping updates (i.e., removes
     * don't target items in append/prepend arrays). This is a safe assumption for
     * typical usage where transactions operate on existing data.
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
     * Transactions are applied in order: remove, then prepend, then append.
     */
    commitPendingTransactions(): void {
        if (!this.hasPendingTransactions()) {
            return;
        }

        const beforeLength = this.data.length;
        if (debug.check()) {
            debug('DataSet.commitPendingTransactions() - starting', { beforeLength });
        }

        for (const transaction of this.pendingTransactions) {
            const removeRefs = normaliseRemoveReferences(transaction.remove);
            if (removeRefs.length > 0) {
                const canonical = mapToCanonicalReferences(this.data, removeRefs);
                if (debug.check()) {
                    debug('DataSet.commitPendingTransactions() - removing rows', {
                        requested: removeRefs.length,
                        canonical: canonical.length,
                    });
                }
                applyRemoveByReference(this.data, canonical, true);
                // Note: mutate=true means this.data was modified in-place
            }

            const { prepend, append } = transaction;
            if (Array.isArray(prepend) && prepend.length) {
                this.data.unshift(...prepend);
            }
            if (Array.isArray(append) && append.length) {
                this.data.push(...append);
            }
        }

        this.pendingTransactions = [];

        if (debug.check()) {
            debug('DataSet.commitPendingTransactions() - final length', { afterLength: this.data.length });
        }
    }

    merge(data: T[]): DataSet<T> {
        return this.data === data ? this : new DataSet<T>(data);
    }
}

const FROZEN_DATA = Object.freeze([]) as unknown as unknown[];
const FROZEN_TRANSACTIONS = Object.freeze([]) as unknown as DataTransaction<unknown>[];

export const EMPTY_DATA_SET = Object.freeze(new DataSet<unknown>(FROZEN_DATA, FROZEN_TRANSACTIONS));
