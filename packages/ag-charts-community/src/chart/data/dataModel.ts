import { Debug, Logger, first, isNegative, isObject, iterate } from 'ag-charts-core';

import type { ChartMode } from '../chartMode';
import { hasNoRemovals, isAppendOnly, isPrependOnly } from './dataChangeDescription';
import {
    BandedDomain,
    type BandedDomainConfig,
    ContinuousDomain,
    DiscreteDomain,
    type IDataDomain,
} from './dataDomain';
import type { DataChangeDescription, DataSet } from './dataSet';
import { RangeLookup } from './rangeLookup';
import { type SortOrder, valuesSortOrder } from './sortOrder';

export interface ScopeProvider {
    id: string;
}

export interface DataGroup {
    keys: any[];
    datumIndices: readonly (readonly number[])[];
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
const DOMAIN_BANDS = Symbol('domain-bands');

/**
 * DATA MODEL OPTIMIZATIONS:
 *
 * 1. SHARED MEMORY OPTIMIZATION (groupsUnique=true):
 *    When each datum has unique keys, all groups share the same datumIndices array
 *    containing [0], since each datum's relative offset from its group is always 0.
 *
 * 2. BANDED DOMAIN PROCESSING:
 *    Large datasets are divided into bands for efficient domain calculation.
 *    Only dirty bands are recalculated during incremental updates.
 *
 * 3. BATCH MERGING:
 *    Column batches with identical characteristics (keys, invalidity) are merged
 *    to reduce processing overhead.
 *
 * 4. INCREMENTAL REPROCESSING:
 *    When supported, only changed data is reprocessed instead of full recalculation.
 */

// Memory optimization: Shared frozen array for datumIndices in grouped data
// when groupsUnique=true. All groups point to same [0] array since each
// datum has relative offset 0 from its group start position.
const SHARED_ZERO_INDICES: readonly number[] = Object.freeze([0]);

// eslint-disable-next-line sonarjs/redundant-type-aliases
type ScopeId = string;

type ProcessedValue = { value: unknown; missing: boolean; valid: boolean };
type SortOrderEntry = { sortOrder: SortOrder };
type ProcessedValueEntry = { value: any; valid: boolean };

interface GroupDatumIteratorOutput {
    group: DataGroup;
    groupIndex: number;
    columnIndex: number;
    datumIndex: number;
}

type InsertionCacheValue = {
    keys: Map<number, ProcessedValueEntry>;
    values: Map<number, ProcessedValueEntry>;
    hasInvalidKey: boolean;
    hasInvalidValue: boolean;
};

type InsertionCache = Map<number, InsertionCacheValue>;

type ColumnBatch = [ScopeId, number[], unknown[][], Set<ScopeId>, boolean[] | undefined, boolean[] | undefined];
type MergedColumnBatch = [ScopeId[], number[], unknown[][], Set<ScopeId>, boolean[] | undefined, boolean[] | undefined];

interface CommonMetadata<D> {
    input: { count: number };
    scopes: Set<ScopeId>;
    dataSources: Map<ScopeId, DataSet<unknown>>;
    invalidKeys: Map<ScopeId, boolean[]> | undefined;
    invalidKeyCount: Map<ScopeId, number> | undefined;
    invalidData: Map<ScopeId, boolean[]> | undefined;
    keys: Map<ScopeId, unknown[]>[];
    columns: any[][];
    columnScopes: Set<ScopeId>[];
    columnNeedValueOf?: boolean[]; // true if column needs valueOf() (contains Dates/objects), false for primitives
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
    optimizations?: OptimizationMetadata;
    [DOMAIN_RANGES]: Map<string, RangeLookup>;
    [KEY_SORT_ORDERS]: Map<number, SortOrderEntry>;
    [COLUMN_SORT_ORDERS]: Map<number, SortOrderEntry>;
    [DOMAIN_BANDS]: Map<InternalDatumPropertyDefinition<any>, BandedDomain>;
}

export interface UngroupedData<D> extends CommonMetadata<D> {
    type: 'ungrouped';
    aggregation?: [number, number][][];
}

export interface GroupedData<D> extends CommonMetadata<D> {
    type: 'grouped';
    groups: DataGroup[];
    groupsUnique: boolean;
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
    def: DataPropertyDefinition<any>;
}

export type ProcessedData<D> = UngroupedData<D> | GroupedData<D>;

/** Metadata about applied/skipped optimizations for debugging */
export interface OptimizationMetadata {
    /** Was reprocessing path used? */
    reprocessing?: {
        applied: boolean;
        reason?: string;
    };

    /** Domain banding optimization per definition */
    domainBanding?: {
        keyDefs: Array<{
            property: string;
            applied: boolean;
            reason?: string;
            stats?: {
                totalBands: number;
                dirtyBands: number;
                dataSize: number;
                scanRatio: number; // 0-1, proportion of data scanned
            };
        }>;
        valueDefs: Array<{
            property: string;
            applied: boolean;
            reason?: string;
            stats?: {
                totalBands: number;
                dirtyBands: number;
                dataSize: number;
                scanRatio: number;
            };
        }>;
    };

    /** Shared datum indices optimization (grouped data only) */
    sharedDatumIndices?: {
        applied: boolean;
        sharedGroupCount: number;
        totalGroupCount: number;
    };

    /** Batch merging optimization */
    batchMerging?: {
        originalBatchCount: number;
        mergedBatchCount: number;
        mergeRatio: number; // 0-1, higher is better
    };

    /** Overall performance metrics */
    performance?: {
        processingTime: number;
        pathTaken: 'full-process' | 'reprocess';
    };
}

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
    props: DataPropertyDefinition<K, IsScoped>[];
    groupByKeys?: Grouped;
    groupByData?: Grouped;
    groupByFn?: GroupByFn;
    domainBandingConfig?: BandedDomainConfig;
};

export type DataPropertyDefinition<K, IsScoped = false> =
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
    dataGroup: DataGroup,
    groupIndex: number
) => void;

