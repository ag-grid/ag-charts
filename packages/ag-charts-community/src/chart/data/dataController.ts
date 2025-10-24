import { Debug, Logger, getWindow } from 'ag-charts-core';

import { jsonDiff } from '../../util/json';
import type { ChartMode } from '../chartMode';
import { type CachedData, canReuseCachedData } from './caching';
import {
    DataModel,
    type DataModelOptions,
    type DatumPropertyDefinition,
    type ProcessedData,
    type UngroupedData,
} from './dataModel';
import type { PropertyDefinition } from './dataModelTypes';
import type { DataChangeDescription, DataSet } from './dataSet';

interface RequestedProcessing<
    D extends object,
    K extends keyof D & string = keyof D & string,
    G extends boolean | undefined = undefined,
> {
    id: string;
    opts: DataModelOptions<K, any, false>;
    dataSet: DataSet<D>;
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
    dataSet: DataSet<D>;
    resolves: ((result: Result<D, K, G>) => void)[];
    rejects: ((reason?: any) => void)[];
}

type Result<
    D extends object,
    K extends keyof D & string = keyof D & string,
    G extends boolean | undefined = undefined,
> = { processedData: ProcessedData<D>; dataModel: DataModel<D, K, G> };

function getPropertyKeys(props: PropertyDefinition<any>[]) {
    return props
        .filter((p): p is DatumPropertyDefinition<any> => p.type === 'key')
        .map((p) => p.property)
        .join(';');
}

/** Implements cross-series data model coordination. */
export class DataController {
    private readonly debug = Debug.create(true, 'data-model');

    private readonly requested: RequestedProcessing<any, any, any>[] = [];
    private status: 'setup' | 'executed' = 'setup';

    public constructor(
        private readonly mode: ChartMode,
        readonly suppressFieldDotNotation: boolean
    ) {}

    public async request<
        D extends object,
        K extends keyof D & string = keyof D & string,
        G extends boolean | undefined = undefined,
    >(id: string, dataSet: DataSet<D>, opts: DataModelOptions<K, any, false>) {
        if (this.status !== 'setup') {
            throw new Error(`AG Charts - data request after data setup phase.`);
        }

        return new Promise<Result<D, K, G>>((resolve, reject) => {
            this.requested.push({ id, opts, dataSet, resolve, reject });
        });
    }

    public execute(cachedData?: CachedData): CachedData {
        if (this.status !== 'setup') {
            throw new Error(`AG Charts - data request after data setup phase.`);
        }

        this.status = 'executed';

        // Commit pending transactions before processing
        const dataSets = new Map<DataSet<any>, DataChangeDescription | undefined>();
        for (const request of this.requested) {
            if (request.dataSet.hasPendingTransactions()) {
                dataSets.set(request.dataSet, request.dataSet.getChangeDescription());
            }
            request.dataSet.commitPendingTransactions();
        }

        this.debug('DataController.execute() - requested', this.requested);
        const valid = this.validateRequests(this.requested);
        this.debug('DataController.execute() - validated', valid);
        const merged = this.mergeRequested(valid);
        this.debug('DataController.execute() - merged', merged);

        if (this.debug.check()) {
            getWindow<{ processedData: any[] }>().processedData = [];
        }

        const nextCachedData: CachedData = [];

        for (const { dataSet, ids, opts, resolves, rejects } of merged) {
            const reusableCache = cachedData?.find((cacheItem) => canReuseCachedData(cacheItem, dataSet, ids, opts));

            const resolveResult = (dataModel: DataModel<any>, processedData?: UngroupedData<any>) => {
                if (this.debug.check()) {
                    getWindow<any[]>('processedData').push(processedData);
                }

                if (processedData == null) {
                    for (const cb of rejects) {
                        cb(new Error(`AG Charts - no processed data generated`));
                    }
                    return;
                }

                nextCachedData.push({ opts, dataSet, dataLength: dataSet.data.length, ids, dataModel, processedData });
                for (const resolve of resolves) {
                    resolve({ dataModel, processedData });
                }
            };

            const fullReprocess = () => {
                try {
                    const dataModel = new DataModel<any>(opts, this.mode, this.suppressFieldDotNotation);
                    const sources = new Map(valid.map((v) => [v.id, v.dataSet]));
                    const processedData = dataModel.processData(sources);
                    resolveResult(dataModel, processedData);
                    return dataModel;
                } catch (error) {
                    for (const cb of rejects) {
                        cb(error);
                    }
                }
            };

            if (reusableCache == null) {
                fullReprocess();
                continue;
            }

            const { dataModel, processedData } = reusableCache;
            const changeDescription = dataSets.get(dataSet);
            if (processedData && changeDescription && dataModel.isReprocessingSupported(processedData)) {
                this.debug('DataController.execute() - reprocessing data', processedData, dataSet);

                // Run incremental update
                dataModel.reprocessData(processedData, dataSets);

                // DEBUG: Compare incremental update with full reprocess baseline
                if (Debug.check('data-model:reprocess-diff')) {
                    const baselineModel = new DataModel<any>(opts, this.mode, this.suppressFieldDotNotation);
                    const sources = new Map(valid.map((v) => [v.id, v.dataSet]));
                    const baselineData = baselineModel.processData(sources);

                    // Serialize both results for comparison (handles Maps, Sets, etc.)
                    const reprocessedJson = JSON.parse(JSON.stringify(processedData, DataController.jsonReplacer));
                    const baselineJson = JSON.parse(JSON.stringify(baselineData, DataController.jsonReplacer));

                    // Remove metadata keys that will always differ (timing, optimization metadata)
                    delete reprocessedJson.time;
                    delete reprocessedJson.optimizations;
                    delete baselineJson.time;
                    delete baselineJson.optimizations;

                    const diff = jsonDiff(baselineJson, reprocessedJson);

                    if (diff) {
                        Logger.log('⚠️ DATA-MODEL REPROCESS DIFF DETECTED ⚠️');
                        Logger.log('Difference between incremental update and full reprocess:');
                        Logger.log('');
                        Logger.log('BASELINE (full reprocess):');
                        Logger.log(JSON.stringify(baselineJson, null, 2));
                        Logger.log('');
                        Logger.log('REPROCESSED (incremental update):');
                        Logger.log(JSON.stringify(reprocessedJson, null, 2));
                        Logger.log('');
                        Logger.log('DIFF (what changed):');
                        Logger.log(JSON.stringify(diff, null, 2));
                    } else {
                        Logger.log('✅ Data-model reprocess matches baseline (no diff)');
                    }
                }

                resolveResult(dataModel, processedData);
                continue;
            }

            fullReprocess();
        }

        return nextCachedData;
    }

