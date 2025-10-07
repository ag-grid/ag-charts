import type { AgDataTransaction } from 'ag-charts-types';

import { Debug } from '../../util/debug';
import { applyRemoveByReference, mapToCanonicalReferences, normaliseRemoveReferences } from './transactionUtils';

type DataTransaction<T> = AgDataTransaction<T>;

const debug = Debug.create(true, 'data-ref');
const dataRefLookup = new WeakMap<readonly unknown[], DataRef<any>>();

export class DataRef<T = unknown> {
    public data: T[];
    public pendingTransactions: DataTransaction<T>[];

    constructor(data: T[], pendingTransactions: DataTransaction<T>[] = []) {
        this.data = data;
        this.pendingTransactions = pendingTransactions;

        dataRefLookup.set(this.data, this);
    }

    static wrap<T>(data?: T[]): DataRef<T> | undefined {
        if (data == null) return undefined;
        return new DataRef<T>(data);
    }

    static empty<T = unknown>(): DataRef<T> {
        return new DataRef<T>([]);
    }

    static isDataRef(value: unknown): value is DataRef<any> {
        return value instanceof DataRef;
    }

    netSize(): number {
        if (!this.hasPendingTransactions()) {
            return this.data.length;
        }

        return this.previewPendingTransactions().length;
    }

    hasPendingTransactions(): boolean {
        return this.pendingTransactions.length > 0;
    }

    commitPendingTransactions(): void {
        if (!this.hasPendingTransactions()) {
            return;
        }

        const beforeLength = this.data.length;
        if (debug.check()) {
            debug('DataRef.commitPendingTransactions() - starting', { beforeLength });
        }

        for (const transaction of this.pendingTransactions) {
            const removeRefs = normaliseRemoveReferences(transaction.remove);
            if (removeRefs.length > 0) {
                const canonical = mapToCanonicalReferences(this.data, removeRefs);
                if (debug.check()) {
                    debug('DataRef.commitPendingTransactions() - removing rows', {
                        requested: removeRefs.length,
                        canonical: canonical.length,
                    });
                }
                applyRemoveByReference(this.data, canonical);
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
            debug('DataRef.commitPendingTransactions() - final length', { afterLength: this.data.length });
        }
    }

    previewPendingTransactions(): T[] {
        if (!this.hasPendingTransactions()) {
            return this.data;
        }

        if (!Array.isArray(this.data)) {
            throw new Error('AG Charts - dataRef preview expects "data" to be an array.');
        }

        if (!Array.isArray(this.pendingTransactions)) {
            throw new Error('AG Charts - dataRef preview expects "pendingTransactions" to be an array.');
        }

        let preview = this.data;
        let mutated = false;

        if (debug.check()) {
            debug('DataRef.previewPendingTransactions() - starting', { baseLength: this.data.length });
        }

        for (const transaction of this.pendingTransactions) {
            if (transaction == null || typeof transaction !== 'object') {
                throw new Error('AG Charts - invalid data transaction encountered.');
            }

            const removeRefs = normaliseRemoveReferences(transaction.remove);
            if (removeRefs.length > 0) {
                if (!mutated) {
                    preview = this.data.slice();
                    mutated = true;
                }
                const canonical = mapToCanonicalReferences(preview, removeRefs);
                if (debug.check()) {
                    debug('DataRef.previewPendingTransactions() - removing rows', {
                        requested: removeRefs.length,
                        canonical: canonical.length,
                    });
                }
                applyRemoveByReference(preview, canonical);
            }

            const { prepend, append } = transaction;

            if (prepend != null) {
                if (!Array.isArray(prepend)) {
                    throw new Error('AG Charts - data transaction "prepend" must be an array.');
                }
                if (prepend.length) {
                    if (!mutated) {
                        preview = this.data.slice();
                        mutated = true;
                    }
                    preview.unshift(...prepend);
                }
            }

            if (append != null) {
                if (!Array.isArray(append)) {
                    throw new Error('AG Charts - data transaction "append" must be an array.');
                }
                if (append.length) {
                    if (!mutated) {
                        preview = this.data.slice();
                        mutated = true;
                    }
                    preview.push(...append);
                }
            }
        }

        if (debug.check() && mutated) {
            debug('DataRef.previewPendingTransactions() - preview length', { previewLength: preview.length });
        }

        return mutated ? preview : this.data;
    }

    merge(data: T[]): DataRef<T> {
        return this.data === data ? this : new DataRef<T>(data);
    }
}

export function getDataRefForData(data: readonly unknown[] | undefined): DataRef<any> | undefined {
    if (!data) return undefined;
    return dataRefLookup.get(data);
}

const FROZEN_DATA = Object.freeze([]) as unknown as unknown[];
const FROZEN_TRANSACTIONS = Object.freeze([]) as unknown as DataTransaction<unknown>[];

export const EMPTY_DATA_REF = Object.freeze(new DataRef<unknown>(FROZEN_DATA, FROZEN_TRANSACTIONS));

/** @deprecated Use `DataRef.wrap()` instead. */
export function wrapRawData(): undefined;
export function wrapRawData(data: undefined): undefined;
export function wrapRawData<T>(data: T[]): DataRef<T>;
export function wrapRawData<T>(data?: T[]): DataRef<T> | undefined {
    return DataRef.wrap(data);
}
