import { Debug } from '../../util/debug';
import { Logger } from '../../util/logger';
import { isNegative } from '../../util/number';
import { isFiniteNumber, isObject } from '../../util/type-guards';
import type { ChartMode } from '../chartMode';
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
    input: { count: number };
    data: UngroupedDataItem<D, any[]>[];
    domain: {
        keys: any[][];
        values: any[][];
        groups?: any[][];
        aggValues?: [number, number][];
    };
    reduced?: {
        diff?: ProcessedOutputDiff;
        smallestKeyInterval?: number;
        aggValuesExtent?: [number, number];
        sortedGroupDomain?: any[][];
        animationValidation?: {
            uniqueKeys: boolean;
            orderedKeys: boolean;
        };
    };
    defs: {
        keys: DatumPropertyDefinition<keyof D>[];
        values: DatumPropertyDefinition<keyof D>[];
        allScopesHaveSameDefs: boolean;
    };
    partialValidDataCount: number;
    time: number;
}

export type ProcessedOutputDiff = {
    changed: boolean;
    moved: any[];
    added: any[];
    updated: any[];
    removed: any[];
    addedIndices: number[];
    updatedIndices: number[];
    removedIndices: number[];
};

type GroupedDataItem<D> = UngroupedDataItem<D[], any[][]> & { area?: number };

export interface ProcessedDataDef {
    index: number;
    def: PropertyDefinition<any>;
}

