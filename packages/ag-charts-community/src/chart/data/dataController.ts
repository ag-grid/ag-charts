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
        if (this.status !== 'setup') throw new Error(`AG Charts - data request after data setup phase.`);

        return new Promise<Result<D, K, G>>((resolve, reject) => {
            this.requested.push({
                id,
                opts,
                data,
                resultCb: resolve,
                reject,
            });
        });
    }

    public async execute() {
        if (this.status !== 'setup') throw new Error(`AG Charts - data request after data setup phase.`);

        this.status = 'executed';

        this.debug('DataController.execute() - requested', this.requested);
        const merged = this.mergeRequested();
        this.debug('DataController.execute() - merged', merged);

        const debugMode = Debug.check(true, 'data-model');
        if (debugMode) {
            (window as any).processedData = [];
        }

        for (const { opts, data, resultCbs, rejects, ids } of merged) {
            try {
                const dataModel = new DataModel<any>({ ...opts, mode: this.mode });
                const processedData = dataModel.processData(data, this.requested);

                if (debugMode) {
                    (window as any).processedData.push(processedData);
                }

                if (processedData && processedData.partialValidDataCount === 0) {
                    resultCbs.forEach((cb, requestIdx) => {
                        const id = ids[requestIdx];
                        const requestProcessedData = this.extractScopedData(id, processedData);
                        cb({ dataModel, processedData: requestProcessedData });
                    });
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

    /**
     * Extract the datum and values from the nested scoped values for this request id.
     */
    private extractScopedData(id: string, processedData: UngroupedData<any>) {
        const extractDatum = (datum: any): any => {
            if (Array.isArray(datum)) {
                return datum.map(extractDatum);
            }
            return { ...datum, ...datum[id] };
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
                values: datum.values.map(extractValues),
            })),
        };
    }

    private mergeRequested(): MergedRequests<any, any, any>[] {
        const grouped: RequestedProcessing<any, any, any>[][] = [];
        const keys = (props: PropertyDefinition<any>[]) => {
            return props
                .filter((p): p is DatumPropertyDefinition<any> => p.type === 'key')
                .map((p) => p.property)
                .join(';');
        };

        const groupMatch =
            ({ opts, data }: RequestedProcessing<any, any, any>) =>
            (gr: RequestedProcessing<any, any, any>[]) => {
                return (
                    (opts.groupByData === false || gr[0].data === data) &&
                    gr[0].opts.groupByKeys === opts.groupByKeys &&
                    gr[0].opts.dataVisible === opts.dataVisible &&
                    gr[0].opts.groupByFn === opts.groupByFn &&
                    keys(gr[0].opts.props) === keys(opts.props)
                );
            };

        const propMatch = (prop: PropertyDefinition<any>) => (existing: PropertyDefinition<any>) => {
            if (existing.type !== prop.type) return false;

            const diff = jsonDiff(existing, prop) ?? {};
            delete diff['scopes'];
            delete diff['id'];
            delete diff['ids'];

            return Object.keys(diff).length === 0;
        };

        const mergeOpts = (opts: DataModelOptions<any, any>[]): DataModelOptions<any, any> => {
            return {
                ...opts[0],
                props: opts.reduce<PropertyDefinition<any>[]>((result, next) => {
                    for (const prop of next.props) {
                        if (prop.id != null) {
                            prop.ids ??= [];
                            prop.scopes?.forEach((scope) => prop.ids?.push([scope, prop.id!]));
                        }

                        const match = result.find(propMatch(prop));
                        if (!match) {
                            result.push(prop);
                            continue;
                        }

                        match.scopes ??= [];
                        match.scopes.push(...(prop.scopes ?? []));
                        if (match.type !== 'key' && match.type !== 'value') continue;
                        match.ids?.push(...(prop.ids ?? []));
                    }

                    return result;
                }, []),
            };
        };

        const merge = (props: RequestedProcessing<any, any, any>[]): MergedRequests<any, any, any> => {
            return {
                ids: props.map(({ id }) => id),
                resultCbs: props.map(({ resultCb }) => resultCb),
                rejects: props.map(({ reject }) => reject),
                data: props[0].data,
                opts: mergeOpts(props.map(({ opts }) => opts)),
            };
        };

        for (const request of this.requested) {
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
        for (let index = 0; index < scopes.length; index++) {
            const scope = scopes[index];
            const resultCb = resultCbs[index];

            resultCb({
                dataModel,
                processedData: {
                    ...processedData,
                    data: processedData.data.filter(({ validScopes }) => {
                        return validScopes == null || validScopes.some((s) => s === scope);
                    }),
                },
            });
        }
    }
}
