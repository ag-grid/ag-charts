import { Debug } from '../../util/debug';
import { getWindow } from '../../util/dom';
import type { ChartMode } from '../chartMode';
import type {
    DataModelOptions,
    DatumPropertyDefinition,
    ProcessedData,
    PropertyDefinition,
    UngroupedData,
} from './dataModel';
import { DataModel } from './dataModel';

interface RequestedProcessing<
    D extends object,
    K extends keyof D & string = keyof D & string,
    G extends boolean | undefined = undefined,
> {
    id: string;
    opts: DataModelOptions<K, any>;
    data: D[];
    resolve: (result: Result<D, K, G>) => void;
    reject: (reason?: any) => void;
}

interface MergedRequests<
    D extends object,
    K extends keyof D & string = keyof D & string,
    G extends boolean | undefined = undefined,
> {
    ids: string[];
    opts: DataModelOptions<K, any>;
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

    public constructor(private readonly mode: ChartMode) {}

    public async request<
        D extends object,
        K extends keyof D & string = keyof D & string,
        G extends boolean | undefined = undefined,
    >(id: string, data: D[], opts: DataModelOptions<K, any>) {
        if (this.status !== 'setup') {
            throw new Error(`AG Charts - data request after data setup phase.`);
        }

        return new Promise<Result<D, K, G>>((resolve, reject) => {
            this.requested.push({ id, opts, data, resolve, reject });
        });
    }

    public execute() {
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

        const scopes = this.requested.map(({ id }) => id);
        const needsValueExtraction = this.hasMultipleDataSources(valid);
        for (const { opts, data, resolves, rejects, ids } of merged) {
            try {
                const dataModel = new DataModel<any>(opts, this.mode);
                const processedData = dataModel.processData(data, valid);

                if (this.debug.check()) {
                    getWindow<any[]>('processedData').push(processedData);
                }

                if (processedData?.partialValidDataCount === 0) {
                    resolves.forEach((resolve, requestIdx) =>
                        resolve({
                            dataModel,
                            processedData: this.processScopedData(
                                ids[requestIdx],
                                processedData,
                                scopes,
                                needsValueExtraction
                            ),
                        })
                    );
                } else if (processedData) {
                    this.splitResult(dataModel, processedData, ids, resolves);
                } else {
                    rejects.forEach((cb) => cb(new Error(`AG Charts - no processed data generated`)));
                }
            } catch (error) {
                rejects.forEach((cb) => cb(error));
            }
        }
    }

    private hasMultipleDataSources(validRequests: RequestedProcessing<any, any, any>[]) {
        if (validRequests.length) {
            const [{ data }, ...restRequests] = validRequests;
            return restRequests.some((v) => data !== v.data);
        }
        return false;
    }

    private processScopedData(
        id: string,
        processedData: UngroupedData<any>,
        ids: string[],
        needsValueExtraction: boolean
    ) {
        const extractDatum = (datum: any): any => {
            if (Array.isArray(datum)) {
                return datum.map(extractDatum);
            }
            const extracted = needsValueExtraction ? { ...datum, ...datum[id] } : datum;
            for (const otherId of ids) {
                delete extracted[otherId];
            }
            return extracted;
        };

        const extractValues = (values: any): any => {
            if (Array.isArray(values)) {
                return values.map(extractValues);
            }
            return values?.[id] ?? values;
        };

        return {
            ...processedData,
            data: processedData.data.map((datum) => ({
                ...datum,
                datum: extractDatum(datum.datum),
                values: needsValueExtraction ? datum.values?.map(extractValues) : datum.values,
            })),
        };
    }

    private validateRequests(requested: RequestedProcessing<any, any, any>[]): RequestedProcessing<any, any, any>[] {
        const valid: RequestedProcessing<any, any, any>[] = [];

        for (const [index, request] of requested.entries()) {
            if (index > 0 && request.data.length !== requested[0].data.length && request.opts.groupByData === false) {
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

    private splitResult(
        dataModel: DataModel<any>,
        processedData: ProcessedData<any>,
        scopes: string[],
        resolves: ((result: Result<any, any, any>) => void)[]
    ) {
        for (let i = 0; i < scopes.length; i++) {
            const scope = scopes[i];
            const resolve = resolves[i];

            resolve({
                dataModel,
                processedData: {
                    ...processedData,
                    data: processedData.data.filter(({ validScopes }) => validScopes?.has(scope) ?? true),
                },
            });
        }
    }

    private static groupMatch({ data, opts }: RequestedProcessing<any, any, any>) {
        function keys(props: PropertyDefinition<any>[]) {
            return props
                .filter((p): p is DatumPropertyDefinition<any> => p.type === 'key')
                .map((p) => p.property)
                .join(';');
        }

        return ([group]: RequestedProcessing<any, any, any>[]) =>
            (opts.groupByData === false || group.data === data) &&
            group.opts.groupByKeys === opts.groupByKeys &&
            group.opts.groupByFn === opts.groupByFn &&
            keys(group.opts.props) === keys(opts.props);
    }

    private static mergeRequests(requests: RequestedProcessing<any, any, any>[]): MergedRequests<any, any, any> {
        return requests.reduce(
            (result, { id, data, resolve, reject, opts: { props, ...opts } }) => {
                result.ids.push(id);
                result.rejects.push(reject);
                result.resolves.push(resolve);
                result.data ??= data;
                result.opts ??= { ...opts, props: [] };

                for (const prop of props) {
                    const clone = { ...prop, scopes: [id] };
                    DataController.createIdsMap(id, clone);

                    const match = result.opts.props.find(
                        (existing: any) => existing.type === clone.type && DataController.deepEqual(existing, clone)
                    );

                    if (!match) {
                        result.opts.props.push(clone);
                        continue;
                    }

                    match.scopes ??= [];
                    match.scopes.push(...(clone.scopes ?? []));

                    if ((match.type === 'key' || match.type === 'value') && clone.idsMap?.size) {
                        DataController.mergeIdsMap(clone.idsMap, match.idsMap);
                    }
                }

                return result;
            },
            { ids: [], rejects: [], resolves: [], data: null, opts: null } as any
        );
    }

    private static mergeIdsMap(fromMap: Map<string, Set<string>>, toMap: Map<string, Set<string>>) {
        for (const [scope, ids] of fromMap) {
            const toMapValue = toMap.get(scope);
            if (toMapValue != null) {
                for (const id of ids) {
                    toMapValue.add(id);
                }
            } else {
                toMap.set(scope, new Set(ids));
            }
        }
    }

    private static createIdsMap(scope: string, prop: PropertyDefinition<any>) {
        if (prop.id == null) return;
        prop.idsMap ??= new Map();
        if (prop.idsMap.has(scope)) {
            prop.idsMap.get(scope)!.add(prop.id);
        } else {
            prop.idsMap.set(scope, new Set([prop.id]));
        }
    }

    // optimized version of deep equality for `mergeRequests` which can potentially loop over 1M times
    static readonly skipKeys = new Set<string>(['id', 'idsMap', 'type', 'scopes']);
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
