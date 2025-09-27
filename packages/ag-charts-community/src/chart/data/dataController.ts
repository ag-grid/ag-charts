import { Logger, getWindow } from 'ag-charts-core';

import { Debug } from '../../util/debug';
import type { ChartMode } from '../chartMode';
import { type CachedData, canReuseCachedData } from './caching';
import {
    DataModel,
    type DataModelOptions,
    type DatumPropertyDefinition,
    type ProcessedData,
    type PropertyDefinition,
    type UngroupedData,
} from './dataModel';
import type { DataRef } from './dataRef';

interface RequestedProcessing<
    D extends object,
    K extends keyof D & string = keyof D & string,
    G extends boolean | undefined = undefined,
> {
    id: string;
    opts: DataModelOptions<K, any, false>;
    data: D[];
    dataRef?: DataRef<D>;
    resolve: (result: Result<D, K, G>) => void;
    reject: (reason?: any) => void;
}

interface MergedRequests<
    D extends object,
    K extends keyof D & string = keyof D & string,
    G extends boolean | undefined = undefined,
> {
    ids: string[];
    opts: DataModelOptions<K, any, true>;
    data: D[];
    resolves: ((result: Result<D, K, G>) => void)[];
    rejects: ((reason?: any) => void)[];
}

type Result<
    D extends object,
    K extends keyof D & string = keyof D & string,
    G extends boolean | undefined = undefined,
> = { processedData: ProcessedData<D>; dataModel: DataModel<D, K, G> };

/** Implements cross-series data model coordination. */
export class DataController {
    private readonly debug = Debug.create(true, 'data-model');

    private readonly requested: RequestedProcessing<any, any, any>[] = [];
    private status: 'setup' | 'executed' = 'setup';

    public constructor(
        private readonly mode: ChartMode,
        readonly suppressFieldDotNotation: boolean,
        private readonly enableIncrementalUpdates: boolean = true
    ) {}

    public async request<
        D extends object,
        K extends keyof D & string = keyof D & string,
        G extends boolean | undefined = undefined,
    >(id: string, data: D[], opts: DataModelOptions<K, any, false>, dataRef?: DataRef<D>) {
        if (this.status !== 'setup') {
            throw new Error(`AG Charts - data request after data setup phase.`);
        }

        return new Promise<Result<D, K, G>>((resolve, reject) => {
            this.requested.push({ id, opts, data, dataRef, resolve, reject });
        });
    }

    public execute(cachedData?: CachedData): CachedData {
        if (this.status !== 'setup') {
            throw new Error(`AG Charts - data request after data setup phase.`);
        }

        this.status = 'executed';

        this.debug('DataController.execute() - requested', this.requested);
        const valid = this.validateRequests(this.requested);
        this.debug('DataController.execute() - validated', valid);
        const merged = this.mergeRequested(valid);
        this.debug('DataController.execute() - merged', merged);

        if (this.debug.check()) {
            getWindow<{ processedData: any[] }>().processedData = [];
        }

        const nextCachedData: CachedData = [];

        for (const { data, ids, opts, resolves, rejects } of merged) {
            const reusableCache = cachedData?.find((cacheItem) => canReuseCachedData(cacheItem, data, ids, opts));
            const incrementallyUpdatableCache =
                this.enableIncrementalUpdates && !reusableCache
                    ? this.findIncrementallyUpdatableCache(cachedData, ids, opts)
                    : null;

            let dataModel: DataModel<any, string>;
            let processedData: UngroupedData<any> | undefined;

            if (reusableCache) {
                // Found exact match cached data - use it directly
                ({ dataModel, processedData } = reusableCache);
            } else if (incrementallyUpdatableCache) {
                // Found cached data that can be incrementally updated
                ({ dataModel, processedData } = incrementallyUpdatableCache);

                if (this.attemptIncrementalUpdate(valid, dataModel, processedData, opts, ids)) {
                    // Incremental update was successful - processedData was mutated in-place
                    // No additional work needed
                } else {
                    // Incremental update failed - fall back to full reprocessing
                    try {
                        const sources = new Map(valid.map((v) => [v.id, v.data]));
                        processedData = dataModel.processData(sources);
                    } catch (error) {
                        rejects.forEach((cb) => cb(error));
                        continue;
                    }
                }
            } else {
                // No cached data - perform full processing
                try {
                    dataModel = new DataModel<any>(opts, this.mode, this.suppressFieldDotNotation);
                    const sources = new Map(valid.map((v) => [v.id, v.data]));
                    processedData = dataModel.processData(sources);
                } catch (error) {
                    rejects.forEach((cb) => cb(error));
                    continue;
                }
            }

            nextCachedData.push({ opts, data, ids, dataModel, processedData });

            if (this.debug.check()) {
                getWindow<any[]>('processedData').push(processedData);
            }

            if (processedData) {
                for (const resolve of resolves) {
                    resolve({ dataModel, processedData });
                }
            } else {
                const rejectError = new Error(`AG Charts - no processed data generated`);
                for (const reject of rejects) {
                    reject(rejectError);
                }
            }
        }

        return nextCachedData;
    }

