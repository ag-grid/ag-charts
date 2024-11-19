import { Debug } from '../../util/debug';
import { iterate } from '../../util/iterator';
import { Logger } from '../../util/logger';
import { isNegative } from '../../util/number';
import { isFiniteNumber, isObject } from '../../util/type-guards';
import type { ChartMode } from '../chartMode';
import { ContinuousDomain, DiscreteDomain, type IDataDomain } from './dataDomain';

export interface ScopeProvider {
    id: string;
}

export interface DataGroup {
    keys: any[];
    datumIndices: number[];
    aggregation: any[][];
    validScopes: Set<string> | undefined;
}

export interface UngroupedDataItem<I, D, V> {
    index: I;
    keys: any[];
    values: V;
    aggValues?: [number, number][];
    datum: D;
    validScopes?: Set<string>;
}

export interface UngroupedData<D> {
    type: 'ungrouped';
    input: { count: number };
    rawData: any[];
    rawDataSources?: Map<string, any[]>;
    aggregation: [number, number][][] | undefined;
    invalidKeys: boolean[] | undefined;
    invalidDataScopes: Map<string, boolean[]> | undefined;
    invalidData: boolean[] | undefined;
    keys: any[][];
    columns: any[][];
    domain: {
        keys: any[][];
        values: any[][];
        groups?: any[][];
        aggValues?: [number, number][];
    };
    reduced?: {
        diff?: ProcessedOutputDiff;
        smallestKeyInterval?: number;
        largestKeyInterval?: number;
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
    added: Set<string>;
    updated: Set<string>;
    removed: Set<string>;
    moved: Set<string>;
};

export type GroupedDataItem<D> = UngroupedDataItem<number[], D[], any[][]> & { area?: number };

export interface ProcessedDataDef {
    index: number;
    def: PropertyDefinition<any>;
}

export interface GroupedData<D> {
    type: 'grouped';
    input: UngroupedData<D>['input'];
    rawData: any[];
    rawDataSources?: Map<string, any[]>;
    groups: DataGroup[];
    keys: any[][];
    invalidKeys: boolean[] | undefined;
    invalidDataScopes: Map<string, boolean[]> | undefined;
    invalidData: boolean[] | undefined;
    columns: any[][];
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

export function fixNumericExtent(extent: Array<number | Date> | null): [] | [number, number] {
    if (extent == null) {
        return [];
    }
    const [min, max] = extent.map(Number);
    // If domain has a single valid value, 0, use the default extent of [0, 1].
    if (min === 0 && max === 0) {
        return [0, 1];
    }
    return isFiniteNumber(min) && isFiniteNumber(max) ? [min, max] : [];
}

// AG-10337 Keep track of the number of missing values in each per-series data array.
type MissMap = Map<string | undefined, number>;

export function getMissCount(scopeProvider: ScopeProvider, missMap: MissMap | undefined) {
    return missMap?.get(scopeProvider.id) ?? 0;
}

type GroupingFn<K> = (data: UngroupedDataItem<number, K, any[]>) => K[];
export type GroupByFn = (extractedData: UngroupedData<any>) => GroupingFn<any>;
export type DataModelOptions<K, Grouped extends boolean | undefined> = {
    scopes?: string[];
    props: PropertyDefinition<K>[];
    groupByKeys?: Grouped;
    groupByData?: Grouped;
    groupByFn?: GroupByFn;
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
    id?: string;
    /** Map<Scope, Set<Id>> */
    idsMap?: Map<string, Set<string>>;
    /** Optional group a property belongs to, for cross-scope combination. */
    groupId?: string;
};

type PropertySelectors = {
    /** Optional group a property belongs to, for cross-scope combination. */
    matchGroupIds?: string[];
};

export type DatumPropertyDefinition<K> = PropertyIdentifiers & {
    type: 'key' | 'value';
    valueType: DatumPropertyType;
    property: K;
    forceValue?: any;
    includeProperty?: boolean;
    invalidValue?: any;
    missing?: MissMap;
    missingValue?: any;
    separateNegative?: boolean;
    validation?: (value: any, datum: any, index: number) => boolean;
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

type GroupValueAdjustFn<D, K extends keyof D & string> = (columns: D[K][][], indexes: number[], index: number) => void;

export type GroupValueProcessorDefinition<D, K extends keyof D & string> = PropertyIdentifiers &
    PropertySelectors & {
        type: 'group-value-processor';
        /**
         * Outer function called once per all data processing; inner function called once per group;
         * innermost called once per datum.
         */
        adjust: () => () => GroupValueAdjustFn<D, K>;
    };

type PropertyValueAdjustFn<D> = (processedData: ProcessedData<D>, valueIndex: number) => void;

export type PropertyValueProcessorDefinition<D> = PropertyIdentifiers & {
    type: 'property-value-processor';
    property: string;
    adjust: () => PropertyValueAdjustFn<D>;
};

type ReducerOutputTypes = NonNullable<UngroupedData<any>['reduced']>;
type ReducerOutputKeys = keyof ReducerOutputTypes;
export type ReducerOutputPropertyDefinition<P extends ReducerOutputKeys = ReducerOutputKeys> = PropertyIdentifiers & {
    type: 'reducer';
    property: P;
    initialValue?: ReducerOutputTypes[P];
    reducer: () => (acc: ReducerOutputTypes[P], next: UngroupedDataItem<any, any, any>) => ReducerOutputTypes[P];
};

export type ProcessorOutputPropertyDefinition<P extends ReducerOutputKeys = ReducerOutputKeys> = PropertyIdentifiers & {
    type: 'processor';
    property: P;
    calculate: (data: ProcessedData<any>) => ReducerOutputTypes[P];
};

const INVALID_VALUE = Symbol('invalid');

function createArray<T>(length: number, value: T): T[] {
    const out: T[] = [];
    for (let i = 0; i < length; i += 1) {
        out[i] = value;
    }
    return out;
}

export function datumKeys(keys: any[][], datumIndex: number): any[] | undefined {
    const out: any = [];

    for (const k of keys) {
        const key = k[datumIndex];
        if (key == null) return;
        out.push(key);
    }

    return out;
}

export function getPathComponents(path: string) {
    const components: string[] = [];
    let matchIndex = 0;
    let matchGroup: RegExpExecArray | null;
    // eslint-disable-next-line sonarjs/regex-complexity
    const regExp = /((?:(?:^|\.)\s*\w+|\[\s*(?:'(?:[^']|(?<!\\)\\')*'|"(?:[^"]|(?<!\\)\\")*"|-?\d+)\s*\])\s*)/g;
    /**              ^                         ^                      ^                      ^
     *               |                         |                      |                      |
     *                - .dotAccessor or initial property (i.e. a in "a.b")                   |
     *                                         |                      |                      |
     *                                          - ['single-quoted']                          |
     *                                                                |                      |
     *                                                                 - ["double-quoted"]   |
     *                                                                                       |
     *                                                                                        - [0] index properties
     */
    while ((matchGroup = regExp.exec(path))) {
        if (matchGroup.index !== matchIndex) {
            return;
        }
        matchIndex = matchGroup.index + matchGroup[0].length;
        const match = matchGroup[1].trim();
        if (match.startsWith('.')) {
            // .property
            components.push(match.slice(1).trim());
        } else if (match.startsWith('[')) {
            const accessor = match.slice(1, -1).trim();
            if (accessor.startsWith(`'`)) {
                // ['string-property']
                components.push(accessor.slice(1, -1).replace(/(?<!\\)\\'/g, `'`));
            } else if (accessor.startsWith(`"`)) {
                // ["string-property"]
                components.push(accessor.slice(1, -1).replace(/(?<!\\)\\"/g, `"`));
            } else {
                // ["number-property"]
                components.push(accessor);
            }
        } else {
            // thisProperty.other["properties"]['afterwards']
            components.push(match);
        }
    }

    if (matchIndex !== path.length) return;

    return components;
}

function createPathAccessor(components: string[]) {
    return (datum: any): any => {
        let current = datum;
        for (const component of components) {
            current = current[component];
        }
        return current;
    };
}

export class DataModel<
    D extends object,
    K extends keyof D & string = keyof D & string,
    Grouped extends boolean | undefined = undefined,
> {
    private readonly debug = Debug.create(true, 'data-model');
    private readonly scopeCache: Map<string, Map<string, PropertyDefinition<any> & InternalDefinition>> = new Map();

    private readonly keys: InternalDatumPropertyDefinition<K>[] = [];
    private readonly values: InternalDatumPropertyDefinition<K>[] = [];
    private readonly aggregates: (AggregatePropertyDefinition<D, K> & InternalDefinition)[] = [];
    private readonly groupProcessors: (GroupValueProcessorDefinition<D, K> & InternalDefinition)[] = [];
    private readonly propertyProcessors: (PropertyValueProcessorDefinition<D> & InternalDefinition)[] = [];
    private readonly reducers: (ReducerOutputPropertyDefinition & InternalDefinition)[] = [];
    private readonly processors: (ProcessorOutputPropertyDefinition & InternalDefinition)[] = [];

    public constructor(
        private readonly opts: DataModelOptions<K, Grouped>,
        private readonly mode: ChartMode = 'standalone'
    ) {
        // Validate that keys appear before values in the definitions, as output ordering depends
        // on configuration ordering, but we process keys before values.
        let keys = true;
        for (const next of opts.props) {
            if (next.type === 'key' && !keys) {
                throw new Error('AG Charts - internal config error: keys must come before values.');
            }
            if (next.type === 'value' && keys) {
                keys = false;
            }
        }

        const verifyMatchGroupId = ({ matchGroupIds = [] }: { matchGroupIds?: string[] }) => {
            for (const matchGroupId of matchGroupIds) {
                if (this.values.every((def) => def.groupId !== matchGroupId)) {
                    throw new Error(
                        `AG Charts - internal config error: matchGroupIds properties must match defined groups (${matchGroupId}).`
                    );
                }
            }
        };

        for (const def of opts.props) {
            switch (def.type) {
                case 'key':
                    this.keys.push({ ...def, index: this.keys.length, missing: new Map() });
                    break;

                case 'value':
                    if (def.property == null) {
                        throw new Error(
                            `AG Charts - internal config error: no properties specified for value definitions: ${JSON.stringify(
                                def
                            )}`
                        );
                    }
                    this.values.push({ ...def, index: this.values.length, missing: new Map() });
                    break;

                case 'aggregate':
                    verifyMatchGroupId(def);
                    this.aggregates.push({ ...def, index: this.aggregates.length });
                    break;

                case 'group-value-processor':
                    verifyMatchGroupId(def);
                    this.groupProcessors.push({ ...def, index: this.groupProcessors.length });
                    break;

                case 'property-value-processor':
                    this.propertyProcessors.push({ ...def, index: this.propertyProcessors.length });
                    break;

                case 'reducer':
                    this.reducers.push({ ...def, index: this.reducers.length });
                    break;

                case 'processor':
                    this.processors.push({ ...def, index: this.processors.length });
                    break;
            }
        }
    }

    resolveProcessedDataDefById(scope: ScopeProvider, searchId: string): ProcessedDataDef | never {
        const def = this.scopeCache.get(scope.id)?.get(searchId);

        if (!def) {
            throw new Error(`AG Charts - didn't find property definition for [${searchId}, ${scope.id}]`);
        }

        return { index: def.index, def };
    }

    resolveProcessedDataIndexById(scope: ScopeProvider, searchId: string): number {
        return this.resolveProcessedDataDefById(scope, searchId).index;
    }

    resolveProcessedDataDefsByIds<T extends string>(scope: ScopeProvider, searchIds: T[]): [T, ProcessedDataDef][] {
        return searchIds.map((searchId) => [searchId, this.resolveProcessedDataDefById(scope, searchId)]);
    }

    resolveKeysById<T = string>(
        scope: ScopeProvider,
        searchId: string,
        processedData: UngroupedData<any> | GroupedData<any>
    ): (T | undefined)[] {
        const index = this.resolveProcessedDataIndexById(scope, searchId);
        const keys = processedData.keys[index];
        if (keys == null) {
            throw new Error(`AG Charts - didn't find keys for [${searchId}, ${scope.id}]`);
        }
        return keys;
    }

    resolveColumnById<T = any>(
        scope: ScopeProvider,
        searchId: string,
        processedData: UngroupedData<any> | GroupedData<any>
    ): T[] {
        const index = this.resolveProcessedDataIndexById(scope, searchId);
        const column = processedData.columns?.[index];
        if (column == null) {
            throw new Error(`AG Charts - didn't find column for [${searchId}, ${scope.id}]`);
        }
        return column;
    }

    resolveProcessedDataDefsValues<T extends string>(
        defs: [T, ProcessedDataDef][],
        { keys, values }: { keys: unknown[]; values: unknown[] }
    ): Record<T, any> {
        const result: Record<string, any> = {};
        for (const [searchId, { index, def }] of defs) {
            const processedData = def.type === 'key' ? keys : values;
            result[searchId] = processedData[index];
        }
        return result;
    }

    getDomain(
        scope: ScopeProvider,
        searchId: string,
        type: PropertyDefinition<any>['type'],
        processedData: ProcessedData<K>
    ): any[] | [number, number] | [] {
        const domains = this.getDomainsByType(type ?? 'value', processedData);
        return domains?.[this.resolveProcessedDataIndexById(scope, searchId)] ?? [];
    }

    private getDomainsByType(type: PropertyDefinition<any>['type'], processedData: ProcessedData<K>) {
        switch (type) {
            case 'key':
                return processedData.domain.keys;
            case 'value':
                return processedData.domain.values;
            case 'aggregate':
                return processedData.domain.aggValues;
            case 'group-value-processor':
                return processedData.domain.groups;
            default:
                return null;
        }
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

        this.warnDataMissingProperties(data);

        const end = performance.now();
        processedData.time = end - start;

        if (this.debug.check()) {
            logProcessedData(processedData);
        }

        this.processScopeCache();

        return processedData as Grouped extends true ? GroupedData<D> : UngroupedData<D>;
    }

    private warnDataMissingProperties(data: D[]) {
        if (data.length === 0) return;

        for (const def of iterate(this.keys, this.values)) {
            for (const [scope, missCount] of def.missing) {
                if (missCount < data.length) continue;
                const scopeHint = scope == null ? '' : ` for ${scope}`;
                Logger.warnOnce(`the key '${def.property}' was not found in any data element${scopeHint}.`);
            }
        }
    }

    private processScopeCache() {
        this.scopeCache.clear();
        for (const def of iterate(this.keys, this.values, this.aggregates)) {
            if (!def.idsMap) continue;
            for (const [scope, ids] of def.idsMap) {
                for (const id of ids) {
                    if (!this.scopeCache.has(scope)) {
                        this.scopeCache.set(scope, new Map([[id, def]]));
                    } else if (this.scopeCache.get(scope)?.has(id)) {
                        throw new Error('duplicate definition ids on the same scope are not allowed.');
                    } else {
                        this.scopeCache.get(scope)!.set(id, def);
                    }
                }
            }
        }
    }

    private valueGroupIdxLookup({ matchGroupIds }: PropertySelectors) {
        const result: number[] = [];
        for (const [index, def] of this.values.entries()) {
            if (!matchGroupIds || (def.groupId && matchGroupIds.includes(def.groupId))) {
                result.push(index);
            }
        }
        return result;
    }

    private valueIdxLookup(scopes: string[] | undefined, prop: PropertyId<string>) {
        const noScopesToMatch = scopes == null || scopes.length === 0;
        const propId = typeof prop === 'string' ? prop : prop.id;

        const hasMatchingScopeId = (def: InternalDatumPropertyDefinition<K>) => {
            if (def.idsMap) {
                for (const [scope, ids] of def.idsMap) {
                    if (scopes?.includes(scope) && ids.has(propId)) {
                        return true;
                    }
                }
            }
            return false;
        };

        const result = this.values.reduce((res, def, index) => {
            const validDefScopes =
                def.scopes == null ||
                (noScopesToMatch && !def.scopes.length) ||
                def.scopes.some((s) => scopes?.includes(s));

            if (validDefScopes && (def.property === propId || def.id === propId || hasMatchingScopeId(def))) {
                res.push(index);
            }
            return res;
        }, [] as number[]);

        if (result.length === 0) {
            throw new Error(
                `AG Charts - configuration error, unknown property ${JSON.stringify(prop)} in scope(s) ${JSON.stringify(
                    scopes
                )}`
            );
        }

        return result;
    }

    private extractData(data: D[], sources?: { id: string; data: D[] }[]): UngroupedData<D> {
        const { dataDomain, processValue, scopes, allScopesHaveSameDefs } = this.initDataDomainProcessor();
        const sourcesById = new Map(sources?.map((s) => [s.id, s]));
        const { keys: keyDefs, values: valueDefs } = this;

        const dataLength = data.length;

        let partialValidDataCount = 0;

        let invalidKeys: boolean[] | undefined;
        let invalidData: boolean[] | undefined;
        const keys = keyDefs.map((def) => {
            const { invalidValue } = def;

            return data.map((datum, datumIndex) => {
                const key = processValue(def, datum, datumIndex);

                if (key !== INVALID_VALUE) return key;

                invalidKeys ??= createArray(dataLength, false);
                invalidKeys[datumIndex] = true;

                invalidData ??= createArray(dataLength, false);
                invalidData[datumIndex] = true;

                return invalidValue;
            });
        });

        let invalidDataScopes: Map<string, boolean[]> | undefined;
        const markScopeDatumInvalid = (scope: string, datumIndex: number) => {
            invalidDataScopes ??= new Map();
            let datumValidity = invalidDataScopes.get(scope);
            if (datumValidity == null) {
                datumValidity = createArray(dataLength, false);
                invalidDataScopes.set(scope, datumValidity);
            }
            datumValidity[datumIndex] = true;

            invalidData ??= createArray(dataLength, false);
            invalidData[datumIndex] = true;
        };

        const columns: any[][] = [];
        valueDefs.forEach((def) => {
            const { invalidValue } = def;

            const previousColumn = columns.length > 0 ? columns[columns.length - 1] : undefined;

            const column = data.map((datum, datumIndex) => {
                const invalidKey = invalidKeys?.[datumIndex] === true;
                let value = previousColumn?.[datumIndex];
                for (const scope of def.scopes ?? scopes) {
                    const source = sourcesById.get(scope);
                    const valueDatum = source?.data[datumIndex] ?? datum;

                    value = processValue(def, valueDatum, datumIndex, value, scope);

                    if (invalidKey || value === INVALID_VALUE) {
                        markScopeDatumInvalid(scope, datumIndex);
                    }
                }

                if (invalidKey) {
                    return invalidValue;
                } else if (value === INVALID_VALUE) {
                    partialValidDataCount += 1;

                    return invalidValue;
                }

                return value;
            });

            columns.push(column);
        });

        const propertyDomain = (def: InternalDatumPropertyDefinition<K>) => {
            const defDomain = dataDomain.get(def)!;
            const result = defDomain.getDomain();
            // Ignore starting values.
            if (ContinuousDomain.is(defDomain) && result[0] > result[1]) {
                return [];
            }
            return result;
        };

        return {
            type: 'ungrouped',
            input: { count: data.length },
            rawData: data,
            rawDataSources: sources != null ? new Map(sources.map((s) => [s.id, s.data])) : undefined,
            aggregation: undefined,
            keys,
            columns,
            invalidKeys,
            invalidDataScopes,
            invalidData,
            domain: {
                keys: keyDefs.map(propertyDomain),
                values: valueDefs.map(propertyDomain),
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
        const groups = new Map<string, { keys: D[K][]; datumIndices: number[]; validScopes?: Set<string> }>();

        const { rawData, keys: dataKeys, invalidKeys, invalidDataScopes, invalidData } = data;
        for (let datumIndex = 0; datumIndex < rawData.length; datumIndex += 1) {
            const datum = rawData[datumIndex];
            const keys = datumKeys(dataKeys, datumIndex);
            if (keys == null || keys.length === 0) continue;

            const group =
                groupingFn?.({
                    index: datumIndex,
                    keys,
                    values: undefined!,
                    aggValues: undefined!,
                    datum,
                    validScopes: undefined!,
                }) ?? keys;
            const groupStr = toKeyString(group);

            if (invalidKeys?.[datumIndex] === true) continue;

            let validScopes: Set<string> | undefined;
            if (invalidDataScopes != null && invalidData?.[datumIndex] === true) {
                validScopes = new Set();
                invalidDataScopes.forEach((invalidDatums, scope) => {
                    if (invalidDatums[datumIndex] === false) {
                        validScopes!.add(scope);
                    }
                });

                if (validScopes.size === 0) continue;
            }

            const existingGroup = groups.get(groupStr);
            if (existingGroup != null) {
                existingGroup.datumIndices.push(datumIndex);

                if (validScopes != null && existingGroup.validScopes != null) {
                    // Intersection of existing validScopes with new validScopes.
                    for (const scope of existingGroup.validScopes) {
                        if (!validScopes.has(scope)) {
                            existingGroup.validScopes.delete(scope);
                        }
                    }
                }
            } else {
                groups.set(groupStr, {
                    keys: group,
                    datumIndices: [datumIndex],
                    validScopes,
                });
            }
        }

        const resultGroups = [];
        const resultData = [];
        for (const { keys, datumIndices, validScopes } of groups.values()) {
            if (validScopes?.size === 0) continue;

            resultGroups.push(keys);
            resultData.push({
                datumIndices,
                keys,
                aggregation: [],
                validScopes,
            });
        }

        return {
            ...data,
            type: 'grouped',
            domain: {
                ...data.domain,
                groups: resultGroups,
            },
            groups: resultData,
        };
    }

    private aggregateData(processedData: ProcessedData<any>) {
        const domainAggValues = this.aggregates.map((): [number, number] => [Infinity, -Infinity]);
        processedData.domain.aggValues = domainAggValues;

        const { keys, columns, rawData } = processedData;

        if (processedData.type === 'ungrouped') {
            const resultAggregation = rawData.map((_datum, datumIndex) => {
                const aggregation: [number, number][] = [];

                for (const [index, def] of this.aggregates.entries()) {
                    const indices = this.valueGroupIdxLookup(def);
                    let groupAggValues = def.groupAggregateFunction?.() ?? [Infinity, -Infinity];
                    const valuesToAgg = indices.map((columnIndex) => columns[columnIndex][datumIndex] as D[K]);
                    const k = datumKeys(keys, datumIndex);
                    const valuesAgg = k != null ? def.aggregateFunction(valuesToAgg, k) : undefined;
                    if (valuesAgg) {
                        groupAggValues =
                            def.groupAggregateFunction?.(valuesAgg, groupAggValues) ??
                            ContinuousDomain.extendDomain(valuesAgg, groupAggValues);
                    }

                    const finalValues = (def.finalFunction?.(groupAggValues) ?? groupAggValues).map((v) =>
                        round(v)
                    ) as [number, number];

                    aggregation[index] = finalValues;
                    ContinuousDomain.extendDomain(finalValues, domainAggValues[index]);
                }

                return aggregation;
            });

            processedData.aggregation = resultAggregation;
        } else {
            for (const [index, def] of this.aggregates.entries()) {
                const indices = this.valueGroupIdxLookup(def);

                for (const group of processedData.groups) {
                    group.aggregation ??= [];

                    if (group.validScopes != null) continue;

                    const groupKeys = group.keys;

                    let groupAggValues = def.groupAggregateFunction?.() ?? [Infinity, -Infinity];
                    for (const datumIndex of group.datumIndices) {
                        const valuesToAgg = indices.map((columnIndex) => columns[columnIndex][datumIndex] as D[K]);
                        const valuesAgg = def.aggregateFunction(valuesToAgg, groupKeys);
                        if (valuesAgg) {
                            groupAggValues =
                                def.groupAggregateFunction?.(valuesAgg, groupAggValues) ??
                                ContinuousDomain.extendDomain(valuesAgg, groupAggValues);
                        }
                    }

                    const finalValues = (def.finalFunction?.(groupAggValues) ?? groupAggValues).map((v) =>
                        round(v)
                    ) as [number, number];

                    group.aggregation[index] = finalValues;
                    ContinuousDomain.extendDomain(finalValues, domainAggValues[index]);
                }
            }
        }
    }

    private postProcessGroups(processedData: ProcessedData<any>) {
        const { groupProcessors } = this;

        const { rawData, columns, invalidData } = processedData;
        for (const processor of groupProcessors) {
            const valueIndexes = this.valueGroupIdxLookup(processor);
            const adjustFn = processor.adjust()();

            for (let datumIndex = 0; datumIndex < rawData.length; datumIndex += 1) {
                if (invalidData?.[datumIndex] === true) continue;
                adjustFn(columns, valueIndexes, datumIndex);
            }

            for (const valueIndex of valueIndexes) {
                const valueDef = this.values[valueIndex];
                const isDiscrete = valueDef.valueType === 'category';

                const column = columns[valueIndex];
                const domain = isDiscrete ? new DiscreteDomain() : new ContinuousDomain();
                for (let datumIndex = 0; datumIndex < rawData.length; datumIndex += 1) {
                    if (invalidData?.[datumIndex] === true) continue;
                    domain.extend(column[datumIndex]);
                }

                processedData.domain.values[valueIndex] = domain.getDomain();
            }
        }
    }

    private postProcessProperties(processedData: ProcessedData<any>) {
        for (const { adjust, property, scopes } of this.propertyProcessors) {
            for (const idx of this.valueIdxLookup(scopes, property)) {
                adjust()(processedData, idx);
            }
        }
    }

    private reduceData(processedData: ProcessedData<D>) {
        processedData.reduced ??= {};
        for (const def of this.reducers) {
            const reducer = def.reducer();
            let accValue: any = def.initialValue;
            const { rawData, keys, columns } = processedData;
            if (processedData.type === 'grouped') {
                for (const group of processedData.groups) {
                    if (!group.validScopes || def.scopes?.some((s) => group.validScopes?.has(s))) {
                        accValue = reducer(accValue, {
                            index: group.datumIndices,
                            // Why is flatMap needed?
                            keys: group.datumIndices.flatMap((datumIndex) => keys.map((k) => k[datumIndex])),
                            values: group.datumIndices.map((datumIndex) => columns[datumIndex]),
                            datum: group.datumIndices.map((datumIndex) => rawData[datumIndex]),
                        });
                    }
                }
            } else {
                for (let datumIndex = 0; datumIndex < rawData.length; datumIndex += 1) {
                    accValue = reducer(accValue, {
                        index: [datumIndex],
                        keys: keys.map((k) => k[datumIndex]),
                        values: [columns[datumIndex]],
                        datum: [rawData[datumIndex]],
                    });
                }
            }
            processedData.reduced[def.property] = accValue;
        }
    }

    private postProcessData(processedData: ProcessedData<D>) {
        processedData.reduced ??= {};
        for (const def of this.processors) {
            processedData.reduced[def.property] = def.calculate(processedData) as any;
        }
    }

    private initDataDomainProcessor() {
        const { keys: keyDefs, values: valueDefs } = this;

        const scopes = new Set<string>();
        for (const valueDef of valueDefs) {
            if (!valueDef.scopes) continue;
            for (const scope of valueDef.scopes) {
                scopes.add(scope);
            }
        }

        const dataDomain: Map<object, IDataDomain> = new Map();
        const processorFns = new Map<InternalDatumPropertyDefinition<K>, ProcessorFn>();
        let allScopesHaveSameDefs = true;

        const initDataDomain = () => {
            for (const def of iterate(keyDefs, valueDefs)) {
                if (def.valueType === 'category') {
                    dataDomain.set(def, new DiscreteDomain());
                } else {
                    dataDomain.set(def, new ContinuousDomain());
                    allScopesHaveSameDefs &&= (def.scopes ?? []).length === scopes.size;
                }
            }
        };
        initDataDomain();

        const accessors = this.buildAccessors(iterate(keyDefs, valueDefs));

        const processValue = (
            def: InternalDatumPropertyDefinition<K>,
            datum: any,
            idx: number,
            previousDatum?: any,
            scope?: string
        ) => {
            let valueInDatum: boolean;
            let value;
            if (accessors.has(def.property)) {
                try {
                    value = accessors.get(def.property)!(datum);
                } catch {
                    // Swallow errors - these get reported as missing values to the user later.
                }
                valueInDatum = value != null;
            } else {
                valueInDatum = def.property in datum;
                value = valueInDatum ? datum[def.property] : def.missingValue;
            }

            if (def.forceValue != null) {
                // Maintain sign of forceValue from actual value, this maybe significant later when
                // we account for the value falling into positive/negative buckets.
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

            if (valueInDatum && def.validation?.(value, datum, idx) === false) {
                if ('invalidValue' in def) {
                    value = def.invalidValue;
                } else {
                    if (this.mode !== 'integrated') {
                        Logger.warnOnce(
                            `invalid value of type [${typeof value}] for [${def.scopes} / ${def.id}] ignored:`,
                            `[${value}]`
                        );
                    }
                    return INVALID_VALUE;
                }
            }

            if (def.processor) {
                if (!processorFns.has(def)) {
                    processorFns.set(def, def.processor());
                }
                value = processorFns.get(def)?.(value, previousDatum === INVALID_VALUE ? undefined : previousDatum);
            }

            dataDomain.get(def)?.extend(value);
            return value;
        };

        return { dataDomain, processValue, initDataDomain, scopes, allScopesHaveSameDefs };
    }

    buildAccessors(defs: Iterable<{ property: string }>) {
        const result = new Map<string, (d: any) => any>();
        if (this.mode === 'integrated') {
            return result;
        }

        for (const def of defs) {
            const isPath = def.property.includes('.') || def.property.includes('[');
            if (!isPath) continue;

            const components = getPathComponents(def.property);
            if (components == null) {
                Logger.warnOnce('Invalid property path [%s]', def.property);
                continue;
            }
            const accessor = createPathAccessor(components);
            result.set(def.property, accessor);
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

    // TODO
    // if (processedData.type === 'grouped') {
    //     const flattenedValues = processedData.data.reduce<any[]>((acc, next) => {
    //         const keys = next.keys ?? [];
    //         const aggValues = next.aggValues ?? [];
    //         const skipKeys = next.keys.map(() => undefined);
    //         const skipAggValues = aggValues?.map(() => undefined);
    //         acc.push(
    //             ...next.values.map((v, i) => [
    //                 ...(i === 0 ? keys : skipKeys),
    //                 ...(v ?? []),
    //                 ...(i == 0 ? aggValues : skipAggValues),
    //             ])
    //         );
    //         return acc;
    //     }, []);
    //     logValues('Values', flattenedValues);
    // } else {
    //     const flattenedValues = processedData.data.reduce<any[]>((acc, next) => {
    //         const aggValues = next.aggValues ?? [];
    //         acc.push([...next.keys, ...next.values, ...aggValues]);
    //         return acc;
    //     }, []);
    //     logValues('Values', flattenedValues);
    // }
}
