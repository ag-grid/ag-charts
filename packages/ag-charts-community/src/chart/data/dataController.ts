import { unique } from '../../util/array';
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
    resultCb: (result: Result<D, K, G>) => void;
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
    resultCbs: ((result: Result<D, K, G>) => void)[];
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

    private requested: RequestedProcessing<any, any, any>[] = [];
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
            this.requested.push({ id, opts, data, resultCb: resolve, reject });
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

        const multipleSources = this.hasMultipleDataSources(valid);
        const scopes = this.requested.map(({ id }) => id);
        for (const { opts, data, resultCbs, rejects, ids } of merged) {
            const needsValueExtraction =
                multipleSources ||
                opts.props.some((p) => (p.type === 'key' || p.type === 'value') && p.useScopedValues);

            try {
                const dataModel = new DataModel<any>({ ...opts, mode: this.mode });
                const processedData = dataModel.processData(data, valid);

                if (this.debug.check()) {
                    getWindow<any[]>('processedData').push(processedData);
                }

                if (processedData?.partialValidDataCount === 0) {
                    resultCbs.forEach((callback, requestIdx) =>
                        callback({
                            dataModel,
                            processedData: needsValueExtraction
                                ? this.extractScopedData(ids[requestIdx], processedData, scopes)
                                : this.removeScopedData(processedData, scopes),
                        })
                    );
                } else if (processedData) {
                    this.splitResult(dataModel, processedData, ids, resultCbs);
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

    private extractScopedData(id: string, processedData: UngroupedData<any>, ids: string[]) {
        const extractDatum = (datum: any): any => {
            if (Array.isArray(datum)) {
                return datum.map(extractDatum);
            }
            const extracted = { ...datum, ...datum[id] };
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
                values: datum.values?.map(extractValues),
            })),
        };
    }

    private removeScopedData(processedData: UngroupedData<any>, ids: string[]) {
        for (const datum of processedData.data) {
            for (const otherId of ids) {
                delete datum.datum[otherId];
            }
        }
        return processedData;
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
        resultCbs: ((result: Result<any, any, any>) => void)[]
    ) {
        for (let i = 0; i < scopes.length; i++) {
            const scope = scopes[i];
            const resultCb = resultCbs[i];

            resultCb({
                dataModel,
                processedData: {
                    ...processedData,
                    data: processedData.data.filter(({ validScopes }) => validScopes?.has(scope) ?? true),
                },
            });
        }
    }

    private static groupMatch({ opts, data }: RequestedProcessing<any, any, any>) {
        function keys(props: PropertyDefinition<any>[]) {
            return props
                .filter((p): p is DatumPropertyDefinition<any> => p.type === 'key')
                .map((p) => p.property)
                .join(';');
        }

        return ([group]: RequestedProcessing<any, any, any>[]) =>
            (opts.groupByData === false || group.data === data) &&
            group.opts.groupByKeys === opts.groupByKeys &&
            group.opts.dataVisible === opts.dataVisible &&
            group.opts.groupByFn === opts.groupByFn &&
            keys(group.opts.props) === keys(opts.props);
    }

    private static mergeRequests(requests: RequestedProcessing<any, any, any>[]): MergedRequests<any, any, any> {
        function updateKeyValueOpts(prop: PropertyDefinition<any>) {
            if (prop.type === 'key' || prop.type === 'value') {
                prop.useScopedValues = unique(prop.scopes ?? []).length > 1;
            }
        }

        return requests.reduce(
            (result, { id, data, resultCb, reject, opts: { props, ...opts } }) => {
                result.ids.push(id);
                result.rejects.push(reject);
                result.resultCbs.push(resultCb);
                result.data ??= data;
                result.opts ??= { ...opts, props: [] };

                for (const prop of props) {
                    updateKeyValueOpts(prop);

                    if (prop.id != null) {
                        prop.ids ??= [];
                        for (const scope of prop.scopes ?? []) {
                            prop.ids.push([scope, prop.id]);
                        }
                    }

                    const match = result.opts.props.find(
                        (existing: any) => existing.type === prop.type && DataController.deepEqual(existing, prop)
                    );

                    if (!match) {
                        result.opts.props.push(prop);
                        continue;
                    }

                    match.scopes ??= [];
                    match.scopes.push(...(prop.scopes ?? []));

                    if ((match.type === 'key' || match.type === 'value') && prop.ids?.length) {
                        match.ids?.push(...prop.ids);
                    }
                }

                return result;
            },
            { ids: [], rejects: [], resultCbs: [], data: null, opts: null } as any
        );
    }

    // optimized version of deep equality for `mergeRequests` which can potentially loop over 1M times
    static skipKeys = new Set<string>(['id', 'ids', 'type', 'scopes', 'useScopedValues']);
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
