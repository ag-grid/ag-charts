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

        return this.pendingTransactions.reduce((acc, { prepend, append, remove }) => {
            return acc + (prepend?.length ?? 0) + (append?.length ?? 0) - (remove?.length ?? 0);
        }, this.data.length);
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
            debug('DataRef.commitPendingTransactions() - final length', { afterLength: this.data.length });
        }
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