    private validateRequests(requested: RequestedProcessing<any, any, any>[]): RequestedProcessing<any, any, any>[] {
        const valid: RequestedProcessing<any, any, any>[] = [];

        for (const [index, request] of requested.entries()) {
            if (
                index > 0 &&
                request.dataSet.data.length !== requested[0].dataSet.data.length &&
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

    private static groupMatch({ dataSet, opts }: RequestedProcessing<any, any, any>) {
        const { groupByData, groupByKeys = false, groupByFn, props } = opts;
        const propsKeys = getPropertyKeys(props);

        return ([group]: RequestedProcessing<any, any, any>[]) =>
            (groupByData === false || group.dataSet === dataSet) &&
            (group.opts.groupByKeys ?? false) === groupByKeys &&
            group.opts.groupByFn === groupByFn &&
            getPropertyKeys(group.opts.props) === propsKeys;
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
            dataSet: requests[0].dataSet,
            opts: { ...requests[0].opts, props: [] },
        };

        const optsByTypeAndDataId = new Map<string, PropertyDefinition<any>[]>();
        const dataIds = new Map<unknown, number>();
        let nextDataId = 0;
        for (const request of requests) {
            const {
                id,
                dataSet,
                resolve,
                reject,
                opts: { props, ...opts },
            } = request;

            result.ids.push(id);
            result.rejects.push(reject);
            result.resolves.push(resolve);
            result.dataSet ??= dataSet;
            result.opts ??= { ...opts, props: [] };

            for (const prop of props) {
                const clone = { ...prop, scopes: [id], data: dataSet.data };
                DataController.createIdsMap(id, clone);

                let dataId: number;
                if (DataController.crossScopeMergableTypes.has(clone.type)) {
                    dataId = -1;
                } else if (dataIds.has(dataSet.data)) {
                    dataId = dataIds.get(dataSet.data)!;
                } else {
                    dataId = nextDataId++;
                    dataIds.set(dataSet.data, dataId);
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

    /** JSON replacer for serializing non-JSON-serializable objects like Map and Set */
    private static jsonReplacer(this: void, _key: string, value: any): any {
        if (value instanceof Map) {
            return { __type: 'Map', value: Array.from(value.entries()) };
        }
        if (value instanceof Set) {
            return { __type: 'Set', value: Array.from(value) };
        }
        return value;
    }
}
