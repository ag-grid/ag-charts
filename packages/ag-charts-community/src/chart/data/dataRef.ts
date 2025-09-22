import type { AgDataTransaction } from 'ag-charts-types';

export interface DataRef<T = unknown> {
    data: T[];
    pendingTransactions: AgDataTransaction[];
}

export const EMPTY_DATA_REF = Object.freeze({
    data: Object.freeze([]),
    pendingTransactions: Object.freeze([]),
}) as unknown as DataRef<unknown>;

export function calculateNetDataSize(dataRef: DataRef) {
    if (dataRef.pendingTransactions.length === 0) return dataRef.data.length;

    let netDataSize = dataRef.data.length;
    for (const transaction of dataRef.pendingTransactions) {
        netDataSize += transaction.append?.length ?? 0;
    }

    return netDataSize;
}

export function applyTransaction(dataRef: DataRef) {
    for (const transaction of dataRef.pendingTransactions) {
        dataRef.data.push(...(transaction.append ?? []));
    }
    dataRef.pendingTransactions = [];
}

export function mergeRawData<T>(dataRef: DataRef<T>, data: T[]): DataRef<T> {
    // Same data-set, so pending transactions are still relevant.
    if (dataRef.data === data) return dataRef;

    // New data-set, so pending transactions are not relevant.
    return {
        data: data,
        pendingTransactions: [],
    };
}

export function isDataRef(dataRef: unknown): dataRef is DataRef {
    return (
        typeof dataRef === 'object' &&
        dataRef != null &&
        Array.isArray((dataRef as DataRef).data) &&
        Array.isArray((dataRef as DataRef).pendingTransactions)
    );
}

export function wrapRawData(): undefined;
export function wrapRawData(data: undefined): undefined;
export function wrapRawData<T>(data: T[]): DataRef<T>;
export function wrapRawData<T>(data?: T[]): DataRef<T> | undefined {
    if (data == null) return undefined;
    return {
        data,
        pendingTransactions: [],
    };
}
