import { Logger } from '../../util/logger';
import { isNumber } from '../../util/value';
import { windowValue } from '../../util/window';
import { DataDomain } from './dataDomain';
import type { ContinuousDomain } from './utilFunctions';
import { extendDomain } from './utilFunctions';

export type ScopeProvider = { id: string };

export type UngroupedDataItem<D, V> = {
    keys: any[];
    values: V;
    aggValues?: [number, number][];
    datum: D;
    validScopes?: string[];
};

export interface UngroupedData<D> {
    type: 'ungrouped';
    data: UngroupedDataItem<D, any[]>[];
    domain: {
        keys: any[][];
        values: any[][];
        groups?: any[][];
        aggValues?: [number, number][];
    };
    reduced?: Record<string, any>;
    defs: {
        keys: DatumPropertyDefinition<keyof D>[];
        values: DatumPropertyDefinition<keyof D>[];
        allScopesHaveSameDefs: boolean;
    };
    partialValidDataCount: number;
    time: number;
}

type GroupedDataItem<D> = UngroupedDataItem<D[], any[][]> & { area?: number };

export interface GroupedData<D> {
    type: 'grouped';
    data: GroupedDataItem<D>[];
    domain: UngroupedData<D>['domain'];
    reduced?: UngroupedData<D>['reduced'];
    defs: UngroupedData<D>['defs'];
    partialValidDataCount: number;
    time: number;
}

export type ProcessedData<D> = UngroupedData<D> | GroupedData<D>;

export type DatumPropertyType = 'range' | 'category';

function toKeyString(keys: any[]) {
    return keys
        .map((v) => {
            if (v == null) {
                return v;
            } else if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') {
                return v;
            } else if (typeof v === 'object') {
                return JSON.stringify(v);
            }
            return v;
        })
        .join('-');
}

function round(val: number): number {
    const accuracy = 10000;
    if (Number.isInteger(val)) {
        return val;
    } else if (Math.abs(val) > accuracy) {
        return Math.trunc(val);
    }

    return Math.round(val * accuracy) / accuracy;
}

export function fixNumericExtent(extent?: (number | Date)[]): [] | [number, number] {
    if (extent === undefined) {
        // Don't return a range, there is no range.
        return [];
    }

    let [min, max] = extent;
    min = +min;
    max = +max;

    if (min === 0 && max === 0) {
        // domain has zero length and the single valid value is 0. Use the default of [0, 1].
        return [0, 1];
    }

    if (min === Infinity && max === -Infinity) {
        // There's no data in the domain.
        return [];
    }
    if (min === Infinity) {
        min = 0;
    }
    if (max === -Infinity) {
        max = 0;
    }

    if (!(isNumber(min) && isNumber(max))) {
        return [];
    }

    return [min, max];
}

type GroupingFn<K> = (data: UngroupedDataItem<K, any[]>) => K[];
export type GroupByFn = (extractedData: UngroupedData<any>) => GroupingFn<any>;
export type DataModelOptions<K, Grouped extends boolean | undefined> = {
    readonly scopes?: string[];
    readonly props: PropertyDefinition<K>[];
    readonly groupByKeys?: Grouped;
    readonly groupByFn?: GroupByFn;
    readonly dataVisible?: boolean;
};

export type PropertyDefinition<K> =
    | DatumPropertyDefinition<K>
    | AggregatePropertyDefinition<any, any, any>
    | PropertyValueProcessorDefinition<any>
    | GroupValueProcessorDefinition<any, any>
    | ReducerOutputPropertyDefinition<any>
    | ProcessorOutputPropertyDefinition<any>;

type ProcessorFn = (datum: any, previousDatum?: any) => any;
export type PropertyId<K extends string> = K | { id: string };

type PropertyIdentifiers = {
    /** Scope(s) a property definition belongs to (typically the defining entities unique identifier). */
    scopes?: string[];
    /** Unique id for a property definition within the scope(s) provided. */
    id?: string;
    /** Alternative unique ids for the property. */
    idAliases?: string[];
    /** Optional group a property belongs to, for cross-scope combination. */
    groupId?: string;
};

