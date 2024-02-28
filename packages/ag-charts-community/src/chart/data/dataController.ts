import { unique } from '../../util/array';
import { Debug } from '../../util/debug';
import { jsonDiff } from '../../util/json';
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
        const { valid, invalid } = this.validateRequests(this.requested);
        this.debug('DataController.execute() - validated', valid);
        const merged = this.mergeRequested(valid);
        this.debug('DataController.execute() - merged', merged);

        if (this.debug.check()) {
            (window as any).processedData = [];
        }

        const multipleSources = this.hasMultipleDataSources(valid);
        for (const { opts, data, resultCbs, rejects, ids } of merged) {
            const needsValueExtraction =
                multipleSources ||
                opts.props.some((p) => (p.type === 'key' || p.type === 'value') && p.useScopedValues);

            try {
                const dataModel = new DataModel<any>({ ...opts, mode: this.mode });
                const processedData = dataModel.processData(data, valid);

                if (this.debug.check()) {
                    (window as any).processedData.push(processedData);
                }

                if (processedData && processedData.partialValidDataCount === 0) {
                    resultCbs.forEach((callback, requestIdx) =>
                        callback({
                            dataModel,
                            processedData: needsValueExtraction
                                ? this.extractScopedData(ids[requestIdx], processedData, ids)
                                : processedData,
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

        invalid.forEach(({ error, reject }) => reject(error));
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

    private validateRequests(requested: RequestedProcessing<any, any, any>[]): {
        valid: RequestedProcessing<any, any, any>[];
        invalid: (RequestedProcessing<any, any, any> & { error: Error })[];
    } {
        const valid: RequestedProcessing<any, any, any>[] = [];
        const invalid: (RequestedProcessing<any, any, any> & { error: Error })[] = [];

        for (const [index, request] of requested.entries()) {
            if (index > 0 && request.data.length !== requested[0].data.length && request.opts.groupByData === false) {
                invalid.push({
                    ...request,
                    error: new Error('all series[].data arrays must be of the same length and have matching keys.'),
                });
            } else {
                valid.push(request);
            }
        }

        return { valid, invalid };
    }

    private mergeRequested(requested: RequestedProcessing<any, any, any>[]): MergedRequests<any, any, any>[] {
        const grouped: RequestedProcessing<any, any, any>[][] = [];
        const keys = (props: PropertyDefinition<any>[]) =>
            props
                .filter((p): p is DatumPropertyDefinition<any> => p.type === 'key')
                .map((p) => p.property)
                .join(';');

        const groupMatch =
            ({ opts, data }: RequestedProcessing<any, any, any>) =>
            ([group]: RequestedProcessing<any, any, any>[]) =>
                (opts.groupByData === false || group.data === data) &&
                group.opts.groupByKeys === opts.groupByKeys &&
                group.opts.dataVisible === opts.dataVisible &&
                group.opts.groupByFn === opts.groupByFn &&
                keys(group.opts.props) === keys(opts.props);

        const propMatch = (prop: PropertyDefinition<any>) => (existing: PropertyDefinition<any>) => {
            if (existing.type !== prop.type) {
                return false;
            }

            const { id, ids, scopes, useScopedValues, ...diff } = jsonDiff<any>(existing, prop) ?? {};
            return Object.keys(diff).length === 0;
        };

        const updateKeyValueOpts = (prop: PropertyDefinition<any>) => {
            if (prop.type === 'key' || prop.type === 'value') {
                prop.useScopedValues = unique(prop.scopes ?? []).length > 1;
            }
        };

        const mergeOpts = (opts: DataModelOptions<any, any>[]): DataModelOptions<any, any> => {
            return {
                ...opts[0],
                props: opts.reduce<PropertyDefinition<any>[]>((result, next) => {
                    for (const prop of next.props) {
                        if (prop.id != null) {
                            prop.ids ??= [];
                            for (const scope of prop.scopes ?? []) {
                                prop.ids.push([scope, prop.id]);
                            }
                        }

                        const match = result.find(propMatch(prop));
                        if (!match) {
                            updateKeyValueOpts(prop);
                            result.push(prop);
                            continue;
                        }

                        match.scopes ??= [];
                        match.scopes.push(...(prop.scopes ?? []));
                        updateKeyValueOpts(prop);

                        if ((match.type === 'key' || match.type === 'value') && prop.ids?.length) {
                            match.ids?.push(...prop.ids);
                        }
                    }

                    return result;
                }, []),
            };
        };

        const merge = (props: RequestedProcessing<any, any, any>[]): MergedRequests<any, any, any> => ({
            ids: props.map(({ id }) => id),
            resultCbs: props.map(({ resultCb }) => resultCb),
            rejects: props.map(({ reject }) => reject),
            data: props[0].data,
            opts: mergeOpts(props.map(({ opts }) => opts)),
        });

        for (const request of requested) {
            const match = grouped.find(groupMatch(request));

            if (match) {
                match.push(request);
            } else {
                grouped.push([request]);
            }
        }

        return grouped.map(merge);
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

            processedData.data = processedData.data.filter(
                ({ validScopes }) => validScopes?.some((s) => s === scope) ?? true
            );

            resultCb({ dataModel, processedData });
        }
    }
}