export type GroupValueProcessorDefinition<D, K extends keyof D & string> = PropertyIdentifiers &
    PropertySelectors & {
        type: 'group-value-processor';
        /**
         * Outer function called once per all data processing; inner function called once per group;
         * innermost called once per datum.
         */
        adjust: () => () => GroupValueAdjustFn<D, K>;
        /**
         * Indicates whether this processor supports incremental reprocessing.
         * When true, the processor can safely be reapplied to modified data without
         * causing double-processing issues.
         */
        supportsReprocessing?: boolean;
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
                components.push(accessor.slice(1, -1).replaceAll(/(?<!\\)\\'/g, `'`));
            } else if (accessor.startsWith(`"`)) {
                // ["string-property"]
                components.push(accessor.slice(1, -1).replaceAll(/(?<!\\)\\"/g, `"`));
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
    private readonly scopeCache: Map<string, Map<string, DataPropertyDefinition<any> & InternalDefinition<false>>> =
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
                if (def.scopes) {
                    for (const s of def.scopes) {
                        scopes.add(s);
                    }
                }
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
            for (const s of keyScopes) {
                ungroupedScopes.delete(s);
            }

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

    resolveColumnNeedsValueOf(
        scope: ScopeProvider,
        searchId: string,
        processedData: UngroupedData<any> | GroupedData<any>
    ): boolean {
        const index = this.resolveProcessedDataIndexById(scope, searchId);
        return processedData.columnNeedValueOf?.[index] ?? true;
    }

    /**
     * Converts a relative datum index to an absolute column index.
     *
     * INDEXING STRATEGY:
     * - Relative index: Offset from the start of a group (stored in datumIndices)
     * - Absolute index: Position in the full column array
     * - Conversion: absoluteIndex = groupIndex + relativeIndex
     *
     * When groupsUnique=true, relativeIndex is always 0, making this a simple
     * identity mapping. This optimization reduces memory usage significantly
     * for large datasets with unique keys.
     *
     * @param groupIndex index of the group in ProcessedData.groups
     * @param relativeDatumIndex relative index stored in group.datumIndices
     * @returns absolute index for accessing columns
     */
    private resolveAbsoluteIndex(groupIndex: number, relativeDatumIndex: number): number {
        return groupIndex + relativeDatumIndex;
    }

    /**
     * Provides a convenience iterator to iterate over all of the extract datum values in a
     * specific DataGroup.
     *
     * @param scope to which datums should belong
     * @param group containing the datums
     * @param processedData containing the group
     * @param groupIndex index of the group in processedData.groups
     */
    *forEachDatum(scope: ScopeProvider, processedData: GroupedData<any>, group: DataGroup, groupIndex: number) {
        const columnIndex = processedData.columnScopes.findIndex((s) => s.has(scope.id));

        for (const relativeDatumIndex of group.datumIndices[columnIndex] ?? []) {
            const absoluteDatumIndex = this.resolveAbsoluteIndex(groupIndex, relativeDatumIndex);
            yield processedData.columns[columnIndex][absoluteDatumIndex];
        }
    }

    private getUniqueDataSets(processedData: ProcessedData<D>): Set<DataSet<any>> {
        // Deduplicate DataSets (multiple scopes can share same DataSet)
        return new Set(processedData.dataSources.values());
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
        const output: GroupDatumIteratorOutput = {
            groupIndex: 0,
            columnIndex,
        } as any;

        const empty: number[] = [];
        for (const group of processedData.groups) {
            output.group = group;
            for (const relativeDatumIndex of group.datumIndices[columnIndex] ?? empty) {
                output.datumIndex = this.resolveAbsoluteIndex(output.groupIndex, relativeDatumIndex);
                yield output;
            }
            output.groupIndex++;
        }
    }

    getDomain(
        scope: ScopeProvider,
        searchId: string,
        type: DataPropertyDefinition<any>['type'],
        processedData: ProcessedData<K>
    ): any[] | [number, number] | [] {
        const domains = this.getDomainsByType(type ?? 'value', processedData);
        return domains?.[this.resolveProcessedDataIndexById(scope, searchId)] ?? [];
    }

    getDomainBetweenRange(
        scope: ScopeProvider,
        searchIds: string[],
        [i0, i1]: [number, number],
        processedData: ProcessedData<K>
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

    private getSortOrder(
        values: any[],
        index: number,
        sortOrders: Map<number, SortOrderEntry>,
        needsValueOf: boolean
    ): SortOrder {
        let sortOrder = sortOrders.get(index);
        if (sortOrder == null) {
            sortOrder = { sortOrder: valuesSortOrder(values, needsValueOf) };
            sortOrders.set(index, sortOrder);
        }
        return sortOrder.sortOrder;
    }

    getKeySortOrder(scope: ScopeProvider, searchId: string, processedData: ProcessedData<K>): SortOrder {
        const columnIndex = this.resolveProcessedDataIndexById(scope, searchId);
        const keys = processedData.keys[columnIndex]?.get(scope.id);
        // Key columns typically contain dates/objects, so default to true for needsValueOf
        return keys ? this.getSortOrder(keys, columnIndex, processedData[KEY_SORT_ORDERS], true) : undefined;
    }

    getColumnSortOrder(scope: ScopeProvider, searchId: string, processedData: ProcessedData<K>): SortOrder {
        const columnIndex = this.resolveProcessedDataIndexById(scope, searchId);
        // Use columnNeedValueOf metadata to determine if valueOf() is needed
        const needsValueOf = processedData.columnNeedValueOf?.[columnIndex] ?? true;
        return this.getSortOrder(
            processedData.columns[columnIndex],
            columnIndex,
            processedData[COLUMN_SORT_ORDERS],
            needsValueOf
        );
    }

    private getDomainsByType(type: DataPropertyDefinition<any>['type'], processedData: ProcessedData<K>) {
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
        sources: Map<string, DataSet<unknown>>
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

        // Collect optimization metadata for testing
        this.collectOptimizationMetadata(processedData, 'full-process');
        if (this.debug.check()) {
            logProcessedData(processedData);
        }

        this.processScopeCache();

        return processedData as Grouped extends true ? GroupedData<D> : UngroupedData<D>;
    }

    /**
     * Determines if incremental reprocessing is supported for the given data.
     *
     * Reprocessing is supported when:
     * - For ungrouped data: No aggregates, reducers, processors, or property processors
     * - For grouped data: Additionally requires:
     *   - groupsUnique=true (each datum has unique keys)
     *   - Single data source (all scopes share same DataSet)
     *   - No invalid keys (to maintain groups.length === columns.length invariant)
     *   - All group processors support reprocessing
     *
     * When unsupported, falls back to full reprocessing automatically.
     *
     * @returns true if incremental reprocessing can be used, false otherwise
     */
    public isReprocessingSupported(processedData: ProcessedData<D>): boolean {
        // Grouped data has additional constraints for incremental updates
        if (processedData.type === 'grouped') {
            // Require unique groups - each datum must have distinct keys
            if (!processedData.groupsUnique) return false;

            // Require single data source - all scopes must share same DataSet
            const uniqueDataSets = this.getUniqueDataSets(processedData);
            if (uniqueDataSets.size !== 1) return false;

            // Key constraint: grouped data requires groupsUnique=true because
            // incremental updates can't handle aggregation recalculation yet
            // Cannot have invalid keys - would break groups.length === columns.length invariant
            const scope = first(processedData.scopes);
            const invalidKeys = processedData.invalidKeys?.get(scope);
            if (invalidKeys?.some((invalid) => invalid)) return false;
        }

        // Don't support these features yet (existing constraints)
        if (this.aggregates.length > 0) return false;
        if (this.reducers.length > 0) return false;
        if (this.processors.length > 0) return false;
        if (this.propertyProcessors.length > 0) return false;

        // Check if all group processors support reprocessing
        return this.groupProcessors.every((p) => p.supportsReprocessing ?? false);
    }

    public reprocessData(
        processedData: ProcessedData<D>,
        dataSets?: Map<DataSet<any>, DataChangeDescription | undefined>
    ): ProcessedData<D> {
        // INCREMENTAL REPROCESSING OPTIMIZATION:
        // Instead of reprocessing all data, we:
        // 1. Apply change descriptions to transform existing arrays
        // 2. Process only new insertions
        // 3. Update only affected domain bands
        // 4. Reuse existing group structures when possible
        // This can reduce processing time by 90%+ for small updates to large datasets

        if (!this.isReprocessingSupported(processedData)) {
            // Log fallback reason if debug is enabled
            if (this.debug.check()) {
                this.debug('Falling back to full reprocessing - incremental not supported for current configuration');
            }
            // Fallback to full reprocessing when incremental is not supported
            // First commit any pending transactions (deduplicate DataSets)
            const uniqueDataSets = this.getUniqueDataSets(processedData);
            for (const dataSet of uniqueDataSets) {
                dataSet.commitPendingTransactions();
            }
            return this.processData(processedData.dataSources)!;
        }

        const start = performance.now();

        const scopeChanges = this.collectScopeChanges(processedData, dataSets);
        if (scopeChanges.size === 0) {
            return processedData;
        }

        this.commitPendingTransactions(processedData);
        const { processValue } = this.initDataDomainProcessor('skip');
        const insertionCaches = this.processAllInsertions(processedData, scopeChanges, processValue);

        this.updateBandsForChanges(processedData, scopeChanges);
        const removedKeys = this.transformKeysArrays(processedData, scopeChanges, insertionCaches);
        this.transformColumnsArrays(processedData, scopeChanges, insertionCaches);
        this.transformInvalidityArrays(processedData, scopeChanges, insertionCaches);

        // Transform groups array for grouped data (when groupsUnique=true)
        if (processedData.type === 'grouped') {
            this.transformGroupsArray(processedData, scopeChanges, insertionCaches);

            // Reapply group processors to new data if they support reprocessing
            if (this.groupProcessors.length > 0) {
                this.reprocessGroupProcessors(processedData, scopeChanges);
            }
        }

        this.recomputeDomains(processedData);

        if (processedData.reduced?.diff != null && scopeChanges.size > 0) {
            this.generateDiffMetadata(processedData, scopeChanges, removedKeys);
        }

        this.updateProcessedDataMetadata(processedData);

        const end = performance.now();
        processedData.time = end - start;

        // Collect optimization metadata for testing
        this.collectOptimizationMetadata(processedData, 'reprocess');

        return processedData;
    }

    /**
     * Applies an operation to all banded domains in a collection.
     */
    private applyOperationToBandedDomains(
        bandedDomains: Map<InternalDatumPropertyDefinition<any>, BandedDomain>,
        operation: (domain: BandedDomain) => void
    ): void {
        for (const domain of bandedDomains.values()) {
            if (domain instanceof BandedDomain) {
                operation(domain);
            }
        }
    }

    /**
     * Updates banded domains based on pending changes.
     *
     * BANDING OPTIMIZATION:
     * - Divides large datasets into bands (default ~100 bands)
     * - Tracks which bands are "dirty" and need recalculation
     * - During updates, only dirty bands are reprocessed
     * - Significantly reduces domain calculation overhead for large datasets
     *
     * Example: 1M data points → 100 bands of 10K points each
     * Adding 1000 points only dirties 1-2 bands instead of scanning all 1M points
     *
     * This optimizes domain recalculation by only marking affected bands as dirty.
     * Deduplicates change descriptions to avoid processing the same changes multiple times
     * when multiple scopes share the same DataSet.
     */
    private updateBandsForChanges(
        processedData: ProcessedData<D>,
        scopeChanges: Map<ScopeId, DataChangeDescription>
    ): void {
        const bandedDomains = processedData[DOMAIN_BANDS];
        if (bandedDomains.size === 0) return;

        // Deduplicate change descriptions (multiple scopes can share same DataSet/changeDesc)
        const processedChangeDescs = new Set<DataChangeDescription>();

        for (const [, changeDesc] of scopeChanges) {
            // Skip if we've already processed this change description
            if (processedChangeDescs.has(changeDesc)) continue;
            processedChangeDescs.add(changeDesc);

            const { indexMap } = changeDesc;
            const { spliceOps } = indexMap;

            for (const op of spliceOps) {
                if (op.insertCount > 0) {
                    this.applyOperationToBandedDomains(bandedDomains, (domain) =>
                        domain.handleInsertion(op.index, op.insertCount)
                    );
                }

                if (op.deleteCount > 0) {
                    this.applyOperationToBandedDomains(bandedDomains, (domain) =>
                        domain.handleRemoval(op.index, op.deleteCount)
                    );
                }
            }
            // Note: No need for special append-only or prepend-only handling here.
            // handleInsertion() now properly marks the last band dirty when appending,
            // and handleRemoval() marks the first band dirty when removing from start.
        }
    }

    /**
     * Collects change descriptions from all DataSets before committing.
     */
    private collectScopeChanges(
        processedData: ProcessedData<D>,
        dataSets?: Map<DataSet<any>, DataChangeDescription | undefined>
    ): Map<ScopeId, DataChangeDescription> {
        const scopeChanges = new Map<ScopeId, DataChangeDescription>();
        for (const [scopeId, dataSet] of processedData.dataSources) {
            const changeDesc = dataSets?.get(dataSet) ?? dataSet.getChangeDescription();
            if (changeDesc) {
                scopeChanges.set(scopeId, changeDesc);
            }
        }
        return scopeChanges;
    }

    /**
     * Commits all pending transactions to the data arrays.
     * Deduplicates DataSets to avoid committing the same DataSet multiple times
     * when multiple scopes share the same DataSet.
     */
    private commitPendingTransactions(processedData: ProcessedData<D>): void {
        // Deduplicate DataSets before committing (multiple scopes can share same DataSet)
        const uniqueDataSets = this.getUniqueDataSets(processedData);
        for (const dataSet of uniqueDataSets) {
            dataSet.commitPendingTransactions();
        }
    }

    /**
     * Pre-processes all insertions once per scope to avoid redundant computation.
     */
    private processAllInsertions(
        processedData: ProcessedData<D>,
        scopeChanges: Map<ScopeId, DataChangeDescription>,
        processValue: (
            def: InternalDatumPropertyDefinition<K>,
            datum: any,
            idx: number,
            scopes: string | string[]
        ) => ProcessedValue
    ): Map<ScopeId, InsertionCache> {
        const insertionCaches = new Map<ScopeId, InsertionCache>();
        for (const [scope, changeDesc] of scopeChanges) {
            const dataSet = processedData.dataSources.get(scope);
            if (!dataSet) continue;

            const cache = this.processInsertionsOnce(scope, changeDesc, dataSet, processValue);
            insertionCaches.set(scope, cache);
        }
        return insertionCaches;
    }

    /**
     * Generic utility to transform arrays using cached insertion results.
     * This reduces duplication across transformKeysArrays, transformColumnsArrays, and transformInvalidityArrays.
     */
    private transformArraysWithCache<T>(
        definitions: InternalDatumPropertyDefinition<K>[],
        scopeChanges: Map<ScopeId, DataChangeDescription>,
        insertionCaches: Map<ScopeId, InsertionCache>,
        getArray: (defIndex: number, scope: ScopeId) => T[] | undefined,
        getScopes: (def: InternalDatumPropertyDefinition<K>) => string[],
        extractValue: (
            cached: InsertionCacheValue | undefined,
            def: InternalDatumPropertyDefinition<K>,
            defIndex: number
        ) => T
    ): void {
        for (const [defIndex, def] of definitions.entries()) {
            for (const scope of getScopes(def)) {
                const changeDesc = scopeChanges.get(scope);
                if (!changeDesc) continue;

                const array = getArray(defIndex, scope);
                if (!array) continue;

                const insertionCache = insertionCaches.get(scope);

                changeDesc.applyToArray(array, (destIndex) => {
                    const cached = insertionCache?.get(destIndex);
                    return extractValue(cached, def, defIndex);
                });
            }
        }
    }

    /**
     * Transforms keys arrays using cached insertion results.
     */
    private transformKeysArrays(
        processedData: ProcessedData<D>,
        scopeChanges: Map<ScopeId, DataChangeDescription>,
        insertionCaches: Map<ScopeId, InsertionCache>
    ): Map<ScopeId, Set<string>> {
        type RemovedMetadata = { tuples: any[][] };
        const removedByScope = new Map<ScopeId, RemovedMetadata>();

        const ensureRemovedMetadata = (scope: ScopeId): RemovedMetadata => {
            let metadata = removedByScope.get(scope);
            if (!metadata) {
                metadata = { tuples: [] };
                removedByScope.set(scope, metadata);
            }
            return metadata;
        };

        // Track which arrays have already been processed to avoid double-processing
        // when multiple scopes share the same array reference.
        // This method needs special handling to track removed metadata across shared arrays,
        // which is why it doesn't use a common helper pattern.
        const processedArrays = new WeakSet<unknown[]>();

        for (const [defIndex, def] of this.keys.entries()) {
            for (const scope of def.scopes ?? []) {
                const changeDesc = scopeChanges.get(scope);
                if (!changeDesc) continue;

                const keysArray = processedData.keys[defIndex]?.get(scope);
                if (!keysArray) continue;

                // Skip if this array has already been processed (shared between scopes)
                if (processedArrays.has(keysArray)) {
                    // Still need to track removed metadata for this scope
                    const sourceScope = Array.from(processedData.keys[defIndex].entries()).find(
                        ([_, arr]) => arr === keysArray
                    )?.[0];
                    if (sourceScope && sourceScope !== scope && removedByScope.has(sourceScope)) {
                        // Copy removed metadata from the scope that processed this array
                        removedByScope.set(scope, removedByScope.get(sourceScope)!);
                    }
                    continue;
                }
                processedArrays.add(keysArray);

                const insertionCache = insertionCaches.get(scope);
                const removedMetadata = ensureRemovedMetadata(scope);
                let removalCursor = 0;

                changeDesc.applyToArray(
                    keysArray,
                    (destIndex) => {
                        const cached = insertionCache?.get(destIndex);
                        if (cached) {
                            const keyResult = cached.keys.get(defIndex);
                            return keyResult?.valid ? keyResult.value : def.invalidValue;
                        }
                        return def.invalidValue;
                    },
                    (removedValues) => {
                        for (const value of removedValues) {
                            if (!removedMetadata.tuples[removalCursor]) {
                                removedMetadata.tuples[removalCursor] = new Array(this.keys.length);
                            }

                            removedMetadata.tuples[removalCursor][defIndex] = value;
                            removalCursor += 1;
                        }
                    }
                );
            }
        }

        const removedKeyStrings = new Map<ScopeId, Set<string>>();
        for (const [scope, { tuples }] of removedByScope) {
            if (tuples.length === 0) continue;

            const scopeSet = new Set<string>();
            for (const tuple of tuples) {
                const keyValues: any[] = [];
                for (const [defIndex, value] of tuple.entries()) {
                    const keyDef = this.keys[defIndex];
                    if (!keyDef.scopes?.includes(scope)) continue;
                    keyValues.push(value);
                }

                if (keyValues.length > 0) {
                    scopeSet.add(toKeyString(keyValues));
                }
            }

            removedKeyStrings.set(scope, scopeSet);
        }

        return removedKeyStrings;
    }

    /**
     * Transforms columns arrays using cached insertion results.
     */
    private transformColumnsArrays(
        processedData: ProcessedData<D>,
        scopeChanges: Map<ScopeId, DataChangeDescription>,
        insertionCaches: Map<ScopeId, InsertionCache>
    ): void {
        this.transformArraysWithCache(
            this.values,
            scopeChanges,
            insertionCaches,
            (defIndex) => processedData.columns[defIndex],
            (def) => [first(def.scopes)],
            (cached, def, defIndex) => {
                if (cached) {
                    const valueResult = cached.values.get(defIndex);
                    return valueResult?.valid ? valueResult.value : def.invalidValue;
                }
                return def.invalidValue;
            }
        );
    }

    /**
     * Helper to transform a scope-based invalidity map.
     */
    private transformInvalidityMap(
        invalidityMap: Map<ScopeId, boolean[]>,
        scopeChanges: Map<ScopeId, DataChangeDescription>,
        insertionCaches: Map<ScopeId, InsertionCache>,
        extractValue: (cached: InsertionCacheValue | undefined) => boolean
    ): void {
        // Track which arrays have already been processed to avoid double-processing
        // when multiple scopes share the same array reference
        const processedArrays = new Set<boolean[]>();

        for (const [scope, changeDesc] of scopeChanges) {
            const array = invalidityMap.get(scope);
            if (!array) continue;

            // Skip if this array has already been processed (shared between scopes)
            if (processedArrays.has(array)) continue;
            processedArrays.add(array);

            const insertionCache = insertionCaches.get(scope);

            changeDesc.applyToArray(array, (destIndex) => {
                const cached = insertionCache?.get(destIndex);
                return extractValue(cached);
            });
        }
    }

    /**
     * Transforms invalidity arrays using cached insertion results.
     */
    private transformInvalidityArrays(
        processedData: ProcessedData<D>,
        scopeChanges: Map<ScopeId, DataChangeDescription>,
        insertionCaches: Map<ScopeId, InsertionCache>
    ): void {
        if (processedData.invalidKeys) {
            this.transformInvalidityMap(
                processedData.invalidKeys,
                scopeChanges,
                insertionCaches,
                (cached) => cached?.hasInvalidKey ?? false
            );
        }

        if (processedData.invalidData) {
            this.transformInvalidityMap(processedData.invalidData, scopeChanges, insertionCaches, (cached) =>
                cached ? cached.hasInvalidKey || cached.hasInvalidValue : false
            );
        }
    }

    /**
     * Transforms the groups array for grouped data during reprocessing.
     * Only called when groupsUnique=true and no invalid keys exist.
     *
     * This maintains the invariant: groups[i] corresponds to datum at columns[i].
     */
    private transformGroupsArray(
        processedData: GroupedData<D>,
        scopeChanges: Map<ScopeId, DataChangeDescription>,
        insertionCaches: Map<ScopeId, InsertionCache>
    ): void {
        // With our constraints, there should be exactly one data-set
        const scope = first(processedData.scopes);
        const changeDesc = scopeChanges.get(scope);
        if (!changeDesc) return;

        const insertionCache = insertionCaches.get(scope);

        // Validate: no new invalid keys in insertions (maintains our invariant)
        for (const [, cached] of insertionCache ?? []) {
            if (cached.hasInvalidKey) {
                throw new Error(
                    'AG Charts - reprocessing grouped data with invalid keys not supported. ' +
                        'This typically indicates a data quality issue that requires full reprocessing.'
                );
            }
        }

        // Critical invariant: After this transformation, groups[i] must
        // still correspond to datum at columns[j][i] for all columns.
        // This is why we require no invalid keys - they would break this mapping.

        // Apply the same transformation to groups array as we did to columns/keys
        // For each insertion, create a new DataGroup; for deletions, groups are removed
        changeDesc.applyToArray(processedData.groups, (destIndex) => {
            return this.createDataGroupForInsertion(destIndex, processedData, scope, insertionCache);
        });
    }

    /**
     * Creates a new DataGroup for an inserted datum during reprocessing.
     *
     * When groupsUnique=true and no invalid keys exist, each datum has:
     * - A unique set of keys
     * - datumIndices[columnIdx] = [0] (relative offset is always 0)
     * - All scopes are valid initially (unless invalid value detected)
     */
    private createDataGroupForInsertion(
        datumIndex: number,
        processedData: GroupedData<D>,
        scope: ScopeId,
        insertionCache: InsertionCache | undefined
    ): DataGroup {
        // 1. Extract keys from the keys arrays at datumIndex
        const keys: any[] = [];
        for (const keysMap of processedData.keys) {
            const scopeKeys = keysMap.get(scope);
            if (scopeKeys) {
                keys.push(scopeKeys[datumIndex]);
            }
        }

        // 2. Re-use shared datumIndices array when groupsUnique=true with no invalid keys
        const firstGroup = processedData.groups[0];
        const allZeroDatumIndices = () =>
            Object.freeze(createArray(processedData.columnScopes.length, SHARED_ZERO_INDICES));
        const datumIndices = firstGroup?.datumIndices ?? allZeroDatumIndices();

        // 3. Determine validScopes
        // With our constraints (no invalid keys), check only for invalid values
        const cached = insertionCache?.get(datumIndex);
        const hasInvalidValue = cached?.hasInvalidValue ?? false;

        let validScopes: Set<ScopeId>;
        if (hasInvalidValue) {
            // Create new Set excluding the invalid scope
            validScopes = new Set(processedData.scopes);
            validScopes.delete(scope);
        } else {
            // Reuse existing Set (all scopes valid)
            validScopes = processedData.scopes;
        }

        return {
            keys,
            datumIndices,
            aggregation: [], // Empty - we don't support aggregates in reprocessing yet
            validScopes,
        };
    }

    /**
     * Creates or retrieves the appropriate domain for a definition.
     * Handles both discrete and continuous domains, with optional banding optimization.
     */
    private setupDomainForDefinition(
        def: InternalDatumPropertyDefinition<K>,
        bandedDomains: Map<InternalDatumPropertyDefinition<any>, BandedDomain>,
        bandingConfig: BandedDomainConfig | undefined
    ): IDataDomain {
        if (def.valueType === 'category') {
            return new DiscreteDomain();
        }

        let domain = bandedDomains.get(def);
        if (!domain && bandingConfig?.enableBanding !== false) {
            domain = new BandedDomain(() => new ContinuousDomain(), bandingConfig, false);
            bandedDomains.set(def, domain);
        }

        return domain ?? new ContinuousDomain();
    }

    /**
     * Extends a domain from data array, using banded optimization if available.
     * Note: For BandedDomain, bands should already be initialized before calling this method.
     */
    private extendDomainFromData(domain: IDataDomain, data: any[], invalidData?: boolean[]): void {
        if (domain instanceof BandedDomain) {
            // Bands should already be initialized by recomputeDomains()
            // This preserves the selective dirty marking from updateBandsForChanges()
            domain.extendBandsFromData(data, invalidData);
        } else {
            for (let i = 0; i < data.length; i++) {
                if (invalidData?.[i] === true) continue;
                domain.extend(data[i]);
            }
        }
    }

    /**
     * Initializes a banded domain if needed based on data size and state.
     * This is a memory optimization that divides large datasets into bands.
     */
    private initializeBandedDomain(domain: IDataDomain, dataSize: number, propertyName?: string): void {
        if (!(domain instanceof BandedDomain)) return;

        const stats = domain.getStats();
        const shouldReinit = stats.bandCount === 0 || stats.dataSize !== dataSize || stats.needsReinitialization;

        if (this.debug.check() && shouldReinit && propertyName) {
            this.debug(
                `Reinitializing bands for ${propertyName}: bandCount=${stats.bandCount}, ` +
                    `dataSize=${stats.dataSize}, dataLength=${dataSize}, ` +
                    `needsReinitialization=${stats.needsReinitialization}`
            );
        }

        if (shouldReinit) {
            domain.initializeBands(dataSize);
        }
    }

    /**
     * Recomputes domains from transformed arrays.
     * Uses BandedDomain optimization for continuous domains to avoid full rescans.
     */
    private recomputeDomains(processedData: ProcessedData<D>): void {
        const startTime = this.debug.check() ? performance.now() : 0;
        const bandedDomains = processedData[DOMAIN_BANDS];
        const bandingConfig = this.opts.domainBandingConfig;
        let bandStats: { totalBands: number; dirtyBands: number; totalData: number } | undefined;

        const keyDomains: Map<InternalDatumPropertyDefinition<K>, IDataDomain> = new Map();
        const valueDomains: Map<InternalDatumPropertyDefinition<K>, IDataDomain> = new Map();

        for (const keyDef of this.keys) {
            keyDomains.set(keyDef, this.setupDomainForDefinition(keyDef, bandedDomains, bandingConfig));
        }

        for (const valueDef of this.values) {
            valueDomains.set(valueDef, this.setupDomainForDefinition(valueDef, bandedDomains, bandingConfig));
        }

        // Initialize bands for key domains first (this determines band structure)
        // Only initialize if bands don't exist yet or if data size has changed significantly
        // During reprocessing, bands are already adjusted by updateBandsForChanges()
        for (const [keyDefIndex, keyDef] of this.keys.entries()) {
            const keysMap = processedData.keys[keyDefIndex];
            const domain = keyDomains.get(keyDef)!;
            const maxKeyLength = Math.max(...Array.from(keysMap.values()).map((keys) => keys.length));
            this.initializeBandedDomain(domain, maxKeyLength, String(keyDef.property));
        }

        // Initialize bands for value domains
        for (const [valueDefIndex, valueDef] of this.values.entries()) {
            const column = processedData.columns[valueDefIndex];
            const domain = valueDomains.get(valueDef)!;
            this.initializeBandedDomain(domain, column.length, String(valueDef.property));
        }

        // Collect pre-scan band statistics (after initialization, before extending domains)
        // This shows how many bands WILL BE scanned, not how many are currently dirty
        // Always collect these stats so they're available for testing
        const preScanDomainStats = new Map<IDataDomain, ReturnType<BandedDomain['getStats']>>();
        if (bandedDomains.size > 0) {
            bandStats = {
                totalBands: 0,
                dirtyBands: 0,
                totalData: 0,
            };

            for (const domain of bandedDomains.values()) {
                if (domain instanceof BandedDomain) {
                    const stats = domain.getStats();
                    // Store per-domain stats for metadata collection
                    preScanDomainStats.set(domain, stats);
                    // Aggregate for logging
                    bandStats.totalBands += stats.bandCount;
                    bandStats.dirtyBands += stats.dirtyBandCount;
                    bandStats.totalData = Math.max(bandStats.totalData, stats.dataSize);
                }
            }
        }

        // Extend key domains from keys arrays
        for (const [keyDefIndex, keyDef] of this.keys.entries()) {
            const keysMap = processedData.keys[keyDefIndex];
            const domain = keyDomains.get(keyDef)!;

            // Extend domain from each scope
            for (const scope of keyDef.scopes ?? []) {
                const keys = keysMap.get(scope);
                if (!keys) continue;

                // Use invalidKeys (not invalidData) to only skip items with invalid keys
                // This matches processData() behavior where valid keys contribute to domain
                // even if their corresponding values are invalid
                const invalidKeys = processedData.invalidKeys?.get(scope);
                this.extendDomainFromData(domain, keys, invalidKeys);
            }
        }

        // Extend value domains from columns arrays
        for (const [valueDefIndex, valueDef] of this.values.entries()) {
            const column = processedData.columns[valueDefIndex];
            const domain = valueDomains.get(valueDef)!;
            const columnScope = first(valueDef.scopes);
            const invalidData = processedData.invalidData?.get(columnScope);

            this.extendDomainFromData(domain, column, invalidData);
        }

        processedData.domain.keys = this.keys.map((keyDef) => {
            const domain = keyDomains.get(keyDef)!;
            const result = domain.getDomain();
            // Ignore starting values
            if (ContinuousDomain.is(domain) && result[0] > result[1]) {
                return [];
            }
            return result;
        });

        processedData.domain.values = this.values.map((valueDef) => {
            const domain = valueDomains.get(valueDef)!;
            const result = domain.getDomain();
            // Ignore starting values
            if (ContinuousDomain.is(domain) && result[0] > result[1]) {
                return [];
            }
            return result;
        });

        // Rebuild domain.groups for grouped data
        if (processedData.type === 'grouped') {
            processedData.domain.groups = processedData.groups.map((group) => group.keys);
        }

        // Always collect banding metadata for testing (pass per-domain pre-scan stats)
        this.collectDomainBandingMetadata(processedData, keyDomains, valueDomains, bandedDomains, preScanDomainStats);

        // Log performance metrics when debug is enabled
        if (this.debug.check() && startTime > 0) {
            const endTime = performance.now();
            const duration = endTime - startTime;

            if (bandStats && bandStats.totalBands > 0) {
                const scanRatio = bandStats.dirtyBands / bandStats.totalBands;
                const dataScanned = Math.round(scanRatio * bandStats.totalData);
                this.debug(
                    `recomputeDomains with banding: ${duration.toFixed(2)}ms, ` +
                        `bands: ${bandStats.dirtyBands}/${bandStats.totalBands} dirty, ` +
                        `data scanned: ~${dataScanned}/${bandStats.totalData} (${(scanRatio * 100).toFixed(1)}%)`
                );
            } else {
                this.debug(`recomputeDomains: ${duration.toFixed(2)}ms (no banding)`);
            }
        }
    }

    /**
     * Generates diff metadata for animations and incremental rendering.
     * This is an opt-in feature - only runs if diff tracking is already initialized.
     */
    private generateDiffMetadata(
        processedData: ProcessedData<D>,
        scopeChanges: Map<ScopeId, DataChangeDescription>,
        removedKeys: Map<ScopeId, Set<string>>
    ): void {
        // Helper to get key string for a datum at a given index (in post-transformed arrays)
        const getKeyString = (scope: ScopeId, datumIndex: number): string | undefined => {
            const keys: any[] = [];
            for (const keysMap of processedData.keys) {
                const scopeKeys = keysMap.get(scope);
                if (!scopeKeys) return undefined;
                keys.push(scopeKeys[datumIndex]);
            }
            return keys.length > 0 ? toKeyString(keys) : undefined;
        };

        // Process each scope's changes
        for (const [scope, changeDesc] of scopeChanges) {
            const diff: ProcessedOutputDiff = {
                changed: true,
                added: new Set<string>(),
                removed: removedKeys.get(scope) ?? new Set<string>(),
                updated: new Set<string>(),
                moved: new Set<string>(),
            };

            // Get insertions and add to 'added' set
            for (const op of changeDesc.indexMap.spliceOps) {
                if (op.insertCount > 0) {
                    for (let i = 0; i < op.insertCount; i++) {
                        const datumIndex = op.index + i;
                        const keyStr = getKeyString(scope, datumIndex);
                        if (keyStr) {
                            diff.added.add(keyStr);
                        }
                    }
                }
            }

            const { originalLength, totalPrependCount } = changeDesc.indexMap;

            if (isAppendOnly(changeDesc.indexMap)) {
                // Nothing moved
            } else if (isPrependOnly(changeDesc.indexMap) && originalLength > 0) {
                for (let destIndex = totalPrependCount; destIndex < totalPrependCount + originalLength; destIndex++) {
                    const keyStr = getKeyString(scope, destIndex);
                    if (keyStr) diff.moved.add(keyStr);
                }
            } else if (hasNoRemovals(changeDesc.indexMap) && totalPrependCount > 0) {
                for (let sourceIndex = 0; sourceIndex < originalLength; sourceIndex++) {
                    const destIndex = sourceIndex + totalPrependCount;
                    const keyStr = getKeyString(scope, destIndex);
                    if (keyStr) diff.moved.add(keyStr);
                }
            } else {
                changeDesc.forEachPreservedIndex((sourceIndex, destIndex) => {
                    if (sourceIndex !== destIndex) {
                        const keyStr = getKeyString(scope, destIndex);
                        if (keyStr) diff.moved.add(keyStr);
                    }
                });
            }

            processedData.reduced!.diff![scope] = diff;
        }
    }

    /**
     * Updates metadata after array transformations.
     */
    private updateProcessedDataMetadata(processedData: ProcessedData<D>): void {
        let maxDataLength = 0;
        for (const dataSet of processedData.dataSources.values()) {
            maxDataLength = Math.max(maxDataLength, dataSet.data.length);
        }
        processedData.input.count = maxDataLength;

        // Recompute partialValidDataCount (datums with valid keys but invalid values)
        let partialValidDataCount = 0;
        for (const [scope, invalidData] of processedData.invalidData ?? new Map()) {
            const invalidKeys = processedData.invalidKeys?.get(scope);
            for (let i = 0; i < invalidData.length; i++) {
                if (invalidData[i] && !invalidKeys?.[i]) {
                    partialValidDataCount += 1;
                }
            }
        }
        processedData.partialValidDataCount = partialValidDataCount;

        // Recompute invalidKeyCount
        if (processedData.invalidKeyCount) {
            for (const [scope, invalidKeys] of processedData.invalidKeys ?? new Map()) {
                const count = invalidKeys.filter(Boolean).length;
                processedData.invalidKeyCount.set(scope, count);
            }
        }

        // Clear cached data that depends on array positions
        processedData[DOMAIN_RANGES].clear();
        processedData[KEY_SORT_ORDERS].clear();
        processedData[COLUMN_SORT_ORDERS].clear();
        // Note: We intentionally don't clear DOMAIN_BANDS here as they maintain state across updates
    }

    /**
     * Processes all insertions for a given scope once, caching the results.
     * Returns a map from ADJUSTED destIndex to processed values for all keys and values.
     * The adjusted destIndex accounts for out-of-bounds insertions that need to be shifted.
     */
    private processInsertionsOnce(
        scope: ScopeId,
        changeDesc: DataChangeDescription,
        dataSet: DataSet<unknown>,
        processValue: (
            def: InternalDatumPropertyDefinition<K>,
            datum: any,
            idx: number,
            scopes: string | string[]
        ) => ProcessedValue
    ): InsertionCache {
        const cache = new Map<number, InsertionCacheValue>();

        const { finalLength } = changeDesc.indexMap;

        // Extract insertions from splice operations
        for (const op of changeDesc.indexMap.spliceOps) {
            if (op.insertCount <= 0) continue;

            for (let i = 0; i < op.insertCount; i++) {
                const destIndex = op.index + i;
                if (destIndex < 0 || destIndex >= finalLength) {
                    continue; // Skip invalid indices
                }

                const datum = dataSet.data[destIndex];

                const keys = new Map<number, ProcessedValueEntry>();
                const values = new Map<number, ProcessedValueEntry>();
                let hasInvalidKey = false;
                let hasInvalidValue = false;

                if (datum == null || typeof datum !== 'object') {
                    hasInvalidKey = true;
                    hasInvalidValue = true;
                } else {
                    // Process all keys for this scope
                    for (const [keyDefIndex, keyDef] of this.keys.entries()) {
                        if (!keyDef.scopes?.includes(scope)) continue;

                        const result = processValue(keyDef, datum, destIndex, scope);
                        keys.set(keyDefIndex, { value: result.value, valid: result.valid });

                        if (!result.valid) {
                            hasInvalidKey = true;
                        }
                    }

                    // Process all values for this scope
                    for (const [valueDefIndex, valueDef] of this.values.entries()) {
                        if (!valueDef.scopes?.includes(scope)) continue;

                        const result = processValue(valueDef, datum, destIndex, valueDef.scopes);
                        values.set(valueDefIndex, { value: result.value, valid: result.valid });

                        if (!result.valid) {
                            hasInvalidValue = true;
                        }
                    }
                }

                cache.set(destIndex, { keys, values, hasInvalidKey, hasInvalidValue });
            }
        }

        return cache;
    }

    private warnDataMissingProperties(sources: Map<string, DataSet<unknown>>) {
        if (sources.size === 0) return;

        for (const def of iterate(this.keys, this.values)) {
            for (const [scope, missCount] of def.missing) {
                if (missCount < (sources.get(scope)?.data.length ?? Infinity)) continue;
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

    private extractData(sources: Map<string, DataSet<unknown>>): UngroupedData<D> {
        const { dataDomain, processValue, allScopesHaveSameDefs } = this.initDataDomainProcessor('extend');

        const { keys: keyDefs, values: valueDefs } = this;

        const { invalidData, invalidKeys, invalidKeyCount, allKeyMappings } = this.extractKeys(
            keyDefs,
            sources,
            processValue
        );

        const { columns, columnScopes, columnNeedValueOf, partialValidDataCount, maxDataLength } = this.extractValues(
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
            columnNeedValueOf,
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
            [DOMAIN_BANDS]: new Map(),
        } satisfies UngroupedData<D>;
    }

    private extractKeys(
        keyDefs: InternalDatumPropertyDefinition<K>[],
        sources: Map<string, DataSet<unknown>>,
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
                const data = sources.get(scope)?.data ?? [];
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
        sources: Map<string, DataSet<unknown>>,
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
        const columnNeedValueOf: boolean[] = [];
        let maxDataLength = 0;
        for (const def of valueDefs) {
            const { invalidValue } = def;

            const valueSources = new Set(def.scopes.map((s) => sources.get(s)));
            if (valueSources.size > 1) {
                throw new Error(`AG Charts - more than one data source for: ${JSON.stringify(def)}`);
            }
            const columnScopes = new Set(def.scopes);
            const columnScope = first(def.scopes);
            const columnSource = sources.get(columnScope)?.data ?? [];
            const column = new Array<unknown>();
            const invalidKeys = scopeInvalidKeys.get(columnScope);
            let needsValueOf = false;
            for (let datumIndex = 0; datumIndex < columnSource.length; datumIndex++) {
                if (columnSource[datumIndex] == null || typeof columnSource[datumIndex] !== 'object') continue;

                const valueDatum = columnSource[datumIndex];
                const invalidKey = invalidKeys == null ? false : invalidKeys[datumIndex];

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

                // Detect if this column contains Date objects or other objects needing valueOf()
                if (!needsValueOf && value != null && typeof value === 'object') {
                    needsValueOf = true;
                }

                column[datumIndex] = value;
            }

            columns.push(column);
            allColumnScopes.push(columnScopes);
            columnNeedValueOf.push(needsValueOf);
            maxDataLength = Math.max(maxDataLength, column.length);
        }

        return { columns, columnScopes: allColumnScopes, columnNeedValueOf, partialValidDataCount, maxDataLength };
    }

    /**
     * GROUPED DATA STRUCTURE AND INVARIANTS:
     *
     * When groupsUnique=true (each datum has distinct keys):
     * - groups.length === columns[i].length for all columns
     * - groups[i] corresponds to datum at columns[j][i]
     * - All datumIndices arrays contain [0] (shared memory optimization)
     * - Relative indexing: datumIndices contains offsets from group start
     * - Absolute indexing: groupIndex + relativeDatumIndex gives column position
     *
     * When groupsUnique=false (data is aggregated):
     * - groups.length <= columns[i].length
     * - Multiple datums may map to same group
     * - datumIndices contain actual relative offsets
     *
     * This design optimizes memory usage for high-frequency data updates
     * where each datum typically has unique keys (e.g., time series data).
     */
    private groupData(data: UngroupedData<D>, groupingFn?: GroupingFn<D>): GroupedData<D> {
        type Group = {
            keys: unknown[];
            datumIndices: number[][];
            aggregation: any[];
            validScopes: Set<string>;
        };

        const { keys: dataKeys, columns: allColumns, columnScopes, invalidKeys, invalidData } = data;

        const allScopes = data.scopes;
        const resultGroups = [];
        const resultData = [];

        const groups = allScopes.size !== 1 || groupingFn != null ? new Map<string, [number, Group]>() : undefined;
        let groupsUnique = true;
        let groupIndex = 0;

        // Determine columns we can process in batch.
        const rawBatchCount = allScopes.size;
        const columnBatches = this.groupBatches(
            allScopes,
            allColumns,
            columnScopes,
            dataKeys,
            invalidData,
            invalidKeys
        );
        const mergedBatchCount = columnBatches.length;

        // Track batch merging optimization if debug enabled
        if (this.debug.check() && !data.optimizations) {
            data.optimizations = {};
        }
        if (this.debug.check()) {
            const mergeRatio = rawBatchCount > 0 ? 1 - mergedBatchCount / rawBatchCount : 0;
            data.optimizations!.batchMerging = {
                originalBatchCount: rawBatchCount,
                mergedBatchCount,
                mergeRatio,
            };
        }

        const singleBatch = columnBatches.length === 1;
        const allZeroDatumIndices = Object.freeze(createArray(columnBatches[0][1].length, SHARED_ZERO_INDICES));

        for (const [
            scopes,
            scopeColumnIndexes,
            scopeKeys,
            siblingScopes,
            scopeInvalidData,
            scopeInvalidKeys,
        ] of columnBatches) {
            const firstColumn = allColumns[first(scopeColumnIndexes)];
            for (let datumIndex = 0; datumIndex < firstColumn.length; datumIndex++) {
                if (scopeInvalidKeys?.[datumIndex] === true) continue;

                const keys = scopeKeys.map((k) => k[datumIndex]);
                if (keys == null || keys.length === 0) {
                    throw new Error('AG Charts - no keys found for scope(s): ' + scopes.join(', '));
                }

                const group = groupingFn?.(keys) ?? keys;
                const groupStr = groups == null ? undefined : toKeyString(group);

                let outputGroup: [number, Group] | undefined = groups?.get(groupStr!);
                let currentGroup: Group | undefined;
                let currentGroupIndex: number;
                let isNewGroup = false;
                if (outputGroup == null) {
                    currentGroup = {
                        keys: group,
                        datumIndices: [],
                        aggregation: [],
                        validScopes: allScopes,
                    };
                    currentGroupIndex = groupIndex++;
                    outputGroup = [currentGroupIndex, currentGroup];
                    isNewGroup = true;

                    groups?.set(groupStr!, outputGroup);

                    resultGroups.push(currentGroup.keys);
                    resultData.push(currentGroup);
                } else {
                    [currentGroupIndex, currentGroup] = outputGroup;
                    groupsUnique = false;
                }

                if (scopeInvalidData?.[datumIndex] === true) {
                    if (currentGroup.validScopes === allScopes) {
                        // Lazy Set initialization.
                        currentGroup.validScopes = new Set(allScopes.values());
                    }
                    for (const invalidScope of siblingScopes) {
                        currentGroup.validScopes.delete(invalidScope);
                    }
                }

                if (isNewGroup && datumIndex === currentGroupIndex && singleBatch) {
                    // Optimised case when all datumIndices are [0] for all groups.
                    currentGroup.datumIndices = allZeroDatumIndices as number[][];
                } else {
                    // If reusing a group that has the frozen optimization array, we need mutable arrays
                    if (!isNewGroup && currentGroup.datumIndices === allZeroDatumIndices) {
                        // Convert frozen shared array to mutable copy
                        currentGroup.datumIndices = allZeroDatumIndices.map((arr) => [...arr]);
                    }

                    for (const columnIdx of scopeColumnIndexes) {
                        currentGroup.datumIndices[columnIdx] ??= [];
                        currentGroup.datumIndices[columnIdx].push(datumIndex - currentGroupIndex);
                    }
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
            groupsUnique,
            optimizations: data.optimizations,
            [DOMAIN_BANDS]: data[DOMAIN_BANDS],
        };
    }

    /**
     * Groups and merges column batches for efficient processing.
     *
     * BATCH MERGING OPTIMIZATION:
     * - Identifies columns that share the same data characteristics
     * - Merges compatible batches to reduce iteration overhead
     * - Can reduce processing iterations by 30-50% for multi-scope datasets
     *
     * Compatibility criteria:
     * - Same keys arrays (by reference)
     * - Same invalidity arrays (by reference)
     * - Scopes can be safely processed together
     */
    private groupBatches(
        allScopes: Set<string>,
        allColumns: any[][],
        columnScopes: Set<string>[],
        dataKeys: Map<string, unknown[]>[],
        invalidData: Map<string, boolean[]> | undefined,
        invalidKeys: Map<string, boolean[]> | undefined
    ) {
        const columnBatches: ColumnBatch[] = [];
        const processedColumnIndexes = new Set<number>();
        for (const scope of allScopes) {
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

            const scopeInvalidData = invalidData?.get(scope);
            const scopeInvalidKeys = invalidKeys?.get(scope);

            columnBatches.push([
                scope,
                scopeColumnIndexes,
                scopeKeys,
                siblingScopes,
                scopeInvalidData,
                scopeInvalidKeys,
            ]);
        }

        // Merge compatible column batches to reduce iteration overhead.
        return this.mergeCompatibleBatches(columnBatches);
    }

    /**
     * Checks if two column batches can be merged based on shared data characteristics.
     */
    private areBatchesCompatible(batch1: ColumnBatch, batch2: ColumnBatch): boolean {
        const [, , keys1, , invalidData1, invalidKeys1] = batch1;
        const [, , keys2, , invalidData2, invalidKeys2] = batch2;

        // Batches are compatible if they share the same keys and invalidity arrays
        return keys1.every((k, i) => k === keys2[i]) && invalidKeys1 === invalidKeys2 && invalidData1 === invalidData2;
    }

    private mergeCompatibleBatches(columnBatches: ColumnBatch[]): MergedColumnBatch[] {
        const merged: MergedColumnBatch[] = [];
        const processed = new Set<number>();

        for (let i = 0; i < columnBatches.length; i++) {
            if (processed.has(i)) continue;

            const [scope, columnIndexes, keys, siblingScopes, invalidData, invalidKeys] = columnBatches[i];
            const mergedBatch: MergedColumnBatch = [
                [scope],
                [...columnIndexes],
                keys,
                new Set(siblingScopes),
                invalidData,
                invalidKeys,
            ];

            // Try to merge with subsequent batches
            this.findAndMergeCompatibleBatches(columnBatches, i, mergedBatch, processed);

            merged.push(mergedBatch);
            processed.add(i);
        }

        return merged;
    }

    private findAndMergeCompatibleBatches(
        columnBatches: ColumnBatch[],
        startIndex: number,
        mergedBatch: MergedColumnBatch,
        processed: Set<number>
    ) {
        const firstBatch = columnBatches[startIndex];
        for (let j = startIndex + 1; j < columnBatches.length; j++) {
            if (processed.has(j)) continue;

            const otherBatch = columnBatches[j];
            const [scope, otherColumnIndexes, , otherSiblingScopes] = otherBatch;

            if (!this.areBatchesCompatible(firstBatch, otherBatch)) continue;

            // Merge the batches
            mergedBatch[0].push(scope);
            mergedBatch[1].push(...otherColumnIndexes);
            for (const siblingScope of otherSiblingScopes) {
                mergedBatch[3].add(siblingScope);
            }
            processed.add(j);
        }
    }

    private aggregateUngroupedData(processedData: UngroupedData<any>) {
        const domainAggValues = this.aggregates.map((): [number, number] => [Infinity, -Infinity]);
        processedData.domain.aggValues = domainAggValues;

        const { columns, dataSources } = processedData;

        const onlyScope = first(dataSources.keys());
        const keys = processedData.keys.map((k) => k.get(onlyScope));
        const rawData = dataSources.get(onlyScope)?.data ?? [];
        processedData.aggregation = rawData?.map((_, datumIndex) => {
            const aggregation: [number, number][] = [];

            for (const [index, def] of this.aggregates.entries()) {
                const indices = this.valueGroupIdxLookup(def);
                let groupAggValues = def.groupAggregateFunction?.() ?? [Infinity, -Infinity];
                const valuesToAgg = indices.map((columnIndex) => columns[columnIndex][datumIndex] as D[K]);
                const k = datumKeys(keys, datumIndex);
                const valuesAgg = k == null ? undefined : def.aggregateFunction(valuesToAgg, k);
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

            for (let groupIndex = 0; groupIndex < processedData.groups.length; groupIndex++) {
                const group = processedData.groups[groupIndex];
                group.aggregation ??= [];

                const groupKeys = group.keys;

                let groupAggValues = def.groupAggregateFunction?.() ?? [Infinity, -Infinity];
                const maxDatumIndex = Math.max(
                    ...indices.map((columnIndex) => group.datumIndices[columnIndex]?.length ?? 0)
                );
                for (let datumIndex = 0; datumIndex < maxDatumIndex; datumIndex++) {
                    const valuesToAgg = indices.map((columnIndex) => {
                        const relativeDatumIndex = group.datumIndices[columnIndex]?.[datumIndex];
                        if (relativeDatumIndex == null) {
                            return undefined as D[K];
                        }
                        const absoluteDatumIndex = this.resolveAbsoluteIndex(groupIndex, relativeDatumIndex);
                        return columns[columnIndex][absoluteDatumIndex] as D[K];
                    });
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

            for (let groupIndex = 0; groupIndex < processedData.groups.length; groupIndex++) {
                const dataGroup = processedData.groups[groupIndex];
                adjustFn(columns, valueIndexes, dataGroup, groupIndex);
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

    /**
     * Reprocesses group processors for incremental updates.
     * Only processes newly inserted groups to avoid double-processing.
     * This is safe only when all group processors support reprocessing.
     * Deduplicates change descriptions to avoid processing the same groups multiple times
     * when multiple scopes share the same DataSet.
     */
    private reprocessGroupProcessors(
        processedData: GroupedData<D>,
        scopeChanges: Map<ScopeId, DataChangeDescription>
    ): void {
        const { groupProcessors } = this;
        const { columns } = processedData;

        // Verify all processors support reprocessing
        for (const processor of groupProcessors) {
            if (!processor.supportsReprocessing) {
                throw new Error(
                    'AG Charts - attempted to reprocess group processor that does not support reprocessing. ' +
                        'This is an internal error that should not occur.'
                );
            }
        }

        // Deduplicate change descriptions (multiple scopes can share same DataSet/changeDesc)
        const processedChangeDescs = new Set<DataChangeDescription>();
        for (const [, changeDesc] of scopeChanges) {
            if (processedChangeDescs.has(changeDesc)) continue;
            processedChangeDescs.add(changeDesc);
        }

        // Process each group processor
        for (const processor of groupProcessors) {
            const valueIndexes = this.valueGroupIdxLookup(processor);
            const adjustFn = processor.adjust()();

            // Process only modified groups from unique change descriptions
            for (const changeDesc of processedChangeDescs) {
                const { indexMap } = changeDesc;

                // Process insertions - these are new groups that need processing
                for (const op of indexMap.spliceOps) {
                    if (op.insertCount > 0) {
                        // Apply processor to newly inserted groups
                        for (let i = 0; i < op.insertCount; i++) {
                            const groupIndex = op.index + i;
                            const dataGroup = processedData.groups[groupIndex];
                            adjustFn(columns, valueIndexes, dataGroup, groupIndex);
                        }
                    }
                }
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
                const rawData = dataSources.get(onlyScope)?.data ?? [];
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

    private initDataDomainProcessor(domainMode: 'extend' | 'skip') {
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

            // Keys cannot be null/undefined - mark as invalid
            const isKeyWithNullValue = def.type === 'key' && value == null;

            if ((valueInDatum && def.validation?.(value, datum, idx) === false) || isKeyWithNullValue) {
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

            if (domainMode === 'extend') {
                dataDomain.get(def)?.extend(value);
            }
            reusableResult.value = value;
            return reusableResult;
        };

        return { dataDomain, processValue, initDataDomain, scopes, allScopesHaveSameDefs };
    }

    /**
     * Collects optimization metadata for debugging purposes.
     * Only called when debug mode is enabled.
     */
    private collectOptimizationMetadata(processedData: ProcessedData<D>, pathTaken: 'full-process' | 'reprocess') {
        // Preserve existing domainBanding metadata if it exists (set by collectDomainBandingMetadata)
        const existingDomainBanding = processedData.optimizations?.domainBanding;

        processedData.optimizations = {
            performance: {
                processingTime: processedData.time,
                pathTaken,
            },
            ...(existingDomainBanding && { domainBanding: existingDomainBanding }),
        };

        // Track reprocessing optimization
        const reprocessingSupported = this.isReprocessingSupported(processedData);
        const reprocessingApplied = pathTaken === 'reprocess';
        let reprocessingReason: string | undefined;

        if (!reprocessingSupported) {
            const reasons: string[] = [];
            if (processedData.type === 'grouped') {
                if (!processedData.groupsUnique) {
                    reasons.push('groupsUnique=false');
                }
                const uniqueDataSets = this.getUniqueDataSets(processedData);
                if (uniqueDataSets.size !== 1) {
                    reasons.push('multiple data sources');
                }
                const scope = first(processedData.scopes);
                const invalidKeys = processedData.invalidKeys?.get(scope);
                if (invalidKeys?.some((invalid) => invalid)) {
                    reasons.push('has invalid keys');
                }
            }
            if (this.aggregates.length > 0) {
                reasons.push('has aggregates');
            }
            if (this.reducers.length > 0) {
                reasons.push('has reducers');
            }
            if (this.processors.length > 0) {
                reasons.push('has processors');
            }
            if (this.propertyProcessors.length > 0) {
                reasons.push('has property processors');
            }
            reprocessingReason = reasons.length > 0 ? reasons.join(', ') : undefined;
        }

        processedData.optimizations.reprocessing = {
            applied: reprocessingApplied,
            reason: reprocessingReason,
        };

        // Track shared datum indices for grouped data
        if (processedData.type === 'grouped') {
            let sharedGroupCount = 0;
            const firstGroup = processedData.groups[0];
            if (firstGroup) {
                const sharedDatumIndices = firstGroup.datumIndices;
                for (const group of processedData.groups) {
                    if (group.datumIndices === sharedDatumIndices) {
                        sharedGroupCount++;
                    }
                }
            }
            processedData.optimizations.sharedDatumIndices = {
                applied: sharedGroupCount > 0,
                sharedGroupCount,
                totalGroupCount: processedData.groups.length,
            };
        }
    }

    /**
     * Collects domain banding optimization metadata.
     * Always called to make metadata available for testing and debugging.
     * @param preScanDomainStats Per-domain pre-scan band statistics collected before extending domains
     */
    private collectDomainBandingMetadata(
        processedData: ProcessedData<D>,
        keyDomains: Map<InternalDatumPropertyDefinition<K>, IDataDomain>,
        valueDomains: Map<InternalDatumPropertyDefinition<K>, IDataDomain>,
        bandedDomains: Map<InternalDatumPropertyDefinition<any>, BandedDomain>,
        preScanDomainStats: Map<IDataDomain, ReturnType<BandedDomain['getStats']>>
    ) {
        processedData.optimizations ??= {};

        const keyDefs: Array<{
            property: string;
            applied: boolean;
            reason?: string;
            stats?: { totalBands: number; dirtyBands: number; dataSize: number; scanRatio: number };
        }> = [];

        const valueDefs: Array<{
            property: string;
            applied: boolean;
            reason?: string;
            stats?: { totalBands: number; dirtyBands: number; dataSize: number; scanRatio: number };
        }> = [];

        // Collect stats for key definitions
        for (const keyDef of this.keys) {
            const domain = keyDomains.get(keyDef);
            const bandedDomain = bandedDomains.get(keyDef);
            const isBanded = domain instanceof BandedDomain;

            let reason: string | undefined;
            if (!isBanded) {
                if (keyDef.valueType === 'category') {
                    reason = 'discrete domain';
                } else if (this.opts.domainBandingConfig?.enableBanding === false) {
                    reason = 'banding disabled';
                } else {
                    reason = 'not configured';
                }
            }

            let stats: { totalBands: number; dirtyBands: number; dataSize: number; scanRatio: number } | undefined;
            if (isBanded && bandedDomain) {
                // Use pre-scan stats if available (collected before extending domains)
                const domainStats = preScanDomainStats.get(bandedDomain) ?? bandedDomain.getStats();
                const scanRatio = domainStats.bandCount > 0 ? domainStats.dirtyBandCount / domainStats.bandCount : 0;
                stats = {
                    totalBands: domainStats.bandCount,
                    dirtyBands: domainStats.dirtyBandCount,
                    dataSize: domainStats.dataSize,
                    scanRatio,
                };
            }

            keyDefs.push({
                property: String(keyDef.property),
                applied: isBanded,
                reason,
                stats,
            });
        }

        // Collect stats for value definitions
        for (const valueDef of this.values) {
            const domain = valueDomains.get(valueDef);
            const bandedDomain = bandedDomains.get(valueDef);
            const isBanded = domain instanceof BandedDomain;

            let reason: string | undefined;
            if (!isBanded) {
                if (valueDef.valueType === 'category') {
                    reason = 'discrete domain';
                } else if (this.opts.domainBandingConfig?.enableBanding === false) {
                    reason = 'banding disabled';
                } else {
                    reason = 'not configured';
                }
            }

            let stats: { totalBands: number; dirtyBands: number; dataSize: number; scanRatio: number } | undefined;
            if (isBanded && bandedDomain) {
                // Use pre-scan stats if available (collected before extending domains)
                const domainStats = preScanDomainStats.get(bandedDomain) ?? bandedDomain.getStats();
                const scanRatio = domainStats.bandCount > 0 ? domainStats.dirtyBandCount / domainStats.bandCount : 0;
                stats = {
                    totalBands: domainStats.bandCount,
                    dirtyBands: domainStats.dirtyBandCount,
                    dataSize: domainStats.dataSize,
                    scanRatio,
                };
            }

            valueDefs.push({
                property: String(valueDef.property),
                applied: isBanded,
                reason,
                stats,
            });
        }

        processedData.optimizations.domainBanding = {
            keyDefs,
            valueDefs,
        };
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
    logValues('Value Domains', processedData.domain.values);
    logValues('Aggregate Domains', processedData.domain.aggValues ?? []);

    // Log optimization metadata if present
    if (processedData.optimizations) {
        Logger.log('DataModel.processData() - Optimization Summary');
        const opt = processedData.optimizations;

        if (opt.performance) {
            Logger.log(`  Performance: ${opt.performance.processingTime.toFixed(2)}ms (${opt.performance.pathTaken})`);
        }

        if (opt.reprocessing) {
            const symbol = opt.reprocessing.applied ? '✓' : '✗';
            const reason = opt.reprocessing.reason ? ` (${opt.reprocessing.reason})` : '';
            Logger.log(`  Reprocessing: ${symbol}${reason}`);
        }

        if (opt.domainBanding) {
            const keyStats = opt.domainBanding.keyDefs.filter((d) => d.applied);
            const valueStats = opt.domainBanding.valueDefs.filter((d) => d.applied);
            const totalApplied = keyStats.length + valueStats.length;
            const totalDefs = opt.domainBanding.keyDefs.length + opt.domainBanding.valueDefs.length;

            if (totalApplied > 0) {
                Logger.log(`  Domain Banding: ✓ (${totalApplied}/${totalDefs} definitions)`);
                for (const def of [...keyStats, ...valueStats]) {
                    if (def.stats) {
                        const pct = (def.stats.scanRatio * 100).toFixed(1);
                        Logger.log(
                            `    ${def.property}: scanned ${def.stats.dirtyBands}/${def.stats.totalBands} bands (${pct}%)`
                        );
                    }
                }
            } else {
                const reasons = [
                    ...opt.domainBanding.keyDefs.filter((d) => !d.applied).map((d) => d.reason),
                    ...opt.domainBanding.valueDefs.filter((d) => !d.applied).map((d) => d.reason),
                ];
                const uniqueReasons = [...new Set(reasons)].join(', ');
                Logger.log(`  Domain Banding: ✗ (${uniqueReasons})`);
            }
        }

        if (opt.sharedDatumIndices) {
            const symbol = opt.sharedDatumIndices.applied ? '✓' : '✗';
            const ratio = `${opt.sharedDatumIndices.sharedGroupCount}/${opt.sharedDatumIndices.totalGroupCount}`;
            Logger.log(`  Shared DatumIndices: ${symbol} (${ratio} groups)`);
        }

        if (opt.batchMerging) {
            const pct = (opt.batchMerging.mergeRatio * 100).toFixed(0);
            const reduction = `${opt.batchMerging.originalBatchCount} → ${opt.batchMerging.mergedBatchCount}`;
            Logger.log(`  Batch Merging: ${reduction} (${pct}% reduction)`);
        }
    }
}
