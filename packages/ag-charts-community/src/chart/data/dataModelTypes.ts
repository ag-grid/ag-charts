import type { BandedReducer } from './data-model/reducers/bandedReducer';
import type { DataChangeDescription } from './dataChangeDescription';
import type { BandedDomain, BandedDomainConfig } from './dataDomain';
import type { DataSet } from './dataSet';
import type { RangeLookup } from './rangeLookup';
import type { SortOrder } from './sortOrder';

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

export const KEY_SORT_ORDERS = Symbol('key-sort-orders');
export const COLUMN_SORT_ORDERS = Symbol('column-sort-orders');
export const DOMAIN_RANGES = Symbol('domain-ranges');
export const DOMAIN_BANDS = Symbol('domain-bands');
export const REDUCER_BANDS = Symbol('reducer-bands');

export interface BandedReducerStats extends Record<string, number> {
    totalBands: number;
    dirtyBands: number;
    dataSize: number;
    scanRatio: number;
    cacheHits: number;
}

// Memory optimization: Shared frozen array for datumIndices in grouped data
// when groupsUnique=true. All groups point to same [0] array since each
// datum has relative offset 0 from its group start position.
export const SHARED_ZERO_INDICES: readonly number[] = Object.freeze([0]);

export type ScopeId = string;

export type ProcessedValue = { value: unknown; missing: boolean; valid: boolean };
export type SortOrderEntry = {
    sortOrder: SortOrder;
    isUnique?: boolean; // true if no duplicate adjacent values detected
    isDirty?: boolean;
};
export type ProcessedValueEntry = { value: any; valid: boolean };

export interface GroupDatumIteratorOutput {
    group: DataGroup;
    groupIndex: number;
    columnIndex: number;
    datumIndex: number;
}

export type InsertionCacheValue = {
    keys: Map<number, ProcessedValueEntry>;
    values: Map<number, ProcessedValueEntry>;
    hasInvalidKey: boolean;
    hasInvalidValue: boolean;
    hasMissingValue: boolean;
};

export type InsertionCache = Map<number, InsertionCacheValue>;

export type ColumnBatch = [ScopeId, number[], unknown[][], Set<ScopeId>, boolean[] | undefined, boolean[] | undefined];
export type MergedColumnBatch = [
    ScopeId[],
    number[],
    unknown[][],
    Set<ScopeId>,
    boolean[] | undefined,
    boolean[] | undefined,
];

export interface CommonMetadata<D> {
    input: { count: number };
    scopes: Set<ScopeId>;
    dataSources: Map<ScopeId, DataSet<unknown>>;
    invalidKeys: Map<ScopeId, boolean[]> | undefined;
    invalidKeyCount: Map<ScopeId, number> | undefined;
    invalidData: Map<ScopeId, boolean[]> | undefined;
    invalidDataCount: Map<ScopeId, number> | undefined;
    missingData: Map<ScopeId, boolean[]> | undefined;
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
        filteredValueExceedUnfiltered?: boolean;
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
    /** Monotonically increasing version counter, incremented on every processing cycle */
    version: number;
    optimizations?: OptimizationMetadata;
    [DOMAIN_RANGES]: Map<string, RangeLookup>;
    [KEY_SORT_ORDERS]: Map<number, SortOrderEntry>;
    [COLUMN_SORT_ORDERS]: Map<number, SortOrderEntry>;
    [DOMAIN_BANDS]: Map<InternalDatumPropertyDefinition<any>, BandedDomain>;
    [REDUCER_BANDS]?: Map<ReducerBandKey, BandedReducer>;
    changeDescription?: DataChangeDescription;
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
    def: PropertyDefinition<any>;
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

    /** Reducer banding optimization */
    reducerBanding?: {
        reducers: Array<{
            property: string;
            applied: boolean;
            reason?: string;
            stats?: BandedReducerStats;
        }>;
    };

    /** Overall performance metrics */
    performance?: {
        processingTime: number;
        pathTaken: 'full-process' | 'reprocess';
    };
}

export type DatumPropertyType = 'range' | 'category';

// AG-10337 Keep track of the number of missing values in each per-series data array.
export type MissMap = Map<string, number>;

export type GroupingFn<K> = (keys: unknown[]) => K[];
export type GroupByFn = (extractedData: UngroupedData<any>) => GroupingFn<any>;
export type DataModelOptions<K, Grouped extends boolean | undefined, IsScoped extends boolean = true> = {
    props: PropertyDefinition<K, IsScoped>[];
    groupByKeys?: Grouped;
    groupByData?: Grouped;
    groupByFn?: GroupByFn;
    domainBandingConfig?: BandedDomainConfig;
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

export type PropertyIdentifiers = {
    id?: string;
    /** Map<Scope, Set<Id>> */
    idsMap?: Map<string, Set<string>>;
    /** Optional group a property belongs to, for cross-scope combination. */
    groupId?: string;
};

export type PropertySelectors = {
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
    allowNullKey?: boolean; // When true, null is valid for this key (internal use only)
};

export type InternalDefinition<IsScoped extends boolean> = {
    index: number;
} & (IsScoped extends true ? Scoped : unknown);

export type InternalDatumPropertyDefinition<K> = DatumPropertyDefinition<K> &
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

export type GroupValueAdjustFn<D, K extends keyof D & string> = (
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

export type PropertyValueAdjustFn<D> = (processedData: ProcessedData<D>, valueIndex: number) => void;

export type PropertyValueProcessorDefinition<D> = PropertyIdentifiers & {
    type: 'property-value-processor';
    property: string;
    adjust: () => PropertyValueAdjustFn<D>;
};

export type ReducerOutputTypes = NonNullable<UngroupedData<any>['reduced']>;
export type ReducerOutputKeys = keyof ReducerOutputTypes;
export type ReducerBandKey = Extract<ReducerOutputKeys, string>;
export type ReducerOutputPropertyDefinition<P extends ReducerOutputKeys = ReducerOutputKeys> = PropertyIdentifiers & {
    type: 'reducer';
    property: P;
    initialValue?: ReducerOutputTypes[P];
    reducer: () => (acc: ReducerOutputTypes[P], keys: unknown[]) => ReducerOutputTypes[P];
    supportsBanding?: boolean;
    combineResults?: (bandResults: ReducerOutputTypes[P][]) => ReducerOutputTypes[P];
    needsOverlap?: boolean;
};

export type ProcessorOutputPropertyDefinition<P extends ReducerOutputKeys = ReducerOutputKeys> = PropertyIdentifiers & {
    type: 'processor';
    property: P;
    calculate: (data: ProcessedData<any>, previousValue: ReducerOutputTypes[P] | undefined) => ReducerOutputTypes[P];
    incrementalCalculate?: (
        data: ProcessedData<any>,
        previousValue: ReducerOutputTypes[P] | undefined
    ) => ReducerOutputTypes[P];
};