    /**
     * Finds cached data that can be incrementally updated.
     * This looks for cached data with the same options and IDs but potentially different data references.
     *
     * @param cachedData All cached data items
     * @param ids Request IDs
     * @param opts DataModel options
     * @returns Cached data item that can be incrementally updated, or null
     */
    private findIncrementallyUpdatableCache(cachedData: CachedData | undefined, ids: string[], opts: any) {
        if (!cachedData) return null;

        for (const cacheItem of cachedData) {
            // Check if IDs and options match (but data reference might be different)
            const { ids: cachedIds, opts: cachedOpts } = cacheItem;

            // Import the equality checking functions we need
            const arraysEqual = (a: string[], b: string[]) => {
                if (a.length !== b.length) return false;
                for (let i = 0; i < a.length; i++) {
                    if (a[i] !== b[i]) return false;
                }
                return true;
            };

            // Check if IDs match
            if (!arraysEqual(ids, cachedIds)) continue;

            // Check if options match (reuse the same logic as canReuseCachedData but skip data check)
            if (this.optsEqual(opts, cachedOpts)) {
                return cacheItem;
            }
        }

        return null;
    }

    /**
     * Simplified version of options equality check from caching.ts
     */
    private optsEqual(a: any, b: any): boolean {
        // This is a simplified check - in practice, we'd want to reuse the logic from caching.ts
        // For now, we'll do a basic structural comparison
        try {
            return JSON.stringify(a) === JSON.stringify(b);
        } catch {
            return false;
        }
    }

    /**
     * Attempts to apply incremental updates to existing processedData.
     *
     * @param validRequests Valid requests to check for DataRef objects
     * @param dataModel Existing DataModel to use for incremental updates
     * @param processedData Existing ProcessedData to mutate in-place
     * @param opts DataModel options
     * @param ids Request IDs
     * @returns true if incremental update was successful, false otherwise
     */
    private attemptIncrementalUpdate(
        validRequests: RequestedProcessing<any, any, any>[],
        dataModel: DataModel<any, string>,
        processedData: UngroupedData<any> | undefined,
        _opts: any,
        ids: string[]
    ): boolean {
        if (!processedData) {
            return false;
        }

        // Check if incremental updates are supported by the DataModel
        if (!dataModel.supportsIncrementalUpdate()) {
            return false;
        }

        // Find requests with DataRef objects that have pending transactions
        const dataRefRequests = validRequests.filter(
            (req) => req.dataRef?.hasPendingTransactions() && ids.includes(req.id)
        );
        if (dataRefRequests.length === 0) {
            return false;
        }

        // Only support single source scenarios for incremental updates
        const sources = new Map(validRequests.map((v) => [v.id, v.data]));
        if (sources.size !== 1) {
            Logger.warnOnce('Incremental updates disabled: multiple data sources not supported');
            return false;
        }

        // Attempt incremental update for the first DataRef with pending transactions
        const dataRefRequest = dataRefRequests[0];
        try {
            const result = dataModel.applyTransactions(dataRefRequest.dataRef!, processedData, sources);
            if (result) {
                this.debug('DataController.attemptIncrementalUpdate() - success for', dataRefRequest.id);
                return true;
            } else {
                this.debug('DataController.attemptIncrementalUpdate() - failed for', dataRefRequest.id);
                return false;
            }
        } catch (error) {
            this.debug('DataController.attemptIncrementalUpdate() - error for', dataRefRequest.id, error);
            return false;
        }
    }

    private validateRequests(requested: RequestedProcessing<any, any, any>[]): RequestedProcessing<any, any, any>[] {
        const valid: RequestedProcessing<any, any, any>[] = [];

        for (const [index, request] of requested.entries()) {
            if (
                index > 0 &&
                request.data.length !== requested[0].data.length &&
                request.opts.groupByData === false &&
                request.opts.groupByKeys === false
            ) {
                request.reject(
                    new Error('all series[].data arrays must be of the same length and have matching keys.')
                );
            } else {
                valid.push(request);
            }
        }

        return valid;
    }

    private mergeRequested(requested: RequestedProcessing<any, any, any>[]): MergedRequests<any, any, any>[] {
        const grouped: RequestedProcessing<any, any, any>[][] = [];

        for (const request of requested) {
            const match = grouped.find(DataController.groupMatch(request));

            if (match) {
                match.push(request);
            } else {
                grouped.push([request]);
            }
        }

        return grouped.map(DataController.mergeRequests);
    }

