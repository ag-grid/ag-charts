import { getWindow } from 'ag-charts-core';

import { Debug } from '../../util/debug';
import type { ChartMode } from '../chartMode';
import { ArrayUpdater } from './arrayUpdater';
import { type CachedData } from './caching';
import type { DataChangeDescriptor } from './dataChangeDescriptor';
import {
    DataModel,
    type DataModelOptions,
    type DatumPropertyDefinition,
    type ProcessedData,
    type PropertyDefinition,
    type UngroupedData,
} from './dataModel';
import { DataRef, getDataRefForData } from './dataRef';
import { TransactionAnalyzer } from './transactionAnalyzer';
import { normaliseAppend, normalisePrepend, normaliseRemoveReferences } from './transactionUtils';

interface RequestedProcessing<
    D extends object,
    K extends keyof D & string = keyof D & string,
    G extends boolean | undefined = undefined,
> {
    id: string;
    opts: DataModelOptions<K, any, false>;
    dataRef: DataRef<D>;
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
    dataRef: DataRef<D>;
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

        const inferredDataRef =
            dataRef ?? (getDataRefForData(data) as DataRef<D> | undefined) ?? DataRef.wrap(data) ?? DataRef.empty<D>();

        return new Promise<Result<D, K, G>>((resolve, reject) => {
            this.requested.push({ id, opts, dataRef: inferredDataRef, resolve, reject });
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

        const dataRefState = this.computeDataRefState(merged);
        const committedRefs = new Set<DataRef<any>>();
        const pendingDescriptorCommits = new Map<DataRef<any>, DataChangeDescriptor | null>();
        const nextCachedData: CachedData = [];

        for (const { ids, opts, dataRef, resolves, rejects } of merged) {
            const { descriptor, preview } = dataRefState.get(dataRef) ?? { descriptor: undefined, preview: undefined };

            const sourcesForProcess = new Map<string, unknown[]>();
            for (const id of ids) {
                sourcesForProcess.set(id, preview ?? dataRef.data);
            }

            const cachedItem = cachedData?.find(
                (item) => item.dataRef === dataRef && this.arraysEqual(ids, item.ids) && this.optsEqual(item.opts, opts)
            );

            let dataModel: DataModel<any, string> | undefined = cachedItem?.dataModel;
            let processedData: UngroupedData<any> | undefined = cachedItem?.processedData;
            let incrementalApplied = false;

            if (cachedItem) {
                incrementalApplied = this.attemptIncrementalUpdate(
                    ids[0],
                    dataRef,
                    dataModel!,
                    processedData,
                    descriptor
                );
                if (incrementalApplied) {
                    committedRefs.add(dataRef);
                }
            }

            if (!cachedItem) {
                try {
                    dataModel = new DataModel<any>(opts, this.mode, this.suppressFieldDotNotation);
                    processedData = dataModel.processData(sourcesForProcess);
                } catch (error) {
                    rejects.forEach((cb) => cb(error));
                    continue;
                }
                if (dataRef.hasPendingTransactions()) {
                    pendingDescriptorCommits.set(dataRef, descriptor ?? null);
                }
            } else if (!incrementalApplied) {
                try {
                    processedData = dataModel!.processData(sourcesForProcess);
                } catch (error) {
                    rejects.forEach((cb) => cb(error));
                    continue;
                }
                if (dataRef.hasPendingTransactions()) {
                    pendingDescriptorCommits.set(dataRef, descriptor ?? null);
                }
            }

            if (!dataModel) {
                throw new Error('AG Charts - data model not initialised');
            }

            nextCachedData.push({ ids, opts, dataRef, dataLength: dataRef.data.length, dataModel, processedData });

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

        for (const [dataRef, descriptor] of pendingDescriptorCommits) {
            if (committedRefs.has(dataRef)) continue;
            if (descriptor) {
                this.applyDescriptorToDataRef(dataRef, descriptor);
            } else if (dataRef.hasPendingTransactions()) {
                dataRef.commitPendingTransactions();
            }
        }

        return nextCachedData;
    }

    private computeDataRefState(
        groups: MergedRequests<any, any, any>[]
    ): Map<DataRef<any>, { descriptor?: DataChangeDescriptor; preview?: unknown[] }> {
        const state = new Map<DataRef<any>, { descriptor?: DataChangeDescriptor; preview?: unknown[] }>();

        for (const { dataRef, ids } of groups) {
            if (state.has(dataRef)) {
                continue;
            }

            let descriptor: DataChangeDescriptor | undefined;
            let preview: unknown[] | undefined;

            if (dataRef.hasPendingTransactions()) {
                const analyzerSources = new Map<string, unknown[]>();
                for (const id of ids) {
                    analyzerSources.set(id, dataRef.data);
                }
                descriptor = TransactionAnalyzer.analyze(dataRef, analyzerSources);
                if (descriptor) {
                    preview = ArrayUpdater.applyChangesToCopy(dataRef.data, descriptor, (datum) => datum);
                } else {
                    preview = dataRef.previewPendingTransactions();
                }
            }

            state.set(dataRef, { descriptor, preview });
        }

        return state;
    }

    private attemptIncrementalUpdate(
        primaryId: string,
        dataRef: DataRef<any>,
        dataModel: DataModel<any, string>,
        processedData: UngroupedData<any> | undefined,
        descriptor: DataChangeDescriptor | undefined
    ): boolean {
        if (
            !this.enableIncrementalUpdates ||
            descriptor == null ||
            !processedData ||
            !dataModel.supportsIncrementalUpdate() ||
            !dataRef.hasPendingTransactions()
        ) {
            return false;
        }

        const sources = new Map<string, unknown[]>([[primaryId, dataRef.data]]);

        try {
            const result = dataModel.applyTransactions(dataRef, processedData, sources, descriptor);
            if (!result) {
                this.debug('DataController.attemptIncrementalUpdate() - fallback requested', { seriesId: primaryId });
                return false;
            }

            this.debug('DataController.attemptIncrementalUpdate() - success', { seriesId: primaryId });
            return true;
        } catch (error) {
            this.debug('DataController.attemptIncrementalUpdate() - error', { seriesId: primaryId, error });
            throw error;
        }
    }

    private applyDescriptorToDataRef(dataRef: DataRef<any>, descriptor: DataChangeDescriptor): void {
        ArrayUpdater.applyChanges(dataRef.data, descriptor, (datum) => datum);
        dataRef.pendingTransactions = [];
    }

    private arraysEqual(a: string[], b: string[]): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i += 1) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    private optsEqual(a: any, b: any): boolean {
        try {
            return JSON.stringify(a) === JSON.stringify(b);
        } catch {
            return false;
        }
    }

    private validateRequests(requested: RequestedProcessing<any, any, any>[]): RequestedProcessing<any, any, any>[] {
        const valid: RequestedProcessing<any, any, any>[] = [];

        for (const [index, request] of requested.entries()) {
            if (
                index > 0 &&
                request.dataRef.data.length !== requested[0].dataRef.data.length &&
                request.opts.groupByData === false &&
                request.opts.groupByKeys === false
            ) {
                request.reject(
                    new Error('all series[].data arrays must be of the same length and have matching keys.')
                );
                continue;
            }

            try {
                const transactions = request.dataRef.pendingTransactions ?? [];
                for (const transaction of transactions) {
                    normaliseAppend(transaction.append);
                    normalisePrepend(transaction.prepend);
                    normaliseRemoveReferences(transaction.remove);
                }
            } catch (error) {
                request.reject(error);
                continue;
            }

            valid.push(request);
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

    private static groupMatch({ dataRef, opts }: RequestedProcessing<any, any, any>) {
        function keys(props: PropertyDefinition<any>[]) {
            return props
                .filter((p): p is DatumPropertyDefinition<any> => p.type === 'key')
                .map((p) => p.property)
                .join(';');
        }

        const { groupByData, groupByKeys = false, groupByFn, props } = opts;
        const propsKeys = keys(props);

        return ([group]: RequestedProcessing<any, any, any>[]) =>
            group.dataRef === dataRef &&
            (groupByData === false || group.dataRef === dataRef) &&
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
            dataRef: requests[0].dataRef,
            opts: { ...requests[0].opts, props: [] },
        };

        const optsByTypeAndDataId = new Map<string, PropertyDefinition<any>[]>();
        const dataIds = new Map<DataRef<any>, number>();
        let nextDataId = 0;
        for (const request of requests) {
            const {
                id,
                dataRef,
                resolve,
                reject,
                opts: { props, ...opts },
            } = request;

            result.ids.push(id);
            result.rejects.push(reject);
            result.resolves.push(resolve);
            result.dataRef ??= dataRef;
            result.opts ??= { ...opts, props: [] };

            for (const prop of props) {
                const clone = { ...prop, scopes: [id], data: dataRef.data };
                DataController.createIdsMap(id, clone);

                let dataId: number;
                if (DataController.crossScopeMergableTypes.has(clone.type)) {
                    dataId = -1;
                } else if (dataIds.has(dataRef)) {
                    dataId = dataIds.get(dataRef)!;
                } else {
                    dataId = nextDataId++;
                    dataIds.set(dataRef, dataId);
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
