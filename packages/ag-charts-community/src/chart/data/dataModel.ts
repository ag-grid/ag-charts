import { Logger, first, isNegative, isObject, iterate } from 'ag-charts-core';

import { Debug } from '../../util/debug';
import type { ChartMode } from '../chartMode';
import { ContinuousDomain, DiscreteDomain, type IDataDomain } from './dataDomain';
import { RangeLookup } from './rangeLookup';
import { type SortOrder, valuesSortOrder } from './sortOrder';
import { applyRemoveByReference, normaliseRemoveReferences, resolveRemovalIndices } from './transactionUtils';

export interface ScopeProvider {
    id: string;
}

export interface DataGroup {
    keys: any[];
    datumIndices: number[][];
    aggregation: any[][];
    validScopes: Set<ScopeId>;
}

export interface UngroupedDataItem<I, D, V> {
    index: I;
    keys: any[];
    values: V;
    aggValues?: [number, number][];
    datum: D;
    validScopes?: Set<string>;
}

const KEY_SORT_ORDERS = Symbol('key-sort-orders');
const COLUMN_SORT_ORDERS = Symbol('column-sort-orders');
const DOMAIN_RANGES = Symbol('domain-ranges');

type ScopeId = string;

type ProcessedValue = { value: unknown; missing: boolean; valid: boolean };

export interface DataModelTransaction<D> {
    append?: D[];
    prepend?: D[];
    remove?: D[];
}

type TransactionUpdateContext = {
    baseDataSize: number;
    addedRows: number[];
    modifiedKeyDomains: Set<number>;
    modifiedValueDomains: Set<number>;
    prependedCount: number;
    removedRows: number[];
};

interface CommonMetadata<D> {
    input: { count: number };
    scopes: Set<ScopeId>;
    dataSources: Map<ScopeId, unknown[]>;
    invalidKeys: Map<ScopeId, boolean[]> | undefined;
    invalidKeyCount: Map<ScopeId, number> | undefined;
    invalidData: Map<ScopeId, boolean[]> | undefined;
    keys: Map<ScopeId, unknown[]>[];
    columns: any[][];
    columnScopes: Set<ScopeId>[];
    domain: {
        keys: any[][];
        values: any[][];
        groups?: any[][];
        aggValues?: [number, number][];
    };
    reduced?: {
        diff?: Record<string, ProcessedOutputDiff>;
        smallestKeyInterval?: number;
        largestKeyInterval?: number;
        sortedGroupDomain?: any[][];
        animationValidation?: {
            uniqueKeys: boolean;
            orderedKeys: boolean;
        };
    };
    defs: {
        keys: (Scoped & DatumPropertyDefinition<keyof D>)[];
        values: (Scoped & DatumPropertyDefinition<keyof D>)[];
        allScopesHaveSameDefs: boolean;
    };
    partialValidDataCount: number;
    time: number;
    [DOMAIN_RANGES]: Map<string, RangeLookup>;
    [KEY_SORT_ORDERS]: Map<number, { sortOrder: SortOrder }>;
    [COLUMN_SORT_ORDERS]: Map<number, { sortOrder: SortOrder }>;
}

export interface UngroupedData<D> extends CommonMetadata<D> {
    type: 'ungrouped';
    aggregation?: [number, number][][];
}

export interface GroupedData<D> extends CommonMetadata<D> {
    type: 'grouped';
    groups: DataGroup[];
}

export type ProcessedOutputDiff = {
    changed: boolean;
    added: Set<string>;
    updated: Set<string>;
    removed: Set<string>;
    moved: Set<string>;
};

export interface ProcessedDataDef {
    index: number;
    def: PropertyDefinition<any>;
}

export interface IncrementalUpdateMetadata {
    baseDataSize: number; // Original data size before transactions
    addedRows: number[]; // Indices of newly added rows
    prependedCount?: number; // Number of rows added to the start of the data set
    removedRows?: number[]; // Indices (from the original data set) of rows that were removed
    modifiedDomains: {
        keys: number[]; // Indices of modified key domains
        values: number[]; // Indices of modified value domains
    };
}

export type ProcessedData<D> = (UngroupedData<D> | GroupedData<D>) & {
    incremental?: IncrementalUpdateMetadata;
};

export type DatumPropertyType = 'range' | 'category';

function toKeyString(keys: any[]) {
    return keys.map((key) => (isObject(key) ? JSON.stringify(key) : key)).join('-');
}

export function fixNumericExtent(extent: Array<number | Date> | null): [] | [number, number] {
    const numberExtent = extent?.map(Number) as [number, number] | undefined;
    return numberExtent?.every(Number.isFinite) ? numberExtent : [];
}

// AG-10337 Keep track of the number of missing values in each per-series data array.
type MissMap = Map<string, number>;

export function getMissCount(scopeProvider: ScopeProvider, missMap: MissMap | undefined) {
    return missMap?.get(scopeProvider.id) ?? 0;
}

type GroupingFn<K> = (keys: unknown[]) => K[];
export type GroupByFn = (extractedData: UngroupedData<any>) => GroupingFn<any>;
export type DataModelOptions<K, Grouped extends boolean | undefined, IsScoped extends boolean = true> = {
    props: PropertyDefinition<K, IsScoped>[];
    groupByKeys?: Grouped;
    groupByData?: Grouped;
    groupByFn?: GroupByFn;
};

