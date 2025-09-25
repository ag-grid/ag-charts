import { arraysEqual } from 'ag-charts-core';

import { objectsEqual } from '../../util/object';
import type { DataModel, DataModelOptions, ProcessedData, PropertyDefinition } from './dataModel';
import type { DataRef } from './dataRef';

interface CachedDataItem<D extends object, K extends keyof D & string = keyof D & string> {
    ids: string[];
    opts: DataModelOptions<K, any>;
    dataRef: DataRef<D>;
    dataModel: DataModel<any, any, any>;
    processedData: ProcessedData<any> | undefined;
    dataLength: number; // Track data array length at cache creation time
}

export type CachedData = CachedDataItem<any, any>[];

function setsEqual<T>(a: Set<T>, b: Set<T>) {
    if (a.size !== b.size) return false;

    for (const value of a) {
        if (!b.has(value)) return false;
    }

    return true;
}

function idsMapEqual(a: Map<string, Set<string>> | undefined, b: Map<string, Set<string>> | undefined) {
    if (a == null || b == null) return a === b;
    if (a.size !== b.size) return false;

    for (const [key, aValue] of a) {
        const bValue = b.get(key);
        if (bValue == null) return false;
        if (!setsEqual(aValue, bValue)) return false;
    }

    return true;
}

type OptionalProps = {
    data?: unknown[];
    scopes?: string[];
};

function propsEqual(
    a: (PropertyDefinition<any, true> & OptionalProps)[],
    b: (PropertyDefinition<any, true> & OptionalProps)[]
) {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i += 1) {
        const { type: typeA, idsMap: idsMapA, scopes: scopesA, data: dataA, ...propA } = a[i];
        const { type: typeB, idsMap: idsMapB, scopes: scopesB, data: dataB, ...propB } = b[i];
        if (typeA !== typeB) return false;
        if (scopesA && scopesB && !arraysEqual(scopesA, scopesB)) return false;
        if (dataA && dataB && dataA !== dataB) return false;
        if (!objectsEqual(propA, propB) || !idsMapEqual(idsMapA, idsMapB)) return false;
    }

    return true;
}

function optsEqual(a: DataModelOptions<any, any, true>, b: DataModelOptions<any, any, true>) {
    const { props: propsA, ...restA } = a;
    const { props: propsB, ...restB } = b;
    return objectsEqual(restA, restB) && propsEqual(propsA, propsB);
}

export function canReuseCachedData<D extends object, K extends keyof D & string = keyof D & string>(
    cachedDataItem: CachedDataItem<any, any>,
    dataRef: DataRef<D>,
    ids: string[],
    opts: DataModelOptions<K, any>
) {
    // Simple check: can only reuse cache if it's the exact same DataRef object
    // This works because:
    // 1. For updateDelta, we always create a new DataRef (even with same array)
    // 2. For applyTransaction, the DataRef stays the same but has pending transactions
    // 3. When commitPendingTransactions is called, it mutates the data array in-place
    const sameDataRef = dataRef === cachedDataItem.dataRef;

    // Also check if the data hasn't been modified (for transaction case)
    const dataUnmodified = sameDataRef && cachedDataItem.dataRef.data.length === cachedDataItem.dataLength;

    return (
        sameDataRef && dataUnmodified && arraysEqual(ids, cachedDataItem.ids) && optsEqual(opts, cachedDataItem.opts)
    );
}