    private static groupMatch({ data, opts }: RequestedProcessing<any, any, any>) {
        function keys(props: PropertyDefinition<any>[]) {
            return props
                .filter((p): p is DatumPropertyDefinition<any> => p.type === 'key')
                .map((p) => p.property)
                .join(';');
        }

        const { groupByData, groupByKeys = false, groupByFn, props } = opts;
        const propsKeys = keys(props);

        return ([group]: RequestedProcessing<any, any, any>[]) =>
            (groupByData === false || group.data === data) &&
            (group.opts.groupByKeys ?? false) === groupByKeys &&
            group.opts.groupByFn === groupByFn &&
            keys(group.opts.props) === propsKeys;
    }

    private static readonly crossScopeMergableTypes = new Set(['key', 'group-value-processor']);
    private static mergeRequests(
        this: void,
        requests: RequestedProcessing<any, any, any>[]
    ): MergedRequests<any, any, any> {
        const result: MergedRequests<any, any, any> = {
            ids: [],
            rejects: [],
            resolves: [],
            data: requests[0].data,
            opts: { ...requests[0].opts, props: [] },
        };

        const optsByTypeAndDataId = new Map<string, PropertyDefinition<any>[]>();
        const dataIds = new Map<unknown, number>();
        let nextDataId = 0;
        for (const request of requests) {
            const {
                id,
                data,
                resolve,
                reject,
                opts: { props, ...opts },
            } = request;

            result.ids.push(id);
            result.rejects.push(reject);
            result.resolves.push(resolve);
            result.data ??= data;
            result.opts ??= { ...opts, props: [] };

            for (const prop of props) {
                const clone = { ...prop, scopes: [id], data };
                DataController.createIdsMap(id, clone);

                let dataId: number;
                if (DataController.crossScopeMergableTypes.has(clone.type)) {
                    dataId = -1;
                } else if (dataIds.has(data)) {
                    dataId = dataIds.get(data)!;
                } else {
                    dataId = nextDataId++;
                    dataIds.set(data, dataId);
                }

                const matchKey = `${clone.type}-${dataId}-${clone.groupId}`;
                const matches = optsByTypeAndDataId.get(matchKey);
                const match = matches?.find((existing) => DataController.deepEqual(existing, clone));

                if (matches == null) {
                    result.opts.props.push(clone);
                    optsByTypeAndDataId.set(matchKey, [clone]);
                    continue;
                } else if (match == null) {
                    result.opts.props.push(clone);
                    matches.push(clone);
                    continue;
                }

                if (clone.scopes != null) {
                    (match as any).scopes ??= [];
                    (match as any).scopes.push(...clone.scopes);
                }

                if ((match.type === 'key' || match.type === 'value') && clone.idsMap?.size) {
                    match.idsMap ??= new Map();
                    DataController.mergeIdsMap(clone.idsMap, match.idsMap);
                }
            }
        }

        return result;
    }

    private static mergeIdsMap(fromMap: Map<string, Set<string>>, toMap: Map<string, Set<string>>) {
        for (const [scope, ids] of fromMap) {
            const toMapValue = toMap.get(scope);
            if (toMapValue == null) {
                toMap.set(scope, new Set(ids));
            } else {
                for (const id of ids) {
                    toMapValue.add(id);
                }
            }
        }
    }

    private static createIdsMap(scope: string, prop: { id?: string; idsMap?: Map<string, Set<string>> }) {
        if (prop.id == null) return;
        prop.idsMap ??= new Map();
        if (prop.idsMap.has(scope)) {
            prop.idsMap.get(scope)!.add(prop.id);
        } else {
            prop.idsMap.set(scope, new Set([prop.id]));
        }
    }

    // optimized version of deep equality for `mergeRequests` which can potentially loop over 1M times
    static readonly skipKeys = new Set<string>(['id', 'idsMap', 'type', 'scopes', 'data']);
    static deepEqual<T>(a: T, b: T): boolean {
        if (a === b) {
            return true;
        }

        if (a && b && typeof a == 'object' && typeof b == 'object') {
            if (a.constructor !== b.constructor) {
                return false;
            }

            let i, length;
            if (Array.isArray(a)) {
                length = a.length;
                if (length !== (b as unknown[]).length) {
                    return false;
                }
                for (i = length - 1; i >= 0; i--) {
                    if (!DataController.deepEqual(a[i], (b as unknown[])[i])) {
                        return false;
                    }
                }
                return true;
            }

            const keys = Object.keys(a);
            length = keys.length;
            if (length !== Object.keys(b).length) {
                return false;
            }
            for (i = length - 1; i >= 0; i--) {
                const key = keys[i];
                if (
                    !DataController.skipKeys.has(key) &&
                    (!Object.hasOwn(b, key) || !DataController.deepEqual(a[key as keyof T], b[key as keyof T]))
                ) {
                    return false;
                }
            }
            return true;
        }

        return false;
    }
}
