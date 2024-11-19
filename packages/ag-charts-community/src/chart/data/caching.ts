import { arraysEqual } from '../../util/array';
import { objectsEqual } from '../../util/object';
import type { DataModel, DataModelOptions, PropertyDefinition, UngroupedData } from './dataModel';

export interface CachedDataItem<D extends object, K extends keyof D & string = keyof D & string> {
    ids: string[];
    opts: DataModelOptions<K, any>;
    data: D[];
    dataModel: DataModel<any, any, any>;
    processedData: UngroupedData<any> | undefined;
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

function propsEqual(a: PropertyDefinition<any>[], b: PropertyDefinition<any>[]) {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i += 1) {
        const { idsMap: idsMapA, ...propA } = a[i];
        const { idsMap: idsMapB, ...propB } = b[i];
        if (!objectsEqual(propA, propB) || !idsMapEqual(idsMapA, idsMapB)) return false;
    }

    return true;
}

function optsEqual(a: DataModelOptions<any, any>, b: DataModelOptions<any, any>) {
    const { props: propsA, ...restA } = a;
    const { props: propsB, ...restB } = b;
    return objectsEqual(restA, restB) && propsEqual(propsA, propsB);
}

export function canReuseCachedData<D extends object, K extends keyof D & string = keyof D & string>(
    cachedDataItem: CachedDataItem<any, any>,
    data: D[],
    ids: string[],
    opts: DataModelOptions<K, any>
) {
    return data === cachedDataItem.data && arraysEqual(ids, cachedDataItem.ids) && optsEqual(opts, cachedDataItem.opts);
}