type PropertySelectors = {
    /** Scope(s) a property definition belongs to (typically the defining entities unique identifier). */
    matchScopes?: string[];
    /** Unique id for a property definition within the scope(s) provided. */
    matchIds?: string[];
    /** Optional group a property belongs to, for cross-scope combination. */
    matchGroupIds?: string[];
};

export type DatumPropertyDefinition<K> = PropertyIdentifiers & {
    type: 'key' | 'value';
    valueType: DatumPropertyType;
    property: K;
    invalidValue?: any;
    missingValue?: any;
    separateNegative?: boolean;
    validation?: (value: any, datum: any) => boolean;
    processor?: () => ProcessorFn;
};

type InternalDefinition = { index: number };

type InternalDatumPropertyDefinition<K> = DatumPropertyDefinition<K> &
    InternalDefinition & {
        missing: number;
    };

export type AggregatePropertyDefinition<
    D,
    K extends keyof D & string,
    R = [number, number],
    R2 = R
> = PropertyIdentifiers &
    PropertySelectors & {
        type: 'aggregate';
        aggregateFunction: (values: D[K][], keys?: D[K][]) => R;
        groupAggregateFunction?: (next?: R, acc?: R2) => R2;
        finalFunction?: (result: R2) => [number, number];
    };

export type GroupValueProcessorDefinition<D, K extends keyof D & string> = PropertyIdentifiers &
    PropertySelectors & {
        type: 'group-value-processor';
        /**
         * Outer function called once per all data processing; inner function called once per group;
         * inner-most called once per datum.
         */
        adjust: () => () => (values: D[K][], indexes: number[]) => void;
    };

export type PropertyValueProcessorDefinition<D> = {
    id?: string;
    scopes?: string[];
    type: 'property-value-processor';
    property: PropertyId<keyof D & string>;
    adjust: () => (processedData: ProcessedData<D>, valueIndex: number) => void;
};

export type ReducerOutputPropertyDefinition<R> = {
    id?: string;
    scopes?: string[];
    type: 'reducer';
    property: string;
    initialValue?: R;
    reducer: () => (acc: R, next: UngroupedDataItem<any, any>) => R;
};

export type ProcessorOutputPropertyDefinition<R> = {
    id?: string;
    scopes?: string[];
    type: 'processor';
    property: string;
    calculate: (data: ProcessedData<any>) => R;
};

const INVALID_VALUE = Symbol('invalid');

export class DataModel<
    D extends object,
    K extends keyof D & string = keyof D & string,
    Grouped extends boolean | undefined = undefined