export type PropertyDefinition<K, IsScoped = false> =
    | (DatumPropertyDefinition<K> & (IsScoped extends true ? Scoped : unknown))
    | AggregatePropertyDefinition<any, any, any>
    | (PropertyValueProcessorDefinition<any> & (IsScoped extends true ? Scoped : unknown))
    | GroupValueProcessorDefinition<any, any>
    | ReducerOutputPropertyDefinition<any>
    | ProcessorOutputPropertyDefinition<any>;

export type ProcessorFn = (datum: unknown, index: number) => unknown;
export type PropertyId<K extends string> = K | { id: string };

export type Scoped = {
    /** Scope(s) a property definition belongs to (typically the defining entities unique identifier). */
    scopes: ScopeId[];
};

function isScoped<T extends object>(obj: T): obj is T & Scoped {
    return 'scopes' in obj && Array.isArray(obj.scopes);
}

type PropertyIdentifiers = {
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

type InternalDefinition<IsScoped extends boolean> = {
    index: number;
} & (IsScoped extends true ? Scoped : unknown);

type InternalDatumPropertyDefinition<K> = DatumPropertyDefinition<K> &
    InternalDefinition<true> & {
        missing: MissMap;
    };

export type AggregatePropertyDefinition<D, K extends keyof D & string, R = [number, number], R2 = R> = Omit<
    PropertyIdentifiers,
    'scopes'
> &
    PropertySelectors & {
        type: 'aggregate';
        aggregateFunction: (values: D[K][], keys?: D[K][]) => R;
        groupAggregateFunction?: (next?: R, acc?: R2) => R2;
        finalFunction?: (result: R2) => [number, number];
    };

type GroupValueAdjustFn<D, K extends keyof D & string> = (
    columns: D[K][][],
    indexes: number[],
    dataGroup: DataGroup
) => void;

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
    reducer: () => (acc: ReducerOutputTypes[P], keys: unknown[]) => ReducerOutputTypes[P];
};

export type ProcessorOutputPropertyDefinition<P extends ReducerOutputKeys = ReducerOutputKeys> = PropertyIdentifiers & {
    type: 'processor';
    property: P;
    calculate: (data: ProcessedData<any>, previousValue: ReducerOutputTypes[P] | undefined) => ReducerOutputTypes[P];
};

function createArray<T>(length: number, value: T): T[] {
    const out: T[] = [];
    for (let i = 0; i < length; i += 1) {
        out[i] = value;
    }
    return out;
}

