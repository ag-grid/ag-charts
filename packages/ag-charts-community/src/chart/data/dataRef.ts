import type { AgDataTransaction } from 'ag-charts-types';

type DataTransaction<T> = AgDataTransaction<T>;

export class DataRef<T = unknown> {
    public data: T[];
    public pendingTransactions: DataTransaction<T>[];

    constructor(data: T[], pendingTransactions: DataTransaction<T>[] = []) {
        this.data = data;
        this.pendingTransactions = pendingTransactions;
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
        let size = this.data.length;
        for (const transaction of this.pendingTransactions) {
            size += transaction.append?.length ?? 0;
            size += transaction.prepend?.length ?? 0;
        }
        return size;
    }

    hasPendingTransactions(): boolean {
        return this.pendingTransactions.length > 0;
    }

    commitPendingTransactions(): void {
        if (!this.hasPendingTransactions()) {
            return;
        }

        for (const transaction of this.pendingTransactions) {
            const { prepend, append } = transaction;
            if (Array.isArray(prepend) && prepend.length) {
                this.data.unshift(...prepend);
            }
            if (Array.isArray(append) && append.length) {
                this.data.push(...append);
            }
        }

        this.pendingTransactions = [];
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

        const prepended: T[] = [];
        const appended: T[] = [];

        for (const transaction of this.pendingTransactions) {
            if (transaction == null || typeof transaction !== 'object') {
                throw new Error('AG Charts - invalid data transaction encountered.');
            }

            const { prepend, append } = transaction;

            if (prepend != null) {
                if (!Array.isArray(prepend)) {
                    throw new Error('AG Charts - data transaction "prepend" must be an array.');
                }
                if (prepend.length) {
                    prepended.unshift(...prepend);
                }
            }

            if (append != null) {
                if (!Array.isArray(append)) {
                    throw new Error('AG Charts - data transaction "append" must be an array.');
                }
                if (append.length) {
                    appended.push(...append);
                }
            }
        }

        if (prepended.length === 0 && appended.length === 0) {
            return this.data;
        }

        return [...prepended, ...this.data, ...appended];
    }

    merge(data: T[]): DataRef<T> {
        return this.data === data ? this : new DataRef<T>(data);
    }
}

const FROZEN_DATA = Object.freeze([]) as unknown as unknown[];
const FROZEN_TRANSACTIONS = Object.freeze([]) as unknown as DataTransaction<unknown>[];

export const EMPTY_DATA_REF = Object.freeze(new DataRef<unknown>(FROZEN_DATA, FROZEN_TRANSACTIONS));

/** @deprecated Use `dataRef.netSize()` instead. */
export function calculateNetDataSize(dataRef: DataRef) {
    return dataRef.netSize();
}

/** @deprecated Use `dataRef.commitPendingTransactions()` instead. */
export function applyTransaction(dataRef: DataRef) {
    dataRef.commitPendingTransactions();
}

/** @deprecated Use `dataRef.merge(data)` instead. */
export function mergeRawData<T>(dataRef: DataRef<T>, data: T[]): DataRef<T> {
    return dataRef.merge(data);
}

/** @deprecated Use `DataRef.isDataRef()` instead. */
export function isDataRef(dataRef: unknown): dataRef is DataRef {
    return DataRef.isDataRef(dataRef);
}

/** @deprecated Use `DataRef.wrap()` instead. */
export function wrapRawData(): undefined;
export function wrapRawData(data: undefined): undefined;
export function wrapRawData<T>(data: T[]): DataRef<T>;
export function wrapRawData<T>(data?: T[]): DataRef<T> | undefined {
    return DataRef.wrap(data);
}