> {
    static DEBUG = () => [true, 'data-model'].includes(windowValue('agChartsDebug') as string) ?? false;

    private readonly opts: DataModelOptions<K, Grouped>;
    private readonly keys: InternalDatumPropertyDefinition<K>[];
    private readonly values: InternalDatumPropertyDefinition<K>[];
    private readonly aggregates: (AggregatePropertyDefinition<D, K> & InternalDefinition)[];
    private readonly groupProcessors: (GroupValueProcessorDefinition<D, K> & InternalDefinition)[];
    private readonly propertyProcessors: (PropertyValueProcessorDefinition<D> & InternalDefinition)[];
    private readonly reducers: (ReducerOutputPropertyDefinition<any> & InternalDefinition)[];
    private readonly processors: (ProcessorOutputPropertyDefinition<any> & InternalDefinition)[];

    public constructor(opts: DataModelOptions<K, Grouped>) {
        const { props } = opts;

        // Validate that keys appear before values in the definitions, as output ordering depends
        // on configuration ordering, but we process keys before values.
        let keys = true;
        for (const next of props) {
            if (next.type === 'key' && !keys) {
                throw new Error('AG Charts - internal config error: keys must come before values.');
            }
            if (next.type === 'value' && keys) {
                keys = false;
            }
        }

        this.opts = { dataVisible: true, ...opts };
        this.keys = props
            .filter((def): def is DatumPropertyDefinition<K> => def.type === 'key')
            .map((def, index) => ({ ...def, index, missing: 0 }));
        this.values = props
            .filter((def): def is DatumPropertyDefinition<K> => def.type === 'value')
            .map((def, index) => ({ ...def, index, missing: 0 }));
        this.aggregates = props
            .filter((def): def is AggregatePropertyDefinition<D, K> => def.type === 'aggregate')
            .map((def, index) => ({ ...def, index }));
        this.groupProcessors = props
            .filter((def): def is GroupValueProcessorDefinition<D, K> => def.type === 'group-value-processor')
            .map((def, index) => ({ ...def, index }));
        this.propertyProcessors = props
            .filter((def): def is PropertyValueProcessorDefinition<D> => def.type === 'property-value-processor')
            .map((def, index) => ({ ...def, index }));
        this.reducers = props
            .filter((def): def is ReducerOutputPropertyDefinition<unknown> => def.type === 'reducer')
            .map((def, index) => ({ ...def, index }));
        this.processors = props
            .filter((def): def is ProcessorOutputPropertyDefinition<unknown> => def.type === 'processor')
            .map((def, index) => ({ ...def, index }));

        for (const def of this.values) {
            if (def.property == null) {
                throw new Error(
                    `AG Charts - internal config error: no properties specified for value definitions: ${JSON.stringify(
                        def
                    )}`
                );
            }
        }

        const verifyMatchGroupId = ({ matchGroupIds }: { matchGroupIds?: string[] }) => {
            for (const matchGroupId of matchGroupIds ?? []) {
                if (!this.values.some((def) => def.groupId === matchGroupId)) {
                    throw new Error(
                        `AG Charts - internal config error: matchGroupIds properties must match defined groups (${matchGroupId}).`
                    );
                }
            }
        };
        const verifyMatchScopes = ({ matchScopes }: { matchScopes?: string[] }) => {
            for (const matchScope of matchScopes ?? []) {
                if (!this.values.some((def) => def.scopes?.includes(matchScope))) {
                    throw new Error(
                        `AG Charts - internal config error: matchGroupIds properties must match defined groups (${matchScope}).`
                    );
                }
            }
        };
        const verifyMatchIds = ({ matchIds }: { matchIds?: string[] }) => {
            for (const matchId of matchIds ?? []) {
                if (!this.values.some((def) => def.id === matchId)) {
                    throw new Error(
                        `AG Charts - internal config error: matchGroupIds properties must match defined groups (${matchId}).`
                    );
                }
            }
        };

        for (const def of [...this.groupProcessors, ...this.aggregates]) {
            verifyMatchIds(def);
            verifyMatchGroupId(def);
            verifyMatchScopes(def);
        }
    }

    resolveProcessedDataIndexById(
        scope: ScopeProvider,
        searchId: string,
        type: PropertyDefinition<any>['type'] = 'value'
    ): { type: typeof type; index: number; def: PropertyDefinition<any> } | never {
        const { index, def } = this.resolveProcessedDataDefById(scope, searchId, type) ?? {};
        return { type, index, def };
    }

    resolveProcessedDataIndicesById(
        scope: ScopeProvider,
        searchId: string | RegExp,
        type: PropertyDefinition<any>['type'] = 'value'
    ): { type: typeof type; index: number; def: PropertyDefinition<any> }[] | never {
        return this.resolveProcessedDataDefsById(scope, searchId, type).map(({ index, def }) => ({ type, index, def }));
    }

    resolveProcessedDataDefById(
        scope: ScopeProvider,
        searchId: string,
        type: PropertyDefinition<any>['type'] = 'value'
    ): { index: number; def: PropertyDefinition<any> } | never {
        return this.resolveProcessedDataDefsById(scope, searchId, type)[0];
    }

    resolveProcessedDataDefsById(
        scope: ScopeProvider,
        searchId: RegExp | string,
        type: PropertyDefinition<any>['type'] = 'value'
    ): { index: number; def: PropertyDefinition<any> }[] | never {
        const { keys, values, aggregates, groupProcessors, reducers } = this;

        const match = (prop: PropertyDefinition<any> & InternalDefinition) => {
            const { id, scopes, type } = prop;

            if (id == null) return false;
            if (scope != null && !scopes?.includes(scope.id)) return false;

            const ids = [id];
            if (type === 'key' || type === 'value') {
                ids.push(...(prop.idAliases ?? []));
            }

            if (typeof searchId === 'string') {
                return ids.indexOf(searchId) >= 0;
            }

            return ids.some((id) => searchId.test(id));
        };

        const allDefs: (PropertyDefinition<any> & InternalDefinition)[][] = [
            keys,
            values,
            aggregates,
            groupProcessors,
            reducers,
        ];
        const result: { index: number; def: PropertyDefinition<any> }[] = [];
        for (const defs of allDefs) {
            result.push(...defs.filter(match).map((def) => ({ index: def.index, def })));
        }

        if (result.length > 0) {
            return result;
        }

        throw new Error(`AG Charts - didn't find property definition for [${searchId}, ${scope.id}, ${type}]`);
    }

    getDomain(
        scope: ScopeProvider,
        searchId: string | RegExp,
        type: PropertyDefinition<any>['type'] = 'value',
        processedData: ProcessedData<K>
    ): any[] | ContinuousDomain<number> | [] {
        let matches;
        try {
            matches = this.resolveProcessedDataIndicesById(scope, searchId, type);
        } catch (e: any) {
            if (typeof searchId !== 'string' && /didn't find property definition/.test(e.message)) return [];
            throw e;
        }

        let domainProp: keyof ProcessedData<any>['domain'];
        switch (type) {
            case 'key':
                domainProp = 'keys';
                break;
            case 'value':
                domainProp = 'values';
                break;
            case 'aggregate':
                domainProp = 'aggValues';
                break;
            case 'group-value-processor':
                domainProp = 'groups';
                break;
            default:
                return [];
        }

        const firstMatch = processedData.domain[domainProp]?.[matches[0].index] ?? [];
        if (matches.length === 1) {
            return firstMatch;
        }

        const result = [...firstMatch];
        for (const idx of matches.slice(1)) {
            extendDomain(processedData.domain[domainProp]?.[idx.index] ?? [], result as ContinuousDomain<any>);
        }
        return result;
    }

    processData(data: D[]): (Grouped extends true ? GroupedData<D> : UngroupedData<D>) | undefined {
        const {
            opts: { groupByKeys, groupByFn },
            aggregates,
            groupProcessors,
            reducers,
            processors,
            propertyProcessors,
        } = this;
        const start = performance.now();

        for (const def of [...this.keys, ...this.values]) {
            def.missing = 0;
        }

        if (groupByKeys && this.keys.length === 0) {
            return undefined;
        }

        let processedData: ProcessedData<D> = this.extractData(data);
        if (groupByKeys) {
            processedData = this.groupData(processedData);
        } else if (groupByFn) {
            processedData = this.groupData(processedData, groupByFn(processedData));
        }
        if (groupProcessors.length > 0) {
            this.postProcessGroups(processedData);
        }
        if (aggregates.length > 0) {
            this.aggregateData(processedData);
        }
        if (propertyProcessors.length > 0) {
            this.postProcessProperties(processedData);
        }
        if (reducers.length > 0) {
            this.reduceData(processedData);
        }
        if (processors.length > 0) {
            this.postProcessData(processedData);
        }

        for (const def of [...this.keys, ...this.values]) {
            if (data.length > 0 && def.missing >= data.length) {
                Logger.warnOnce(`the key '${def.property}' was not found in any data element.`);
            }
        }

        const end = performance.now();
        processedData.time = end - start;

        if (DataModel.DEBUG()) {
            logProcessedData(processedData);
        }

        return processedData as Grouped extends true ? GroupedData<D> : UngroupedData<D>;
    }

    private valueGroupIdxLookup({ matchGroupIds, matchIds, matchScopes }: PropertySelectors) {
        return this.values
            .map((def, index) => ({ def, index }))
            .filter(({ def }) => {
                if (matchGroupIds && (def.groupId == null || !matchGroupIds.includes(def.groupId))) {
                    return false;
                }
                if (matchIds && (def.id == null || !matchIds.includes(def.id))) {
                    return false;
                }
                return !(matchScopes && (def.scopes == null || !matchScopes.some((s) => def.scopes?.includes(s))));
            })
            .map(({ index }) => index);
    }

    private valueIdxLookup(scopes: string[], prop: PropertyId<any>) {
        let result;

        const noScopesToMatch = scopes == null || scopes.length === 0;
        const scopeMatch = (compareTo?: string[]) => {
            const anyScope = compareTo == null;
            if (anyScope) return true;

            const noScopes = compareTo == null || compareTo.length === 0;
            if (noScopesToMatch === noScopes) return true;

            return compareTo?.some((s) => scopes.includes(s));
        };

        if (typeof prop === 'string') {
            result = this.values.findIndex((def) => scopeMatch(def.scopes) && def.property === prop);
        } else {
            result = this.values.findIndex((def) => scopeMatch(def.scopes) && def.id === prop.id);
        }

        if (result >= 0) {
            return result;
        }

        throw new Error(
            `AG Charts - configuration error, unknown property ${JSON.stringify(prop)} in scope(s) ${JSON.stringify(
                scopes
            )}`
        );
    }

    private extractData(data: D[]): UngroupedData<D> {
        const {
            keys: keyDefs,
            values: valueDefs,
            opts: { dataVisible },
        } = this;

        const { dataDomain, processValue, scopes, allScopesHaveSameDefs } = this.initDataDomainProcessor();

        const resultData = new Array(dataVisible ? data.length : 0);
        let resultDataIdx = 0;
        let partialValidDataCount = 0;
        for (const datum of data) {
            const validScopes = scopes.size > 0 ? new Set(scopes) : undefined;
            const keys = dataVisible ? new Array(keyDefs.length) : undefined;
            let keyIdx = 0;
            let key;
            for (const def of keyDefs) {
                key = processValue(def, datum, key);
                if (key === INVALID_VALUE) break;
                if (keys) {
                    keys[keyIdx++] = key;
                }
            }
            if (key === INVALID_VALUE) continue;

            const values = dataVisible && valueDefs.length > 0 ? new Array(valueDefs.length) : undefined;
            let valueIdx = 0;
            let value;
            for (const def of valueDefs) {
                value = processValue(def, datum, value);
                if (value === INVALID_VALUE) {
                    if (allScopesHaveSameDefs) break;
                    for (const scope of def.scopes ?? scopes) {
                        validScopes?.delete(scope);
                    }
                    valueIdx++;
                    if (validScopes?.size === 0) break;
                } else if (values) {
                    values[valueIdx++] = value;
                }
            }
            if (value === INVALID_VALUE && allScopesHaveSameDefs) continue;
            if (validScopes?.size === 0) continue;

            if (dataVisible) {
                const result: UngroupedDataItem<D, any> = {
                    datum,
                    keys: keys!,
                    values,
                };

                if (!allScopesHaveSameDefs && validScopes && validScopes.size < scopes.size) {
                    partialValidDataCount++;
                    result.validScopes = [...validScopes];
                }

                resultData[resultDataIdx++] = result;
            }
        }
        resultData.length = resultDataIdx;

        const propertyDomain = (def: InternalDatumPropertyDefinition<K>) => {
            const result = dataDomain.get(def)!.getDomain();
            if (Array.isArray(result) && result[0] > result[1]) {
                // Ignore starting values.
                return [];
            }
            return [...result];
        };

        return {
            type: 'ungrouped',
            data: resultData,
            domain: {
                keys: keyDefs.map((def) => propertyDomain(def)),
                values: valueDefs.map((def) => propertyDomain(def)),
            },
            defs: {
                allScopesHaveSameDefs,
                keys: keyDefs,
                values: valueDefs,
            },
            partialValidDataCount,
            time: 0,
        };
    }

    private groupData(data: UngroupedData<D>, groupingFn?: GroupingFn<D>): GroupedData<D> {
        const processedData = new Map<string, { keys: D[K][]; values: D[K][][]; datum: D[]; validScopes?: string[] }>();

        for (const dataEntry of data.data) {
            const { keys, values, datum, validScopes } = dataEntry;
            const group = groupingFn ? groupingFn(dataEntry) : keys;
            const groupStr = toKeyString(group);

            if (processedData.has(groupStr)) {
                const existingData = processedData.get(groupStr)!;
                existingData.values.push(values);
                existingData.datum.push(datum);
                if (validScopes != null) {
                    // Intersection of existing validScopes with new validScopes.
                    for (let index = 0; index < (existingData.validScopes?.length ?? 0); index++) {
                        const scope = existingData.validScopes?.[index];
                        if (validScopes.some((s) => s === scope)) continue;

                        existingData.validScopes?.splice(index, 1);
                    }
                }
            } else {
                processedData.set(groupStr, { keys: group, values: [values], datum: [datum], validScopes });
            }
        }

        const resultData = new Array(processedData.size);
        const resultGroups = new Array(processedData.size);
        let dataIndex = 0;
        for (const [, { keys, values, datum, validScopes }] of processedData.entries()) {
            if (validScopes?.length === 0) continue;

            resultGroups[dataIndex] = keys;
            resultData[dataIndex++] = {
                keys,
                values,
                datum,
                validScopes,
            };
        }

        return {
            ...data,
            type: 'grouped',
            data: resultData,
            domain: {
                ...data.domain,
                groups: resultGroups,
            },
        };
    }

    private aggregateData(processedData: ProcessedData<any>) {
        const { aggregates: aggDefs } = this;

        if (!aggDefs) return;

        const resultAggValues = aggDefs.map((): ContinuousDomain<number> => [Infinity, -Infinity]);
        const resultAggValueIndices = aggDefs.map((def) => this.valueGroupIdxLookup(def));
        const resultAggFns = aggDefs.map((def) => def.aggregateFunction);
        const resultGroupAggFns = aggDefs.map((def) => def.groupAggregateFunction);
        const resultFinalFns = aggDefs.map((def) => def.finalFunction);

        for (const group of processedData.data) {
            let { values } = group;
            const { validScopes } = group;
            group.aggValues ??= new Array(resultAggValueIndices.length);

            if (processedData.type === 'ungrouped') {
                values = [values];
            }

            let resultIdx = 0;
            for (const indices of resultAggValueIndices) {
                const scopeValid =
                    validScopes?.some((s) => aggDefs[resultIdx].matchScopes?.some((as) => s === as)) ?? true;
                if (!scopeValid) {
                    resultIdx++;
                    continue;
                }

                let groupAggValues = resultGroupAggFns[resultIdx]?.() ?? extendDomain([]);
                for (const distinctValues of values) {
                    const valuesToAgg = indices.map((valueIdx) => distinctValues[valueIdx] as D[K]);
                    const valuesAgg = resultAggFns[resultIdx](valuesToAgg, group.keys);
                    if (valuesAgg) {
                        groupAggValues =
                            resultGroupAggFns[resultIdx]?.(valuesAgg, groupAggValues) ??
                            extendDomain(valuesAgg, groupAggValues);
                    }
                }

                const finalValues = (resultFinalFns[resultIdx]?.(groupAggValues) ?? groupAggValues).map((v) =>
                    round(v)
                ) as [number, number];
                extendDomain(finalValues, resultAggValues[resultIdx]);
                group.aggValues[resultIdx++] = finalValues;
            }
        }

        processedData.domain.aggValues = resultAggValues;
    }

    private postProcessGroups(processedData: ProcessedData<any>) {
        const { groupProcessors } = this;

        if (!groupProcessors) return;

        const affectedIndices = new Set<number>();
        const updatedDomains = new Map<number, DataDomain>();
        const groupProcessorIndices = new Map<object, number[]>();
        const groupProcessorInitFns = new Map<object, () => (v: any[], i: number[]) => void>();
        for (const processor of groupProcessors) {
            const indices = this.valueGroupIdxLookup(processor);
            groupProcessorIndices.set(processor, indices);
            groupProcessorInitFns.set(processor, processor.adjust());

            for (const idx of indices) {
                const valueDef = this.values[idx];
                affectedIndices.add(idx);
                updatedDomains.set(idx, new DataDomain(valueDef.valueType === 'category' ? 'discrete' : 'continuous'));
            }
        }

        const updateDomains = (values: any[]) => {
            for (const valueIndex of affectedIndices) {
                updatedDomains.get(valueIndex)?.extend(values[valueIndex]);
            }
        };

        for (const group of processedData.data) {
            for (const processor of groupProcessors) {
                const scopeValid =
                    group.validScopes?.some((s) => processor.matchScopes?.some((as) => s === as)) ?? true;
                if (!scopeValid) {
                    continue;
                }

                const valueIndexes = groupProcessorIndices.get(processor) ?? [];
                const adjustFn = groupProcessorInitFns.get(processor)?.() ?? (() => undefined);

                if (processedData.type === 'grouped') {
                    for (const values of group.values) {
                        if (values) {
                            adjustFn(values, valueIndexes);
                        }
                    }
                    continue;
                }

                if (group.values) {
                    adjustFn(group.values as any[], valueIndexes);
                }
            }

            if (processedData.type === 'grouped') {
                for (const values of group.values) {
                    updateDomains(values);
                }
            } else {
                updateDomains(group.values);
            }
        }

        for (const [idx, dataDomain] of updatedDomains) {
            processedData.domain.values[idx] = [...dataDomain.getDomain()];
        }
    }

    private postProcessProperties(processedData: ProcessedData<any>) {
        const { propertyProcessors } = this;

        if (!propertyProcessors) return;

        for (const { adjust, property, scopes } of propertyProcessors) {
            adjust()(processedData, this.valueIdxLookup(scopes ?? [], property));
        }
    }

    private reduceData(processedData: ProcessedData<D>) {
        const { reducers: reducerDefs } = this;

        const scopes = reducerDefs.map((def) => def.scopes);
        const reducers = reducerDefs.map((def) => def.reducer());
        const accValues = reducerDefs.map((def) => def.initialValue);

        for (const group of processedData.data) {
            let reducerIndex = 0;
            for (const reducer of reducers) {
                const scopeValid = group.validScopes?.some((s) => scopes[reducerIndex]?.some((as) => s === as)) ?? true;
                if (!scopeValid) {
                    reducerIndex++;
                    continue;
                }

                accValues[reducerIndex] = reducer(accValues[reducerIndex], group);
                reducerIndex++;
            }
        }

        for (let accIdx = 0; accIdx < accValues.length; accIdx++) {
            processedData.reduced ??= {};
            processedData.reduced[reducerDefs[accIdx].property] = accValues[accIdx];
        }
    }

    private postProcessData(processedData: ProcessedData<D>) {
        const { processors: processorDefs } = this;

        for (const def of processorDefs) {
            processedData.reduced ??= {};
            processedData.reduced[def.property] = def.calculate(processedData);
        }
    }

    private initDataDomainProcessor() {
        const { keys: keyDefs, values: valueDefs } = this;

        const scopes = new Set<string>();
        for (const valueDef of valueDefs) {
            for (const scope of valueDef.scopes ?? []) {
                scopes.add(scope);
            }
        }
        const scopesCount = scopes.size;

        const dataDomain: Map<object, DataDomain> = new Map();
        const processorFns = new Map<InternalDatumPropertyDefinition<K>, ProcessorFn>();
        let allScopesHaveSameDefs = true;
        const initDataDomainKey = (
            key: InternalDatumPropertyDefinition<K>,
            type: DatumPropertyType,
            updateDataDomain: typeof dataDomain = dataDomain
        ) => {
            if (type === 'category') {
                updateDataDomain.set(key, new DataDomain('discrete'));
            } else {
                updateDataDomain.set(key, new DataDomain('continuous'));
                allScopesHaveSameDefs &&= (key.scopes ?? []).length === scopesCount;
            }
        };
        const initDataDomain = () => {
            keyDefs.forEach((def) => initDataDomainKey(def, def.valueType));
            valueDefs.forEach((def) => initDataDomainKey(def, def.valueType));
        };
        initDataDomain();

        const accessors = this.buildAccessors(...keyDefs, ...valueDefs);

        const processValue = (def: InternalDatumPropertyDefinition<K>, datum: any, previousDatum?: any) => {
            const hasAccessor = def.property in accessors;
            let valueInDatum = false;
            let value;
            if (hasAccessor) {
                try {
                    value = accessors[def.property](datum);
                } catch (error: any) {
                    // Swallow errors - these get reported as missing values to the user later.
                }
                valueInDatum = value !== undefined;
            } else {
                valueInDatum = def.property in datum;
                value = valueInDatum ? datum[def.property] : def.missingValue;
            }

            const missingValueDef = 'missingValue' in def;
            if (!valueInDatum && !missingValueDef) {
                def.missing++;
            }

            if (!dataDomain.has(def)) {
                initDataDomain();
            }

            if (valueInDatum) {
                const valid = def.validation?.(value, datum) ?? true;
                if (!valid) {
                    if ('invalidValue' in def) {
                        value = def.invalidValue;
                    } else {
                        return INVALID_VALUE;
                    }
                }
            }

            if (def.processor) {
                if (!processorFns.has(def)) {
                    processorFns.set(def, def.processor());
                }
                value = processorFns.get(def)?.(value, previousDatum !== INVALID_VALUE ? previousDatum : undefined);
            }

            dataDomain.get(def)?.extend(value);
            return value;
        };

        return { dataDomain, processValue, initDataDomain, scopes, allScopesHaveSameDefs };
    }

    buildAccessors(...defs: { property: string }[]) {
        const result: Record<string, (d: any) => any> = {};
        for (const def of defs) {
            const isPath = def.property.indexOf('.') >= 0 || def.property.indexOf('[') >= 0;
            if (!isPath) continue;

            let fnBody;
            if (def.property.startsWith('[')) {
                fnBody = `return datum${def.property};`;
            } else {
                fnBody = `return datum.${def.property};`;
            }
            result[def.property] = new Function('datum', fnBody) as (d: any) => any;
        }
        return result;
    }
}

function logProcessedData(processedData: ProcessedData<any>) {
    const log = (name: string, data: any[]) => {
        if (data.length > 0) {
            // eslint-disable-next-line no-console
            console.log(`DataModel.processData() - ${name}`);
            // eslint-disable-next-line no-console
            console.table(data);
        }
    };

    // eslint-disable-next-line no-console
    console.log('DataModel.processData() - processedData', processedData);
    log('Key Domains', processedData.domain.keys);
    log('Group Domains', processedData.domain.groups ?? []);
    log('Value Domains', processedData.domain.values);
    log('Aggregate Domains', processedData.domain.aggValues ?? []);

    if (processedData.type === 'grouped') {
        const flattenedValues = processedData.data.reduce((acc, next) => {
            const keys = next.keys ?? [];
            const aggValues = next.aggValues ?? [];
            const skipKeys = next.keys.map(() => undefined);
            const skipAggValues = aggValues?.map(() => undefined);
            acc.push(
                ...next.values.map((v, i) => [
                    ...(i === 0 ? keys : skipKeys),
                    ...(v ?? []),
                    ...(i == 0 ? aggValues : skipAggValues),
                ])
            );
            return acc;
        }, [] as any[]);
        log('Values', flattenedValues);
    } else {
        const flattenedValues = processedData.data.reduce((acc, next) => {
            const aggValues = next.aggValues ?? [];
            acc.push([...next.keys, ...next.values, ...aggValues]);
            return acc;
        }, [] as any[]);
        log('Values', flattenedValues);
    }
}