export interface GroupedData<D> {
    type: 'grouped';
    input: UngroupedData<D>['input'];
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
    return keys.map((key) => (isObject(key) ? JSON.stringify(key) : key)).join('-');
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

function fixNumericExtentInternal(extent?: (number | Date)[]): [] | [number, number] {
    if (extent === undefined) {
        // Don't return a range, there is no range.
        return [];
    }

    let [min, max] = extent;
    min = Number(min);
    max = Number(max);

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

    return isFiniteNumber(min) && isFiniteNumber(max) ? [min, max] : [];
}

export function fixNumericExtent(
    extent?: (number | Date)[],
    axis?: {
        calculatePadding(min: number, max: number, reversed: boolean): [number, number];
        isReversed(): boolean;
    }
): [] | [number, number] {
    const fixedExtent = fixNumericExtentInternal(extent);

    if (fixedExtent.length === 0) {
        return fixedExtent;
    }

    let [min, max] = fixedExtent;
    if (min === max) {
        // domain has zero length, there is only a single valid value in data

        const [paddingMin, paddingMax] = axis?.calculatePadding(min, max, axis.isReversed()) ?? [1, 1];
        min -= paddingMin;
        max += paddingMax;
    }

    return [min, max];
}

// AG-10337 Keep track of the number of missing values in each per-series data array.
type MissMap = Map<string | undefined, number>;

function defaultMissMap(): MissMap {
    return new Map([[undefined, 0]]);
}

export function getMissCount(scopeProvider: ScopeProvider, missMap: MissMap | undefined) {
    return missMap === undefined ? 0 : missMap.get(scopeProvider.id) ?? 0;
}

type GroupingFn<K> = (data: UngroupedDataItem<K, any[]>) => K[];
export type GroupByFn = (extractedData: UngroupedData<any>) => GroupingFn<any>;
export type DataModelOptions<K, Grouped extends boolean | undefined> = {
    readonly scopes?: string[];
    readonly props: PropertyDefinition<K>[];
    readonly groupByKeys?: Grouped;
    readonly groupByData?: Grouped;
    readonly groupByFn?: GroupByFn;
    readonly dataVisible?: boolean;
    readonly mode?: ChartMode;
};

export type PropertyDefinition<K> =
    | DatumPropertyDefinition<K>
    | AggregatePropertyDefinition<any, any, any>
    | PropertyValueProcessorDefinition<any>
    | GroupValueProcessorDefinition<any, any>
    | ReducerOutputPropertyDefinition<any>
    | ProcessorOutputPropertyDefinition<any>;

export type ProcessorFn = (datum: any, previousDatum?: any) => any;
export type PropertyId<K extends string> = K | { id: string };

type PropertyIdentifiers = {
    /** Scope(s) a property definition belongs to (typically the defining entities unique identifier). */
    scopes?: string[];
    /** Unique id for a property definition within the scope(s) provided. */
    /** Tuples of [scope, id] that match this definition. */
    ids?: [string, string][];
    id?: string;
    /** Optional group a property belongs to, for cross-scope combination. */
    groupId?: string;
};

type PropertySelectors = {
    /** Scope(s) a property definition belongs to (typically the defining entities unique identifier). */
    matchScopes?: string[];
    /** Tuples of [scope, id] that match this definition. */
    matchIds?: [string, string][];
    /** Optional group a property belongs to, for cross-scope combination. */
    matchGroupIds?: string[];
};

export type DatumPropertyDefinition<K> = PropertyIdentifiers & {
    type: 'key' | 'value';
    valueType: DatumPropertyType;
    property: K;
    forceValue?: any;
    invalidValue?: any;
    missing?: MissMap;
    missingValue?: any;
    separateNegative?: boolean;
    useScopedValues?: boolean;
    validation?: (value: any, datum: any) => boolean;
    processor?: () => ProcessorFn;
};

type InternalDefinition = {
    index: number;
};

type InternalDatumPropertyDefinition<K> = DatumPropertyDefinition<K> &
    InternalDefinition & {
        missing: MissMap;
    };

export type AggregatePropertyDefinition<
    D,
    K extends keyof D & string,
    R = [number, number],
    R2 = R,
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

export type PropertyValueProcessorDefinition<D> = PropertyIdentifiers & {
    type: 'property-value-processor';
    property: PropertyId<keyof D & string>;
    adjust: () => (processedData: ProcessedData<D>, valueIndex: number) => void;
};

type ReducerOutputTypes = NonNullable<UngroupedData<any>['reduced']>;
type ReducerOutputKeys = keyof ReducerOutputTypes;
export type ReducerOutputPropertyDefinition<P extends ReducerOutputKeys = ReducerOutputKeys> = PropertyIdentifiers & {
    type: 'reducer';
    property: P;
    initialValue?: ReducerOutputTypes[P];
    reducer: () => (acc: ReducerOutputTypes[P], next: UngroupedDataItem<any, any>) => ReducerOutputTypes[P];
};

export type ProcessorOutputPropertyDefinition<P extends ReducerOutputKeys = ReducerOutputKeys> = PropertyIdentifiers & {
    type: 'processor';
    property: P;
    calculate: (data: ProcessedData<any>) => ReducerOutputTypes[P];
};

const INVALID_VALUE = Symbol('invalid');

export class DataModel<
    D extends object,
    K extends keyof D & string = keyof D & string,
    Grouped extends boolean | undefined = undefined,
> {
    private readonly debug = Debug.create(true, 'data-model');

    private readonly opts: DataModelOptions<K, Grouped>;
    private readonly keys: InternalDatumPropertyDefinition<K>[];
    private readonly values: InternalDatumPropertyDefinition<K>[];
    private readonly aggregates: (AggregatePropertyDefinition<D, K> & InternalDefinition)[];
    private readonly groupProcessors: (GroupValueProcessorDefinition<D, K> & InternalDefinition)[];
    private readonly propertyProcessors: (PropertyValueProcessorDefinition<D> & InternalDefinition)[];
    private readonly reducers: (ReducerOutputPropertyDefinition & InternalDefinition)[];
    private readonly processors: (ProcessorOutputPropertyDefinition & InternalDefinition)[];
    private readonly mode: ChartMode;

    public constructor(opts: DataModelOptions<K, Grouped>) {
        const { props, mode = 'standalone' } = opts;
        this.mode = mode;

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
            .map((def, index) => ({ ...def, index, missing: defaultMissMap() }));
        this.values = props
            .filter((def): def is DatumPropertyDefinition<K> => def.type === 'value')
            .map((def, index) => ({ ...def, index, missing: defaultMissMap() }));
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
            .filter((def): def is ReducerOutputPropertyDefinition => def.type === 'reducer')
            .map((def, index) => ({ ...def, index }));
        this.processors = props
            .filter((def): def is ProcessorOutputPropertyDefinition => def.type === 'processor')
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
        const verifyMatchIds = ({ matchIds }: { matchIds?: [string, string][] }) => {
            for (const matchId of matchIds ?? []) {
                if (
                    !this.values.some((def) =>
                        def.ids?.some(([scope, id]) => scope === matchId[0] && id === matchId[1])
                    )
                ) {
                    throw new Error(
                        `AG Charts - internal config error: matchGroupIds properties must match defined groups (${matchId}).`
                    );
                }
            }
        };

        for (const def of [...this.groupProcessors, ...this.aggregates]) {
            verifyMatchIds(def);
            verifyMatchGroupId(def);
        }
    }

    resolveProcessedDataIndexById(scope: ScopeProvider, searchId: string): ProcessedDataDef | never {
        const { index, def } = this.resolveProcessedDataDefById(scope, searchId) ?? {};
        return { index, def };
    }

    resolveProcessedDataIndicesById(scope: ScopeProvider, searchId: string | RegExp): ProcessedDataDef[] | never {
        return this.resolveProcessedDataDefsById(scope, searchId).map(({ index, def }) => ({ index, def }));
    }

    resolveProcessedDataDefById(scope: ScopeProvider, searchId: string): ProcessedDataDef | never {
        return this.resolveProcessedDataDefsById(scope, searchId)[0];
    }

    resolveProcessedDataDefsByIds<T extends string>(
        scope: ScopeProvider,
        searchIds: T[]
    ): [T, ProcessedDataDef[]][] | never {
        const defs: [T, ProcessedDataDef[]][] = [];
        for (const searchId of searchIds) {
            defs.push([searchId, this.resolveProcessedDataDefsById(scope, searchId)]);
        }
        return defs;
    }

    resolveProcessedDataDefsValues<T extends string>(
        defs: [T, ProcessedDataDef[]][],
        { keys, values }: { keys: unknown[]; values: unknown[] }
    ): Record<T, any> {
        const result: Record<string, any> = {};
        for (const [searchId, [{ index, def }]] of defs) {
            const processedData = def.type === 'key' ? keys : values;
            result[searchId] = processedData[index];
        }
        return result;
    }

    resolveProcessedDataDefsById(searchScope: ScopeProvider, searchId: RegExp | string): ProcessedDataDef[] | never {
        const { keys, values, aggregates, groupProcessors, reducers } = this;

        const match = (prop: PropertyDefinition<any> & InternalDefinition) => {
            const { ids, scopes } = prop;

            if (ids == null) return false;
            if (searchScope != null && !scopes?.some((scope) => scope === searchScope.id)) return false;

            return ids.some(
                ([scope, id]) =>
                    scope === searchScope.id && (typeof searchId === 'string' ? id === searchId : searchId.test(id))
            );
        };

        const allDefs: (PropertyDefinition<any> & InternalDefinition)[][] = [
            keys,
            values,
            aggregates,
            groupProcessors,
            reducers,
        ];
        const result: ProcessedDataDef[] = [];
        for (const defs of allDefs) {
            result.push(...defs.filter(match).map((def) => ({ index: def.index, def })));
        }

        if (result.length > 0) {
            return result;
        }

        throw new Error(`AG Charts - didn't find property definition for [${searchId}, ${searchScope.id}]`);
    }

    getDomain(
        scope: ScopeProvider,
        searchId: string | RegExp,
        type: PropertyDefinition<any>['type'] = 'value',
        processedData: ProcessedData<K>
    ): any[] | ContinuousDomain<number> | [] {
        let matches;
        try {
            matches = this.resolveProcessedDataIndicesById(scope, searchId);
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

    processData(
        data: D[],
        sources?: { id: string; data: D[] }[]
    ): (Grouped extends true ? GroupedData<D> : UngroupedData<D>) | undefined {
        const {
            opts: { groupByKeys, groupByFn },
            aggregates,
            groupProcessors,
            reducers,
            processors,
            propertyProcessors,
        } = this;
        const start = performance.now();

        if (groupByKeys && this.keys.length === 0) {
            return;
        }

        let processedData: ProcessedData<D> = this.extractData(data, sources);
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
            if (data.length > 0) {
                for (const [scope, missCount] of def.missing) {
                    if (missCount >= data.length) {
                        const scopeHint = scope === undefined ? '' : ` for ${scope}`;
                        Logger.warnOnce(`the key '${def.property}' was not found in any data element${scopeHint}.`);
                    }
                }
            }
        }

        const end = performance.now();
        processedData.time = end - start;

        if (this.debug.check()) {
            logProcessedData(processedData);
        }

        return processedData as Grouped extends true ? GroupedData<D> : UngroupedData<D>;
    }

    private valueGroupIdxLookup({ matchGroupIds, matchIds }: PropertySelectors) {
        return this.values
            .map((def, index) => ({ def, index }))
            .filter(({ def }) => {
                if (matchGroupIds && (def.groupId == null || !matchGroupIds.includes(def.groupId))) {
                    return false;
                }
                if (!matchIds) return true;
                if (def.ids == null) return false;

                return matchIds.some(([matchScope, matchId]) =>
                    def.ids?.some(([defScope, defId]) => defScope === matchScope && defId === matchId)
                );
            })
            .map(({ index }) => index);
    }

    private valueIdxLookup(scopes: string[], prop: PropertyId<string>) {
        const noScopesToMatch = scopes == null || scopes.length === 0;
        const scopeMatch = (compareTo?: string[]) => {
            const anyScope = compareTo == null;
            if (anyScope) return true;

            const noScopes = compareTo == null || compareTo.length === 0;
            if (noScopesToMatch === noScopes) return true;

            return compareTo?.some((s) => scopes.includes(s));
        };

        const propId = typeof prop === 'string' ? prop : prop.id;
        const idMatch = ([scope, id]: [string, string]) => {
            return scopeMatch([scope]) && id === propId;
        };

        const result = this.values.findIndex((def) => {
            return (
                scopeMatch(def.scopes) &&
                (def.ids?.some((id) => idMatch(id)) || def.property === propId || def.id === propId)
            );
        });

        if (result >= 0) {
            return result;
        }

        throw new Error(
            `AG Charts - configuration error, unknown property ${JSON.stringify(prop)} in scope(s) ${JSON.stringify(
                scopes
            )}`
        );
    }

    private extractData(data: D[], sources?: { id: string; data: D[] }[]): UngroupedData<D> {
        const {
            keys: keyDefs,
            values: valueDefs,
            opts: { dataVisible },
        } = this;

        const { dataDomain, processValue, scopes, allScopesHaveSameDefs } = this.initDataDomainProcessor();

        const resultData = new Array(dataVisible ? data.length : 0);
        let resultDataIdx = 0;
        let partialValidDataCount = 0;

        for (const [datumIdx, datum] of data.entries()) {
            const sourceDatums: Record<string, any> = {};

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
            let value;

            const sourcesById: { [key: string]: { id: string; data: D[] } } = {};
            for (const source of sources ?? []) {
                sourcesById[source.id] = source;
            }

            for (const [valueDefIdx, def] of valueDefs.entries()) {
                for (const scope of def.scopes ?? scopes) {
                    const source = sourcesById[scope];
                    const valueDatum = source?.data[datumIdx] ?? datum;

                    value = processValue(def, valueDatum, value, scope);

                    if (value === INVALID_VALUE || !values) continue;

                    if (source !== undefined) {
                        sourceDatums[source.id] ??= {};
                        sourceDatums[source.id][def.property] = value;
                    }

                    if (def.useScopedValues) {
                        values[valueDefIdx] ??= {};
                        values[valueDefIdx][scope] = value;
                    } else {
                        values[valueDefIdx] = value;
                    }
                }

                if (value === INVALID_VALUE) {
                    if (allScopesHaveSameDefs) break;
                    for (const scope of def.scopes ?? scopes) {
                        validScopes?.delete(scope);
                    }
                    if (validScopes?.size === 0) break;
                }
            }

            if (value === INVALID_VALUE && allScopesHaveSameDefs) continue;
            if (validScopes?.size === 0) continue;

            if (dataVisible) {
                const result: UngroupedDataItem<D, any> = {
                    datum: { ...datum, ...sourceDatums },
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
            input: { count: data.length },
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
                processedData.set(groupStr, {
                    keys: group,
                    values: [values],
                    datum: [datum],
                    validScopes,
                });
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
            processedData.reduced[reducerDefs[accIdx].property] = accValues[accIdx] as any;
        }
    }

    private postProcessData(processedData: ProcessedData<D>) {
        const { processors: processorDefs } = this;

        for (const def of processorDefs) {
            processedData.reduced ??= {};
            processedData.reduced[def.property] = def.calculate(processedData) as any;
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

        const processValue = (
            def: InternalDatumPropertyDefinition<K>,
            datum: any,
            previousDatum?: any,
            scope?: string
        ) => {
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

            if (def.forceValue != null) {
                // Maintain sign of forceValue from actual value, this maybe significant later when
                // we account fo the value falling into positive/negative buckets.
                const valueNegative = valueInDatum && isNegative(value);
                value = valueNegative ? -1 * def.forceValue : def.forceValue;
                valueInDatum = true;
            }

            const missingValueDef = 'missingValue' in def;
            if (!valueInDatum && !missingValueDef) {
                const missCount = def.missing.get(scope) ?? 0;
                def.missing.set(scope, missCount + 1);
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
                        if (this.mode !== 'integrated') {
                            Logger.warnOnce(`invalid value of type [${typeof value}] ignored:`, `[${value}]`);
                        }
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
        if (this.mode === 'integrated') return result;

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
    const logValues = (name: string, data: any[]) => {
        if (data.length > 0) {
            Logger.log(`DataModel.processData() - ${name}`);
            Logger.table(data);
        }
    };

    Logger.log('DataModel.processData() - processedData', processedData);
    logValues('Key Domains', processedData.domain.keys);
    logValues('Group Domains', processedData.domain.groups ?? []);
    logValues('Value Domains', processedData.domain.values);
    logValues('Aggregate Domains', processedData.domain.aggValues ?? []);

    if (processedData.type === 'grouped') {
        const flattenedValues = processedData.data.reduce<any[]>((acc, next) => {
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
        }, []);
        logValues('Values', flattenedValues);
    } else {
        const flattenedValues = processedData.data.reduce<any[]>((acc, next) => {
            const aggValues = next.aggValues ?? [];
            acc.push([...next.keys, ...next.values, ...aggValues]);
            return acc;
        }, []);
        logValues('Values', flattenedValues);
    }
}