export function datumKeys(keys: Array<unknown[] | undefined>, datumIndex: number): any[] | undefined {
    const out: any = [];

    for (const k of keys) {
        const key = k?.[datumIndex];
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
    private readonly scopeCache: Map<string, Map<string, PropertyDefinition<any> & InternalDefinition<false>>> =
        new Map();

    private readonly keys: InternalDatumPropertyDefinition<K>[] = [];
    private readonly values: InternalDatumPropertyDefinition<K>[] = [];
    private readonly aggregates: (AggregatePropertyDefinition<D, K> & InternalDefinition<false>)[] = [];
    private readonly groupProcessors: (GroupValueProcessorDefinition<D, K> & InternalDefinition<false>)[] = [];
    private readonly propertyProcessors: (PropertyValueProcessorDefinition<D> & InternalDefinition<true>)[] = [];
    private readonly reducers: (ReducerOutputPropertyDefinition & InternalDefinition<false>)[] = [];
    private readonly processors: (ProcessorOutputPropertyDefinition & InternalDefinition<false>)[] = [];

    public constructor(
        private readonly opts: DataModelOptions<K, Grouped, true>,
        private readonly mode: ChartMode = 'standalone',
        private readonly suppressFieldDotNotation: boolean = false
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

        const keyScopes = new Set<ScopeId>();
        const valueScopes = new Set<ScopeId>();
        for (const def of opts.props) {
            const scopes = def.type === 'key' ? keyScopes : valueScopes;
            if (isScoped(def)) {
                def.scopes?.forEach((s) => scopes.add(s));
            }

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

        if (!!this.opts.groupByKeys || this.opts.groupByFn != null) {
            const ungroupedScopes = new Set(valueScopes.values());
            keyScopes.forEach((s) => ungroupedScopes.delete(s));

            if (ungroupedScopes.size > 0) {
                throw new Error(
                    `AG Charts - scopes missing key for grouping, illegal configuration: ${[...ungroupedScopes.values()]}`
                );
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

    resolveKeysById<T = string>(
        scope: ScopeProvider,
        searchId: string,
        processedData: UngroupedData<any> | GroupedData<any>
    ): T[] {
        const index = this.resolveProcessedDataIndexById(scope, searchId);
        const keys = processedData.keys[index];
        if (keys == null) {
            throw new Error(`AG Charts - didn't find keys for [${searchId}, ${scope.id}]`);
        }
        return keys.get(scope.id) as T[];
    }

    hasColumnById(scope: ScopeProvider, searchId: string) {
        return this.scopeCache.get(scope.id)?.get(searchId) != null;
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

    /**
     * Provides a convenience iterator to iterate over all of the extract datum values in a
     * specific DataGroup.
     *
     * @param scope to which datums should belong
     * @param group containing the datums
     * @param processedData containing the group
     */
    *forEachDatum(scope: ScopeProvider, processedData: GroupedData<any>, group: DataGroup) {
        const columnIndex = processedData.columnScopes.findIndex((s) => s.has(scope.id));

        for (const datumIndex of group.datumIndices[columnIndex] ?? []) {
            yield processedData.columns[columnIndex][datumIndex];
        }
    }

    /**
     * Provides a convenience iterator to iterate over all of the extracted datum values in a
     * GroupedData.
     *
     * @param scope to which datums should belong
     * @param processedData to iterate through
     */
    *forEachGroupDatum(scope: ScopeProvider, processedData: GroupedData<any>) {
        const columnIndex = processedData.columnScopes.findIndex((s) => s.has(scope.id));
        const output: {
            group: DataGroup;
            groupIndex: number;
            columnIndex: number;
            datumIndex: number;
        } = {
            groupIndex: 0,
            columnIndex,
        } as any;

        const empty: number[] = [];
        for (const group of processedData.groups) {
            output.group = group;
            for (const datumIndex of group.datumIndices[columnIndex] ?? empty) {
                output.datumIndex = datumIndex;
                yield output;
            }
            output.groupIndex++;
        }
    }

    getDomain(
        scope: ScopeProvider,
        searchId: string,
        type: PropertyDefinition<any>['type'],
        processedData: ProcessedData<D>
    ): any[] | [number, number] | [] {
        const domains = this.getDomainsByType(type ?? 'value', processedData);
        return domains?.[this.resolveProcessedDataIndexById(scope, searchId)] ?? [];
    }

    getDomainBetweenRange(
        scope: ScopeProvider,
        searchIds: string[],
        [i0, i1]: [number, number],
        processedData: ProcessedData<D>
    ): [number, number] {
        const columnIndices = searchIds.map((searchId) => this.resolveProcessedDataIndexById(scope, searchId));
        const cacheKey = columnIndices.join(':');
        const domainRanges = processedData[DOMAIN_RANGES];
        let rangeLookup = domainRanges.get(cacheKey);
        if (rangeLookup == null) {
            const values = columnIndices.map((columnIndex) => processedData.columns[columnIndex]);
            rangeLookup = new RangeLookup(values);
            domainRanges.set(cacheKey, rangeLookup);
        }
        return rangeLookup.rangeBetween(i0, i1);
    }

    private getSortOrder(values: any[], index: number, sortOrders: Map<number, { sortOrder: SortOrder }>): SortOrder {
        let sortOrder = sortOrders.get(index);
        if (sortOrder == null) {
            sortOrder = { sortOrder: valuesSortOrder(values) };
            sortOrders.set(index, sortOrder);
        }
        return sortOrder.sortOrder;
    }

    getKeySortOrder(scope: ScopeProvider, searchId: string, processedData: ProcessedData<D>): SortOrder {
        const columnIndex = this.resolveProcessedDataIndexById(scope, searchId);
        const keys = processedData.keys[columnIndex]?.get(scope.id);
        return keys ? this.getSortOrder(keys, columnIndex, processedData[KEY_SORT_ORDERS]) : undefined;
    }

    getColumnSortOrder(scope: ScopeProvider, searchId: string, processedData: ProcessedData<D>): SortOrder {
        const columnIndex = this.resolveProcessedDataIndexById(scope, searchId);
        return this.getSortOrder(processedData.columns[columnIndex], columnIndex, processedData[COLUMN_SORT_ORDERS]);
    }

    private getDomainsByType(type: PropertyDefinition<any>['type'], processedData: ProcessedData<D>) {
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
        sources: Map<string, unknown[]>
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

        let processedData: ProcessedData<D> = this.extractData(sources);
        if (groupByKeys) {
            processedData = this.groupData(processedData);
        } else if (groupByFn) {
            processedData = this.groupData(processedData, groupByFn(processedData));
        }
        if (groupProcessors.length > 0 && processedData.type === 'grouped') {
            this.postProcessGroups(processedData);
        }
        if (aggregates.length > 0 && processedData.type === 'ungrouped') {
            this.aggregateUngroupedData(processedData);
        } else if (aggregates.length > 0 && processedData.type === 'grouped') {
            this.aggregateGroupedData(processedData);
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

        this.warnDataMissingProperties(sources);

        const end = performance.now();
        processedData.time = end - start;

        if (this.debug.check()) {
            logProcessedData(processedData);
        }

        this.processScopeCache();

        return processedData as Grouped extends true ? GroupedData<D> : UngroupedData<D>;
    }

    applyTransactions(
        processedData: ProcessedData<D>,
        transactions: Map<string, DataModelTransaction<D>>
    ): ProcessedData<D> {
        const start = performance.now();

        const appendSources = new Map<string, D[]>();
        const prependSources = new Map<string, D[]>();
        const removeSources = new Map<string, D[]>();

        for (const [scopeId, operations] of transactions) {
            if (operations.append?.length) {
                appendSources.set(scopeId, operations.append);
            }
            if (operations.prepend?.length) {
                prependSources.set(scopeId, operations.prepend);
            }
            if (operations.remove?.length) {
                const removeRefs = normaliseRemoveReferences(operations.remove);
                if (removeRefs.length > 0) {
                    removeSources.set(scopeId, removeRefs);
                }
            }
        }

        if (appendSources.size === 0 && prependSources.size === 0 && removeSources.size === 0) {
            return processedData;
        }

        const baseDataSize = processedData.input.count;

        if (removeSources.size > 0) {
            processedData = this.applyRemoveTransactions(
                processedData,
                appendSources,
                prependSources,
                removeSources,
                baseDataSize
            );
        } else {
            const updateContext: TransactionUpdateContext = {
                baseDataSize,
                addedRows: [],
                modifiedKeyDomains: new Set<number>(),
                modifiedValueDomains: new Set<number>(),
                prependedCount: 0,
                removedRows: [],
            };

            if (prependSources.size === 0) {
                this.applyAppendTransactions(processedData, appendSources, updateContext);
            } else {
                if (prependSources.size > 0) {
                    updateContext.prependedCount = this.applyPrependTransactions(
                        processedData,
                        prependSources,
                        updateContext
                    );
                }
                if (appendSources.size > 0) {
                    this.applyAppendTransactions(processedData, appendSources, updateContext);
                }
            }

            processedData.incremental = {
                baseDataSize: updateContext.baseDataSize,
                addedRows: updateContext.addedRows,
                ...(updateContext.prependedCount > 0 ? { prependedCount: updateContext.prependedCount } : {}),
                modifiedDomains: {
                    keys: Array.from(updateContext.modifiedKeyDomains),
                    values: Array.from(updateContext.modifiedValueDomains),
                },
            };
        }

        if (this.opts.groupByKeys && processedData.type === 'ungrouped') {
            // TODO: to handle incremental grouping
        }

        processedData.time = performance.now() - start;

        if (this.debug.check()) {
            logProcessedData(processedData);
        }

        return processedData;
    }

    private applyRemoveTransactions(
        processedData: ProcessedData<D>,
        appendSources: Map<string, D[]>,
        prependSources: Map<string, D[]>,
        removeSources: Map<string, D[]>,
        baseDataSize: number
    ): ProcessedData<D> {
        const scopeIds = new Set<string>();

        if (processedData.scopes) {
            for (const scopeId of processedData.scopes) {
                scopeIds.add(scopeId);
            }
        }
        for (const key of appendSources.keys()) {
            scopeIds.add(key);
        }
        for (const key of prependSources.keys()) {
            scopeIds.add(key);
        }
        for (const key of removeSources.keys()) {
            scopeIds.add(key);
        }

        const updatedSources = new Map<string, unknown[]>();
        const removedIndicesByScope = new Map<string, number[]>();

        for (const scopeId of scopeIds) {
            const baseScopeData = (processedData.dataSources.get(scopeId) ?? []) as D[];
            let nextData = Array.isArray(baseScopeData) ? baseScopeData.slice() : [];

            const removeRefs = removeSources.get(scopeId);
            if (removeRefs?.length) {
                const removalIndices = resolveRemovalIndices(baseScopeData, removeRefs);
                removedIndicesByScope.set(scopeId, removalIndices);
                const { result } = applyRemoveByReference(nextData, removeRefs, true);
                nextData = result;
            }

            const prepends = prependSources.get(scopeId);
            if (prepends?.length) {
                nextData.unshift(...prepends);
            }

            const appends = appendSources.get(scopeId);
            if (appends?.length) {
                nextData.push(...appends);
            }

            updatedSources.set(scopeId, nextData);
        }

        const reprocessed = this.processData(updatedSources);
        if (!reprocessed) {
            return processedData;
        }

        const nextProcessedData = reprocessed as ProcessedData<D>;

        const removalEntry = removedIndicesByScope.entries().next();
        const removalScopeId = removalEntry.done ? undefined : removalEntry.value[0];
        const removedRows = removalEntry.done ? [] : [...removalEntry.value[1]];

        const resolveCount = (source: Map<string, D[]>, scope?: string) => {
            if (scope != null) {
                return source.get(scope)?.length ?? 0;
            }
            const firstEntry = first(source.values());
            return firstEntry?.length ?? 0;
        };

        const appendedCount = resolveCount(appendSources, removalScopeId);
        const prependedCount = resolveCount(prependSources, removalScopeId);
        const remainingBaseSize = Math.max(baseDataSize - removedRows.length, 0);

        if (this.debug.check()) {
            this.debug('DataModel.applyTransactions() - removal summary', {
                scopeIds: Array.from(removeSources.keys()),
                removedRows,
                appendedCount,
                prependedCount,
                remainingBaseSize,
            });
        }

        const addedRows: number[] = [];
        for (let i = 0; i < prependedCount; i++) {
            addedRows.push(i);
        }
        if (appendedCount > 0) {
            const startIndex = prependedCount + remainingBaseSize;
            for (let i = 0; i < appendedCount; i++) {
                addedRows.push(startIndex + i);
            }
        }

        const modifiedKeyDomains = this.diffDomains(processedData.domain.keys, nextProcessedData.domain.keys);
        const modifiedValueDomains = this.diffDomains(processedData.domain.values, nextProcessedData.domain.values);

        nextProcessedData.incremental = {
            baseDataSize,
            addedRows,
            ...(prependedCount > 0 ? { prependedCount } : {}),
            ...(removedRows.length > 0 ? { removedRows } : {}),
            modifiedDomains: {
                keys: modifiedKeyDomains,
                values: modifiedValueDomains,
            },
        };

        return nextProcessedData;
    }

    private applyAppendTransactions(
        processedData: ProcessedData<D>,
        appendSources: Map<string, D[]>,
        context: TransactionUpdateContext
    ) {
        if (appendSources.size === 0) return;

        const appendData = this.extractTransactionData(appendSources);
        const startIndex = processedData.input.count;

        this.mergeExtractedData(processedData, appendData, 'append');
        this.updateDomainsFromExtracted(
            processedData,
            appendData.domain,
            context.modifiedKeyDomains,
            context.modifiedValueDomains
        );

        processedData.input.count += appendData.input.count;
        processedData.partialValidDataCount += appendData.partialValidDataCount;

        this.pushAddedRows(context.addedRows, startIndex, appendData.input.count);
    }

    private applyPrependTransactions(
        processedData: ProcessedData<D>,
        prependSources: Map<string, D[]>,
        context: TransactionUpdateContext
    ) {
        if (prependSources.size === 0) return 0;

        const prependData = this.extractTransactionData(prependSources);

        this.mergeExtractedData(processedData, prependData, 'prepend');
        this.updateDomainsFromExtracted(
            processedData,
            prependData.domain,
            context.modifiedKeyDomains,
            context.modifiedValueDomains
        );

        processedData.input.count += prependData.input.count;
        processedData.partialValidDataCount += prependData.partialValidDataCount;

        this.pushAddedRows(context.addedRows, 0, prependData.input.count);

        return prependData.input.count;
    }

    private mergeExtractedData(
        processedData: ProcessedData<D>,
        extracted: UngroupedData<D>,
        mode: 'append' | 'prepend'
    ) {
        // Create a new Map to avoid mutating the original
        const mergedDataSources = new Map<string, unknown[]>();

        // First, copy all existing data sources
        for (const [scopeId, existingData] of processedData.dataSources) {
            mergedDataSources.set(scopeId, existingData);
        }

        // Then merge in the new data
        for (const [scopeId, newData] of extracted.dataSources) {
            const existingScopedData = mergedDataSources.get(scopeId);

            let mergedData: unknown[];
            if (existingScopedData == null) {
                // No existing data, just use the new data
                mergedData = newData as unknown[];
            } else if (mode === 'append') {
                // Create a new array that combines existing and new data
                // Note: We don't copy the arrays, we just create a new array with the combined references
                mergedData = [...existingScopedData, ...(newData as D[])];
            } else {
                // Prepend mode
                mergedData = [...(newData as D[]), ...existingScopedData];
            }

            mergedDataSources.set(scopeId, mergedData);
        }

        // Replace the dataSources with the new merged version
        processedData.dataSources = mergedDataSources;

        // Also handle columns without mutation
        const mergedColumns = [...processedData.columns];
        for (let colIndex = 0; colIndex < mergedColumns.length; colIndex++) {
            const columnData = extracted.columns[colIndex];
            if (!columnData?.length) continue;

            // Create a new array for this column
            const existingColumn = mergedColumns[colIndex];
            if (mode === 'append') {
                mergedColumns[colIndex] = [...existingColumn, ...columnData];
            } else {
                mergedColumns[colIndex] = [...columnData, ...existingColumn];
            }
        }
        processedData.columns = mergedColumns;
    }

    private updateDomainsFromExtracted(
        processedData: ProcessedData<D>,
        domain: { keys: any[][]; values: any[][] },
        modifiedKeyDomains: Set<number>,
        modifiedValueDomains: Set<number>
    ) {
        for (let i = 0; i < processedData.domain.keys.length; i++) {
            if (this.updateDomain(processedData.domain.keys[i], domain.keys[i], this.keys[i])) {
                modifiedKeyDomains.add(i);
            }
        }

        for (let i = 0; i < processedData.domain.values.length; i++) {
            if (this.updateDomain(processedData.domain.values[i], domain.values[i], this.values[i])) {
                modifiedValueDomains.add(i);
            }
        }
    }

    private diffDomains(existing: any[][], next: any[][]): number[] {
        const length = Math.max(existing.length, next.length);
        const modified: number[] = [];
        for (let i = 0; i < length; i++) {
            if (!this.domainsEqual(existing[i], next[i])) {
                modified.push(i);
            }
        }
        return modified;
    }

    private domainsEqual(a?: any[], b?: any[]): boolean {
        if (a === b) return true;
        if (!a || !b) {
            return (a?.length ?? 0) === (b?.length ?? 0);
        }
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (!Object.is(a[i], b[i])) {
                return false;
            }
        }
        return true;
    }

    private pushAddedRows(addedRows: number[], startIndex: number, count: number) {
        for (let i = 0; i < count; i++) {
            addedRows.push(startIndex + i);
        }
    }

    private extractTransactionData(sourceMap: Map<string, D[]>): UngroupedData<D> {
        const sources = new Map<string, unknown[]>();
        for (const [scopeId, data] of sourceMap) {
            sources.set(scopeId, data);
        }
        return this.extractData(sources);
    }

    private updateDomain(
        existingDomain: any[],
        newDomain: any[] | undefined,
        def: InternalDatumPropertyDefinition<K>
    ): boolean {
        if (!newDomain || newDomain.length === 0) return false;

        if (def.valueType === 'range') {
            let modified = false;
            let min = existingDomain[0];
            let max = existingDomain.length > 1 ? existingDomain[1] : existingDomain[0];

            for (const value of newDomain) {
                if (value == null) continue;
                if (typeof value !== 'number' && !(value instanceof Date)) continue;

                if (min == null || value < min) {
                    min = value;
                    modified = true;
                }
                if (max == null || value > max) {
                    max = value;
                    modified = true;
                }
            }

            if (modified) {
                if (max == null) {
                    max = min;
                }
                if (existingDomain.length === 0) {
                    existingDomain.push(min, max);
                } else {
                    existingDomain[0] = min;
                    existingDomain[1] = max;
                    existingDomain.length = 2;
                }
            }

            return modified;
        }

        let modified = false;
        for (const value of newDomain) {
            if (!existingDomain.includes(value)) {
                existingDomain.push(value);
                modified = true;
            }
        }

        return modified;
    }

    private warnDataMissingProperties(sources: Map<string, unknown[]>) {
        if (sources.size === 0) return;

        for (const def of iterate(this.keys, this.values)) {
            for (const [scope, missCount] of def.missing) {
                if (missCount < (sources.get(scope)?.length ?? Infinity)) continue;
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

    private extractData(sources: Map<string, unknown[]>): UngroupedData<D> {
        const { dataDomain, processValue, allScopesHaveSameDefs } = this.initDataDomainProcessor();

        const { keys: keyDefs, values: valueDefs } = this;

        const { invalidData, invalidKeys, invalidKeyCount, allKeyMappings } = this.extractKeys(
            keyDefs,
            sources,
            processValue
        );

        const { columns, columnScopes, partialValidDataCount, maxDataLength } = this.extractValues(
            invalidData,
            valueDefs,
            sources,
            invalidKeys,
            processValue
        );

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
            input: { count: maxDataLength },
            scopes: new Set(sources.keys()),
            dataSources: sources,
            aggregation: undefined,
            keys: [...allKeyMappings.values()],
            columns,
            columnScopes,
            invalidKeys,
            invalidKeyCount,
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
            [DOMAIN_RANGES]: new Map(),
            [KEY_SORT_ORDERS]: new Map(),
            [COLUMN_SORT_ORDERS]: new Map(),
        } satisfies UngroupedData<D>;
    }

    private extractKeys(
        keyDefs: InternalDatumPropertyDefinition<K>[],
        sources: Map<string, unknown[]>,
        processValue: (
            def: InternalDatumPropertyDefinition<K>,
            datum: any,
            idx: number,
            scopes: string
        ) => ProcessedValue
    ) {
        const invalidKeys = new Map<ScopeId, boolean[]>();
        const invalidData = new Map<ScopeId, boolean[]>();
        const invalidKeyCount = new Map<ScopeId, number>();
        const allKeys = new Map<(typeof keyDefs)[number], Map<ScopeId, unknown[]>>();

        let keyDefKeys: Map<ScopeId, unknown[]>;
        let scopeDataProcessed: Map<unknown[], ScopeId>;

        const cloneScope = (source: unknown[], target: ScopeId) => {
            const sourceScope = scopeDataProcessed.get(source)!;
            keyDefKeys.set(target, keyDefKeys.get(sourceScope)!);
            if (invalidKeys.has(sourceScope)) {
                invalidKeys.set(target, invalidKeys.get(sourceScope)!);
                invalidData.set(target, invalidData.get(sourceScope)!);
            }
        };

        for (const keyDef of keyDefs) {
            const { invalidValue, scopes: keyScopes } = keyDef;

            keyDefKeys = new Map<ScopeId, unknown[]>();
            scopeDataProcessed = new Map<unknown[], ScopeId>();

            allKeys.set(keyDef, keyDefKeys);

            for (const scope of keyScopes ?? []) {
                const data = sources.get(scope) ?? [];
                if (scopeDataProcessed.has(data)) {
                    cloneScope(data, scope);
                    continue;
                }

                const keys: unknown[] = [];
                keyDefKeys.set(scope, keys);
                scopeDataProcessed.set(data, scope);

                let invalidScopeKeys;
                let invalidScopeData;
                let missingKeys = 0;
                for (let datumIndex = 0; datumIndex < data.length; datumIndex++) {
                    if (data[datumIndex] == null || typeof data[datumIndex] !== 'object') continue;

                    const result = processValue(keyDef, data[datumIndex], datumIndex, scope);

                    if (result.valid) {
                        keys.push(result.value);
                        continue;
                    }

                    keys.push(invalidValue);

                    invalidScopeKeys ??= createArray(data.length, false);
                    invalidScopeData ??= createArray(data.length, false);

                    missingKeys += 1;
                    invalidScopeKeys[datumIndex] = true;
                    invalidScopeData[datumIndex] = true;
                }

                if (invalidScopeKeys && invalidScopeData) {
                    invalidKeys.set(scope, invalidScopeKeys);
                    invalidData.set(scope, invalidScopeData);
                    invalidKeyCount.set(scope, missingKeys);
                }
            }
        }
        return { invalidData, invalidKeys, invalidKeyCount, allKeyMappings: allKeys };
    }

    private readonly markScopeDatumInvalid = function (
        scopes: string[],
        data: unknown[],
        datumIndex: number,
        invalidData: Map<ScopeId, boolean[]>
    ) {
        for (const scope of scopes) {
            if (!invalidData.has(scope)) {
                invalidData.set(scope, createArray(data.length, false));
            }
            invalidData.get(scope)![datumIndex] = true;
        }
    };

    private extractValues(
        invalidData: Map<ScopeId, boolean[]>,
        valueDefs: InternalDatumPropertyDefinition<K>[],
        sources: Map<string, unknown[]>,
        scopeInvalidKeys: Map<ScopeId, boolean[]>,
        processValue: (
            def: InternalDatumPropertyDefinition<K>,
            datum: any,
            idx: number,
            scopes: string | string[]
        ) => ProcessedValue
    ) {
        let partialValidDataCount = 0;

        const columns: unknown[][] = [];
        const allColumnScopes: Set<ScopeId>[] = [];
        let maxDataLength = 0;
        for (const def of valueDefs) {
            const { invalidValue } = def;

            const valueSources = new Set(def.scopes.map((s) => sources.get(s)));
            if (valueSources.size > 1) {
                throw new Error(`AG Charts - more than one data source for: ${JSON.stringify(def)}`);
            }
            const columnScopes = new Set(def.scopes);
            const columnScope = first(def.scopes);
            const columnSource = sources.get(columnScope) as unknown[];
            const column = new Array<unknown>();
            const invalidKeys = scopeInvalidKeys.get(columnScope);
            for (let datumIndex = 0; datumIndex < columnSource.length; datumIndex++) {
                if (columnSource[datumIndex] == null || typeof columnSource[datumIndex] !== 'object') continue;

                const valueDatum = columnSource[datumIndex];
                const invalidKey = invalidKeys != null ? invalidKeys[datumIndex] : false;

                const result = processValue(def, valueDatum, datumIndex, def.scopes);
                let value = result.value;

                if (invalidKey || !result.valid) {
                    this.markScopeDatumInvalid(def.scopes, columnSource, datumIndex, invalidData);
                }

                if (invalidKey) {
                    value = invalidValue;
                } else if (!result.valid) {
                    partialValidDataCount += 1;

                    value = invalidValue;
                }

                column[datumIndex] = value;
            }

            columns.push(column);
            allColumnScopes.push(columnScopes);
            maxDataLength = Math.max(maxDataLength, column.length);
        }

        return { columns, columnScopes: allColumnScopes, partialValidDataCount, maxDataLength };
    }

    private groupData(data: UngroupedData<D>, groupingFn?: GroupingFn<D>): GroupedData<D> {
        type Group = { keys: unknown[]; datumIndices: number[][]; aggregation: any[]; validScopes: Set<string> };

        const { keys: dataKeys, columns: allColumns, columnScopes, invalidKeys, invalidData } = data;

        const allScopes = data.scopes;
        const resultGroups = [];
        const resultData = [];

        const processedColumnIndexes = new Set<number>();
        const groups = allScopes.size !== 1 || groupingFn != null ? new Map<string, Group>() : undefined;

        for (const scope of allScopes) {
            // Determine columns we can process in batch.
            const scopeColumnIndexes = allColumns
                .map((_, idx) => idx)
                .filter((idx) => !processedColumnIndexes.has(idx) && columnScopes[idx].has(scope));
            if (scopeColumnIndexes.length === 0) continue;
            for (const idx of scopeColumnIndexes) {
                processedColumnIndexes.add(idx);
            }
            const siblingScopes = new Set<ScopeId>();
            for (const columnIdx of scopeColumnIndexes) {
                for (const columnScope of columnScopes[columnIdx]) {
                    siblingScopes.add(columnScope);
                }
            }

            const scopeKeys = dataKeys.map((k) => k.get(scope)).filter((k): k is unknown[] => k != null);
            const firstColumn = allColumns[first(scopeColumnIndexes)];
            const scopeInvalidData = invalidData?.get(scope);
            const scopeInvalidKeys = invalidKeys?.get(scope);
            for (let datumIndex = 0; datumIndex < firstColumn.length; datumIndex++) {
                if (scopeInvalidKeys?.[datumIndex] === true) continue;

                const keys = scopeKeys.map((k) => k[datumIndex]);
                if (keys == null || keys.length === 0) {
                    throw new Error('AG Charts - no keys found for scope: ' + scope);
                }

                const group = groupingFn?.(keys) ?? keys;
                const groupStr = groups != null ? toKeyString(group) : undefined;

                let outputGroup: Group | undefined = groups?.get(groupStr!);
                if (outputGroup == null) {
                    outputGroup = {
                        keys: group,
                        datumIndices: [],
                        aggregation: [],
                        validScopes: allScopes,
                    };

                    groups?.set(groupStr!, outputGroup);

                    resultGroups.push(outputGroup.keys);
                    resultData.push(outputGroup);
                }

                if (scopeInvalidData?.[datumIndex] === true) {
                    if (outputGroup.validScopes === allScopes) {
                        // Lazy Set initialization.
                        outputGroup.validScopes = new Set(allScopes.values());
                    }
                    for (const invalidScope of siblingScopes) {
                        outputGroup.validScopes.delete(invalidScope);
                    }
                }

                for (const columnIdx of scopeColumnIndexes) {
                    outputGroup.datumIndices[columnIdx] ??= [];
                    outputGroup.datumIndices[columnIdx].push(datumIndex);
                }
            }
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

    private aggregateUngroupedData(processedData: UngroupedData<any>) {
        const domainAggValues = this.aggregates.map((): [number, number] => [Infinity, -Infinity]);
        processedData.domain.aggValues = domainAggValues;

        const { columns, dataSources } = processedData;

        const onlyScope = first(dataSources.keys());
        const keys = processedData.keys.map((k) => k.get(onlyScope));
        const rawData = dataSources.get(onlyScope);
        processedData.aggregation = rawData?.map((_, datumIndex) => {
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

                const finalValues = def.finalFunction?.(groupAggValues) ?? groupAggValues;

                aggregation[index] = finalValues;
                ContinuousDomain.extendDomain(finalValues, domainAggValues[index]);
            }

            return aggregation;
        });
    }

    private aggregateGroupedData(processedData: GroupedData<any>) {
        const domainAggValues = this.aggregates.map((): [number, number] => [Infinity, -Infinity]);
        processedData.domain.aggValues = domainAggValues;

        const { columns } = processedData;

        for (const [index, def] of this.aggregates.entries()) {
            const indices = this.valueGroupIdxLookup(def);

            for (const group of processedData.groups) {
                group.aggregation ??= [];

                const groupKeys = group.keys;

                let groupAggValues = def.groupAggregateFunction?.() ?? [Infinity, -Infinity];
                const maxDatumIndex = Math.max(
                    ...indices.map((columnIndex) => group.datumIndices[columnIndex]?.length ?? 0)
                );
                for (let datumIndex = 0; datumIndex < maxDatumIndex; datumIndex++) {
                    const valuesToAgg = indices.map(
                        (columnIndex) => columns[columnIndex][group.datumIndices[columnIndex]?.[datumIndex]] as D[K]
                    );
                    const valuesAgg = def.aggregateFunction(valuesToAgg, groupKeys);
                    if (valuesAgg) {
                        groupAggValues =
                            def.groupAggregateFunction?.(valuesAgg, groupAggValues) ??
                            ContinuousDomain.extendDomain(valuesAgg, groupAggValues);
                    }
                }

                const finalValues = def.finalFunction?.(groupAggValues) ?? groupAggValues;

                group.aggregation[index] = finalValues;
                ContinuousDomain.extendDomain(finalValues, domainAggValues[index]);
            }
        }
    }

    private postProcessGroups(processedData: GroupedData<any>) {
        const { groupProcessors } = this;

        const { columnScopes, columns, invalidData } = processedData;
        for (const processor of groupProcessors) {
            const valueIndexes = this.valueGroupIdxLookup(processor);
            const adjustFn = processor.adjust()();

            for (const dataGroup of processedData.groups) {
                adjustFn(columns, valueIndexes, dataGroup);
            }

            for (const valueIndex of valueIndexes) {
                const valueDef = this.values[valueIndex];
                const isDiscrete = valueDef.valueType === 'category';

                const column = columns[valueIndex];
                const columnScope = first(columnScopes[valueIndex]);
                const invalidDatums = invalidData?.get(columnScope);
                const domain = isDiscrete ? new DiscreteDomain() : new ContinuousDomain();
                for (let datumIndex = 0; datumIndex < column.length; datumIndex += 1) {
                    if (invalidDatums?.[datumIndex] === true) continue;
                    domain.extend(column[datumIndex]);
                }

                processedData.domain.values[valueIndex] = domain.getDomain();
            }
        }
    }

    private postProcessProperties(processedData: ProcessedData<D>) {
        for (const { adjust, property, scopes } of this.propertyProcessors) {
            for (const idx of this.valueIdxLookup(scopes, property)) {
                adjust()(processedData, idx);
            }
        }
    }

    private reduceData(processedData: ProcessedData<D>) {
        processedData.reduced ??= {};
        const { dataSources, keys } = processedData;

        for (const def of this.reducers) {
            const reducer = def.reducer();
            let accValue: any = def.initialValue;
            if (processedData.type === 'grouped') {
                for (const group of processedData.groups) {
                    accValue = reducer(accValue, group.keys);
                }
            } else {
                const onlyScope = isScoped(def) ? def.scopes[0] : first(dataSources.keys());
                const keyColumns = keys.map((k) => k.get(onlyScope)).filter((k) => k != null);
                const keysParam = keyColumns.map((): unknown => undefined!);
                const rawData = dataSources.get(onlyScope)!;
                for (let datumIndex = 0; datumIndex < rawData.length; datumIndex += 1) {
                    for (let keyIdx = 0; keyIdx < keysParam.length; keyIdx++) {
                        keysParam[keyIdx] = keyColumns[keyIdx]?.[datumIndex];
                    }
                    accValue = reducer(accValue, keysParam);
                }
            }
            processedData.reduced[def.property] = accValue;
        }
    }

    private postProcessData(processedData: ProcessedData<D>) {
        processedData.reduced ??= {};
        for (const def of this.processors) {
            processedData.reduced[def.property] = def.calculate(
                processedData,
                processedData.reduced[def.property]
            ) as any;
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
                    allScopesHaveSameDefs &&= (def.scopes?.length ?? 0) === scopes.size;
                }
            }
        };
        initDataDomain();

        const accessors = this.buildAccessors(iterate(keyDefs, valueDefs));

        const reusableResult: ProcessedValue = {
            value: undefined,
            missing: false,
            valid: false,
        };
        const processValue = (
            def: InternalDatumPropertyDefinition<K>,
            datum: Record<string, any>,
            idx: number,
            valueScopes: string | string[]
        ): ProcessedValue => {
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
            reusableResult.missing = !valueInDatum;

            const missingValueDef = 'missingValue' in def;
            if (!valueInDatum && !missingValueDef) {
                if (typeof valueScopes === 'string') {
                    const missCount = def.missing.get(valueScopes) ?? 0;
                    def.missing.set(valueScopes, missCount + 1);
                } else {
                    for (const scope of valueScopes) {
                        const missCount = def.missing.get(scope) ?? 0;
                        def.missing.set(scope, missCount + 1);
                    }
                }
            }

            if (!dataDomain.has(def)) {
                initDataDomain();
            }

            if (valueInDatum && def.validation?.(value, datum, idx) === false) {
                reusableResult.valid = false;

                if ('invalidValue' in def) {
                    value = def.invalidValue;
                } else {
                    if (this.mode !== 'integrated') {
                        Logger.warnOnce(
                            `invalid value of type [${typeof value}] for [${def.scopes} / ${def.id}] ignored:`,
                            `[${value}]`
                        );
                    }
                    reusableResult.value = undefined;
                    return reusableResult;
                }
            } else {
                reusableResult.valid = true;
            }

            if (def.processor) {
                let processor = processorFns.get(def);
                if (processor == null) {
                    processor = def.processor();
                    processorFns.set(def, processor);
                }
                value = processor(value, idx);
            }

            dataDomain.get(def)?.extend(value);
            reusableResult.value = value;
            return reusableResult;
        };

        return { dataDomain, processValue, initDataDomain, scopes, allScopesHaveSameDefs };
    }

    buildAccessors(defs: Iterable<{ property: string }>) {
        const result = new Map<string, (d: any) => any>();
        if (this.suppressFieldDotNotation) {
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
}
