import { Logger, first, isNegative, isObject, iterate } from 'ag-charts-core';

import { Debug } from '../../util/debug';
import type { ChartMode } from '../chartMode';
import { AggregationUpdater } from './aggregationUpdater';
import { ArrayUpdater } from './arrayUpdater';
import type { DataChangeDescriptor } from './dataChangeDescriptor';
import { ContinuousDomain, DiscreteDomain, type IDataDomain } from './dataDomain';
import type { DataRef } from './dataRef';
import { GroupUpdater } from './groupUpdater';
import { ProcessedDataMutator } from './processedDataMutator';
import { RangeLookup } from './rangeLookup';
import { type SortOrder, valuesSortOrder } from './sortOrder';
import { TransactionAnalyzer } from './transactionAnalyzer';

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

export type ProcessedData<D> = UngroupedData<D> | GroupedData<D>;

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

        /**
         * Whether this aggregation supports incremental updates.
         *
         * When `true` or `undefined`, the aggregation can be updated incrementally using
         * the `incrementalUpdater` function. When `false`, any data changes will cause
         * the DataModel to fall back to full reprocessing.
         *
         * @example Simple aggregations that support incremental updates
         * ```typescript
         * // Sum aggregation with incremental support
         * {
         *     type: 'aggregate',
         *     aggregateFunction: (values) => values.reduce((a, b) => a + b, 0),
         *     supportsIncremental: true,
         *     incrementalUpdater: (current, removed, added) => {
         *         const removedSum = removed.reduce((a, b) => a + b, 0);
         *         const addedSum = added.reduce((a, b) => a + b, 0);
         *         return current - removedSum + addedSum;
         *     }
         * }
         *
         * // Count aggregation with incremental support
         * {
         *     type: 'aggregate',
         *     aggregateFunction: (values) => values.length,
         *     supportsIncremental: true,
         *     incrementalUpdater: (current, removed, added) => {
         *         return current - removed.length + added.length;
         *     }
         * }
         * ```
         *
         * @example Complex aggregations that don't support incremental updates
         * ```typescript
         * // Median calculation - requires full recalculation
         * {
         *     type: 'aggregate',
         *     aggregateFunction: (values) => calculateMedian(values),
         *     supportsIncremental: false // Forces full reprocessing
         * }
         *
         * // Percentile calculation - complex statistical operation
         * {
         *     type: 'aggregate',
         *     aggregateFunction: (values) => calculatePercentile(values, 95),
         *     supportsIncremental: false
         * }
         * ```
         *
         * @default undefined (treated as true if incrementalUpdater is provided)
         */
        supportsIncremental?: boolean;

        /**
         * Function to perform incremental updates when supported.
         *
         * This function allows aggregations to be updated efficiently without
         * recalculating from scratch. It receives the current aggregated value
         * and arrays of removed and added values.
         *
         * @param current - The current aggregated value
         * @param removed - Array of values that were removed from the dataset
         * @param added - Array of values that were added to the dataset
         * @returns The new aggregated value after applying the changes
         *
         * @example Min/Max aggregation with incremental updates
         * ```typescript
         * // Min aggregation that handles incremental updates
         * {
         *     type: 'aggregate',
         *     aggregateFunction: (values) => Math.min(...values),
         *     supportsIncremental: true,
         *     incrementalUpdater: (current, removed, added) => {
         *         // If we removed the current minimum, need full recalculation
         *         if (removed.includes(current)) {
         *             // Could return special sentinel to trigger full recalc
         *             return null; // Triggers fallback
         *         }
         *
         *         // Otherwise, just check if any added values are smaller
         *         const newMin = Math.min(...added);
         *         return Math.min(current, newMin);
         *     }
         * }
         * ```
         *
         * @example Average aggregation requiring sum and count tracking
         * ```typescript
         * // Average that tracks both sum and count
         * {
         *     type: 'aggregate',
         *     aggregateFunction: (values) => ({
         *         sum: values.reduce((a, b) => a + b, 0),
         *         count: values.length,
         *         average: values.reduce((a, b) => a + b, 0) / values.length
         *     }),
         *     supportsIncremental: true,
         *     incrementalUpdater: (current, removed, added) => {
         *         const removedSum = removed.reduce((a, b) => a + b, 0);
         *         const addedSum = added.reduce((a, b) => a + b, 0);
         *         const newSum = current.sum - removedSum + addedSum;
         *         const newCount = current.count - removed.length + added.length;
         *         return {
         *             sum: newSum,
         *             count: newCount,
         *             average: newCount > 0 ? newSum / newCount : 0
         *         };
         *     }
         * }
         * ```
         *
         * @remarks
         * **Performance Considerations:**
         * - Should be significantly faster than full recalculation
         * - Consider returning null/undefined to trigger fallback for complex cases
         * - Avoid expensive operations that negate incremental benefits
         *
         * **Error Handling:**
         * - Returning null/undefined triggers fallback to full recalculation
         * - Throwing errors will propagate and potentially crash the update
         * - Design defensively for edge cases (empty arrays, invalid values)
         */
        incrementalUpdater?: (current: any, removed: any[], added: any[]) => any;
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

        /**
         * Whether this processor supports incremental updates.
         *
         * When `false`, any data changes will cause the DataModel to fall back to full reprocessing.
         * When `true` or `undefined`, the processor is assumed to work correctly with incremental updates.
         *
         * @remarks
         * Group value processors that depend on complete group membership or specific ordering
         * should set this to `false`. Processors that can work with partial group updates
         * can leave this as `true` or `undefined`.
         *
         * @example Processor that doesn't support incremental updates
         * ```typescript
         * {
         *     type: 'group-value-processor',
         *     adjust: () => () => (columns, indexes, dataGroup) => {
         *         // Complex processing that requires complete group data
         *         processCompleteGroup(dataGroup);
         *     },
         *     supportsIncremental: false
         * }
         * ```
         *
         * @default undefined (treated as true)
         */
        supportsIncremental?: boolean;
    };

type PropertyValueAdjustFn<D> = (processedData: ProcessedData<D>, valueIndex: number) => void;

export type PropertyValueProcessorDefinition<D> = PropertyIdentifiers & {
    type: 'property-value-processor';
    property: string;
    adjust: () => PropertyValueAdjustFn<D>;

    /**
     * Whether this processor supports incremental updates.
     *
     * When `false`, any data changes will cause the DataModel to fall back to full reprocessing.
     * When `true` or `undefined`, the processor is assumed to work correctly with incremental updates.
     *
     * @remarks
     * Property value processors that perform complex calculations depending on the entire dataset
     * should set this to `false`. Simple processors that operate on individual values can
     * typically support incremental updates.
     *
     * @example Processor that requires full dataset
     * ```typescript
     * {
     *     type: 'property-value-processor',
     *     property: 'normalizedValue',
     *     adjust: () => (processedData, valueIndex) => {
     *         // Normalization requires knowledge of min/max across entire dataset
     *         const column = processedData.columns[valueIndex];
     *         const min = Math.min(...column);
     *         const max = Math.max(...column);
     *         // ... normalize all values
     *     },
     *     supportsIncremental: false
     * }
     * ```
     *
     * @default undefined (treated as true)
     */
    supportsIncremental?: boolean;
};

type ReducerOutputTypes = NonNullable<UngroupedData<any>['reduced']>;
type ReducerOutputKeys = keyof ReducerOutputTypes;
export type ReducerOutputPropertyDefinition<P extends ReducerOutputKeys = ReducerOutputKeys> = PropertyIdentifiers & {
    type: 'reducer';
    property: P;
    initialValue?: ReducerOutputTypes[P];
    reducer: () => (acc: ReducerOutputTypes[P], keys: unknown[]) => ReducerOutputTypes[P];

    /**
     * Whether this reducer supports incremental updates.
     *
     * When `false`, any data changes will cause the DataModel to fall back to full reprocessing.
     * When `true` or `undefined`, the reducer is assumed to work correctly with incremental updates.
     *
     * @remarks
     * Reducers that depend on processing order or need complete dataset context should set this to `false`.
     * Simple accumulative reducers can typically support incremental updates.
     *
     * @example Reducer that doesn't support incremental updates
     * ```typescript
     * {
     *     type: 'reducer',
     *     property: 'orderedStatistic',
     *     initialValue: { values: [], median: 0 },
     *     reducer: () => (acc, keys) => {
     *         // Order-dependent calculation that needs complete dataset
     *         acc.values.push(...keys);
     *         acc.values.sort();
     *         acc.median = calculateMedian(acc.values);
     *         return acc;
     *     },
     *     supportsIncremental: false
     * }
     * ```
     *
     * @default undefined (treated as true)
     */
    supportsIncremental?: boolean;
};

export type ProcessorOutputPropertyDefinition<P extends ReducerOutputKeys = ReducerOutputKeys> = PropertyIdentifiers & {
    type: 'processor';
    property: P;
    calculate: (data: ProcessedData<any>, previousValue: ReducerOutputTypes[P] | undefined) => ReducerOutputTypes[P];

    /**
     * Whether this processor supports incremental updates.
     *
     * When `false`, any data changes will cause the DataModel to fall back to full reprocessing.
     * When `true` or `undefined`, the processor is assumed to work correctly with incremental updates.
     *
     * @remarks
     * Processors that perform complex calculations on the entire ProcessedData structure should
     * set this to `false`. Processors that can work with partially updated data can support
     * incremental updates.
     *
     * @example Processor that requires complete data
     * ```typescript
     * {
     *     type: 'processor',
     *     property: 'globalStatistics',
     *     calculate: (data) => {
     *         // Complex calculation requiring complete, consistent data
     *         return analyzeCompleteDataset(data);
     *     },
     *     supportsIncremental: false
     * }
     * ```
     *
     * @example Processor that supports incremental updates
     * ```typescript
     * {
     *     type: 'processor',
     *     property: 'dataCount',
     *     calculate: (data) => {
     *         // Simple calculation that works with mutated data
     *         return data.input.count;
     *     },
     *     supportsIncremental: true
     * }
     * ```
     *
     * @default undefined (treated as true)
     */
    supportsIncremental?: boolean;
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
    private readonly extractorCache = new Map<InternalDatumPropertyDefinition<K>, ProcessorFn>();

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

    /**
     * Processes a single datum value according to the given property definition.
     * This method is used for both initial data processing and incremental updates.
     *
     * This is a core method that handles value extraction, validation, transformation,
     * and domain extension for individual data points. It's designed to be reusable
     * across different processing contexts.
     *
     * @example Basic value processing
     * ```typescript
     * const def = {
     *     property: 'price',
     *     valueType: 'range',
     *     scopes: ['series1'],
     *     missing: new Map(),
     *     // ... other definition properties
     * };
     *
     * const datum = { price: 42.5, name: 'Product A' };
     * const result = dataModel.processValue(def, datum, 0, 'series1');
     *
     * console.log(result.value);   // 42.5
     * console.log(result.valid);   // true
     * console.log(result.missing); // false
     * ```
     *
     * @example With custom processor
     * ```typescript
     * const def = {
     *     property: 'timestamp',
     *     valueType: 'range',
     *     processor: () => (value) => new Date(value),
     *     scopes: ['timeSeries'],
     *     missing: new Map(),
     * };
     *
     * const datum = { timestamp: '2023-01-01T00:00:00Z' };
     * const result = dataModel.processValue(def, datum, 0, 'timeSeries');
     *
     * console.log(result.value instanceof Date); // true
     * ```
     *
     * @param def The property definition to use for processing
     * @param datum The data item to extract the value from
     * @param idx The index of the datum in the data array
     * @param valueScopes Optional scope(s) for missing value tracking
     * @param accessors Optional pre-built accessors for performance optimization
     * @param dataDomain Optional domain map for domain extension during processing
     * @param initDataDomain Optional function to initialize data domain if missing
     * @returns ProcessedValue containing the processed value and metadata
     *
     * @remarks
     * **Processing Pipeline:**
     * 1. **Value Extraction**: Uses property accessors or direct property access
     * 2. **Force Value**: Applies forceValue if specified, maintaining sign
     * 3. **Validation**: Runs custom validation function if provided
     * 4. **Processing**: Applies processor function for value transformation
     * 5. **Domain Extension**: Updates data domain with the processed value
     * 6. **Missing Tracking**: Tracks missing values per scope for warnings
     *
     * **Performance Optimizations:**
     * - Caches processor functions to avoid repeated creation
     * - Reuses accessor functions when provided
     * - Skips validation for invalid values to reduce computation
     *
     * **Error Handling:**
     * - Swallows accessor errors and treats as missing values
     * - Logs warnings for invalid values in standalone mode
     * - Returns invalidValue for failed validation
     *
     * **Use Cases:**
     * - Initial data processing during DataModel.processData()
     * - Incremental updates during DataModel.applyTransactions()
     * - Custom value processing in extensions
     */
    public processValue(
        def: InternalDatumPropertyDefinition<K>,
        datum: any,
        idx: number,
        valueScopes?: string | string[],
        accessors?: Map<string, (d: any) => any>,
        dataDomain?: Map<object, IDataDomain>,
        initDataDomain?: () => void
    ): ProcessedValue {
        const propertyAccessors = accessors ?? this.buildAccessors([def]);

        let valueInDatum: boolean;
        let value;
        if (propertyAccessors.has(def.property)) {
            try {
                value = propertyAccessors.get(def.property)!(datum);
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

        const result: ProcessedValue = {
            value: undefined,
            missing: !valueInDatum,
            valid: false,
        };

        const missingValueDef = 'missingValue' in def;
        if (!valueInDatum && !missingValueDef && valueScopes) {
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

        if (dataDomain && !dataDomain.has(def) && initDataDomain) {
            initDataDomain();
        }

        if (valueInDatum && def.validation?.(value, datum, idx) === false) {
            result.valid = false;

            if ('invalidValue' in def) {
                value = def.invalidValue;
            } else {
                if (this.mode !== 'integrated') {
                    Logger.warnOnce(
                        `invalid value of type [${typeof value}] for [${def.scopes} / ${def.id}] ignored:`,
                        `[${value}]`
                    );
                }
                result.value = undefined;
                return result;
            }
        } else {
            result.valid = true;
        }

        if (def.processor) {
            let processor = this.extractorCache.get(def);
            if (processor == null) {
                processor = def.processor();
                this.extractorCache.set(def, processor);
            }
            value = processor(value, idx);
        }

        if (dataDomain) {
            dataDomain.get(def)?.extend(value);
        }

        result.value = value;
        return result;
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
        this.extractorCache.clear();

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

    /**
     * Applies pending transactions from DataRef to existing ProcessedData using incremental updates.
     * This method provides high-performance data updates by mutating ProcessedData in-place rather
     * than performing full reprocessing.
     *
     * @example Basic usage with chart transactions
     * ```typescript
     * // Apply a transaction to add new data points
     * const transaction = {
     *     append: [{ x: 10, y: 20 }, { x: 11, y: 25 }],
     *     remove: [existingDataPoint],
     *     prepend: []
     * };
     *
     * // Add the transaction to dataRef
     * dataRef.addTransaction(transaction);
     *
     * // Apply incrementally (before committing transactions)
     * const result = dataModel.applyTransactions(dataRef, processedData, sources);
     * if (result) {
     *     // Success - ProcessedData was updated in-place
     *     dataRef.commitPendingTransactions();
     *     chart.update(ChartUpdateType.UPDATE_DATA, { skipAnimations: true });
     * } else {
     *     // Fallback to full reprocessing
     *     dataRef.commitPendingTransactions();
     *     const newProcessedData = dataModel.processData(sources);
     *     chart.update(ChartUpdateType.UPDATE_DATA);
     * }
     * ```
     *
     * @param dataRef - The DataRef containing pending transactions to apply
     * @param processedData - The existing ProcessedData to mutate in-place
     * @param sources - Map of all current data sources (used for validation)
     * @returns The same ProcessedData instance (mutated) on success, undefined if fallback needed
     *
     * @remarks
     * **Constraints:**
     * - Only supports single data source scenarios (returns undefined for multi-source)
     * - Must be called BEFORE DataRef.commitPendingTransactions() to work with original indices
     * - Requires all processors to support incremental updates (see {@link supportsIncrementalUpdate})
     * - Grouped datasets trigger a regrouping pass after column mutations
     *
     * **Performance Characteristics:**
     * - Mutates the ProcessedData structure in-place for maximum performance
     * - O(k) complexity where k is the number of changes, not O(n) data size
     * - Avoids memory allocations by reusing existing arrays and objects
     * - Typically 10x+ faster than full reprocessing for small changes
     *
     * **Animation Handling:**
     * - Sets animation validation flags to false for high-frequency updates
     * - Caller should pass `skipAnimations: true` to chart.update() for optimal performance
     * - The updated data does not maintain "before" snapshots needed for animations
     *
     * **Error Handling:**
     * - Falls back to full reprocessing by returning undefined when incremental isn't supported
     * - Throws errors only for implementation bugs (invalid state, corrupted data)
     * - Does not perform rollback on errors - chart state requires page reload if corruption occurs
     */
    applyTransactions<T>(
        dataRef: DataRef<T>,
        processedData: ProcessedData<D>,
        sources: Map<string, unknown[]>,
        precomputedDescriptor?: DataChangeDescriptor
    ): ProcessedData<D> | undefined {
        // Use TransactionAnalyzer to convert pending transactions to structured change descriptor
        const changeDescriptor = precomputedDescriptor ?? TransactionAnalyzer.analyze(dataRef, sources);
        if (changeDescriptor === undefined) {
            // Multi-source scenario detected - fall back to full reprocessing
            return undefined;
        }

        // Check if incremental updates are supported for this configuration
        if (!this.supportsIncrementalUpdate()) {
            return undefined;
        }

        const wasGrouped = processedData.type === 'grouped';
        const originalLength = processedData.columns[0]?.length ?? 0;

        const mutator = new ProcessedDataMutator({
            processValue: this.processValue.bind(this),
        });
        mutator.mutate(processedData, changeDescriptor);

        this.syncDataRef(dataRef, changeDescriptor);

        this.updateDataSources(processedData, sources);

        // Perform selective re-extraction for columns affected by non-incremental group processors
        // Must happen AFTER syncDataRef and updateDataSources so we extract from the updated data
        const columnsToReextract = this.getColumnsRequiringReextraction();
        if (columnsToReextract && columnsToReextract.length > 0) {
            this.applySelectiveReextraction(processedData, processedData.dataSources, columnsToReextract);
        }

        if (wasGrouped && processedData.type === 'grouped') {
            const groupedUpdateSucceeded = this.updateGroupedState(
                processedData as GroupedData<any>,
                changeDescriptor,
                originalLength
            );

            if (!groupedUpdateSucceeded) {
                this.rebuildGroupedState(processedData as GroupedData<any>);
            }
        }

        this.runPostProcessing(processedData);

        // Note: ProcessedDataMutator already sets animation validation flags to false
        // in its updateProcessedDataMetadata method, so we don't need to do it here

        return processedData;
    }

    private syncDataRef(dataRef: DataRef<any>, changeDescriptor: DataChangeDescriptor): void {
        ArrayUpdater.applyChanges(dataRef.data, changeDescriptor, (datum) => datum);
        dataRef.pendingTransactions = [];
    }

    private updateDataSources(processedData: ProcessedData<any>, sources: Map<string, unknown[]>): void {
        if (!sources.size) {
            return;
        }

        for (const [scope, data] of sources) {
            if (!Array.isArray(data)) {
                continue;
            }

            processedData.dataSources.set(scope, data);
        }
    }

    private rebuildGroupedState(processedData: GroupedData<any>): void {
        const ungroupedView = this.toUngroupedView(processedData);
        const groupingFn = this.opts.groupByFn ? this.opts.groupByFn(ungroupedView) : undefined;
        const regrouped = this.groupData(ungroupedView, groupingFn);

        processedData.groups = regrouped.groups;
        processedData.domain.groups = regrouped.domain.groups;
        processedData.partialValidDataCount = regrouped.partialValidDataCount;
        processedData.scopes = regrouped.scopes;
    }

    private updateGroupedState(
        processedData: GroupedData<any>,
        changes: DataChangeDescriptor,
        originalLength: number
    ): boolean {
        if (
            changes.metadata.totalRemoved === 0 &&
            changes.metadata.totalInserted === 0 &&
            changes.metadata.totalUpdated === 0
        ) {
            return true;
        }

        let scopeId: string;
        try {
            scopeId = this.getSingleScopeId(processedData.scopes);
        } catch {
            Logger.warnOnce('Incremental group updates require single-scope data. Falling back to full regroup.');
            return false;
        }

        const groupingFn = this.opts.groupByFn ? this.opts.groupByFn(this.toUngroupedView(processedData)) : undefined;
        const keyDefs = processedData.defs.keys as InternalDatumPropertyDefinition<any>[] | undefined;

        if (!keyDefs || keyDefs.length === 0) {
            Logger.warnOnce(
                'Incremental group updates require at least one key definition. Falling back to full regroup.'
            );
            return false;
        }

        const keyExtractor = this.createGroupKeyExtractor(processedData, groupingFn);
        const columnCount = processedData.columns.length;
        const columnScopes = processedData.columnScopes;
        const scopes = processedData.scopes;

        try {
            processedData.groups ??= [];
            GroupUpdater.updateGroups(processedData.groups, changes, {
                keyExtractor,
                columnCount,
                columnScopes,
                scopeId,
                scopes,
                originalLength,
                groupingFn,
            });

            if (this.aggregates.length > 0) {
                processedData.domain.aggValues ??= this.aggregates.map((): [number, number] => [Infinity, -Infinity]);

                AggregationUpdater.updateAggregations(
                    processedData.groups,
                    changes,
                    this.aggregates,
                    processedData.columns,
                    (def) => this.valueGroupIdxLookup(def),
                    keyExtractor,
                    processedData.domain.aggValues
                );
            }

            processedData.domain.groups = processedData.groups.map((group) => group.keys);
            return true;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            Logger.warnOnce(`Incremental group update failed: ${message}. Falling back to full regroup.`);
            return false;
        }
    }

    private getSingleScopeId(scopes: Set<string>): string {
        const iterator = scopes.values();
        const firstScope = iterator.next();
        const secondScope = iterator.next();

        if (firstScope.done || !secondScope.done) {
            throw new Error('Expected single scope for incremental updates');
        }

        return firstScope.value;
    }

    private createGroupKeyExtractor(
        processedData: GroupedData<any>,
        groupingFn?: GroupingFn<any>
    ): (datum: any, index: number) => any[] {
        const keyDefs = processedData.defs.keys as InternalDatumPropertyDefinition<any>[];
        const accessors = this.buildAccessors(keyDefs);

        return (datum: any, index: number) => {
            const keys = keyDefs.map((def) => {
                const result = this.processValue(def, datum, index, undefined, accessors);
                return result.value;
            });

            return groupingFn ? groupingFn(keys) : keys;
        };
    }

    private toUngroupedView(processedData: GroupedData<any>): UngroupedData<any> {
        const { domain, groups: _groups, ...rest } = processedData;
        return {
            ...(rest as unknown as UngroupedData<any>),
            type: 'ungrouped',
            domain: {
                ...domain,
                groups: undefined,
            },
        };
    }

    private runPostProcessing(processedData: ProcessedData<any>): void {
        const preservedDiff = processedData.reduced?.diff;
        const preservedAnimation = processedData.reduced?.animationValidation;

        if (processedData.type === 'grouped') {
            if (this.groupProcessors.length > 0) {
                this.postProcessGroups(processedData);
            }
            if (this.aggregates.length > 0) {
                this.aggregateGroupedData(processedData);
            }
        } else if (this.aggregates.length > 0) {
            this.aggregateUngroupedData(processedData);
        }

        if (this.propertyProcessors.length > 0) {
            this.postProcessProperties(processedData);
        }

        if (this.reducers.length > 0) {
            this.reduceData(processedData);
        }

        if (this.processors.length > 0) {
            this.postProcessData(processedData);
        }

        if (processedData.reduced) {
            processedData.reduced.diff = preservedDiff;
            processedData.reduced.animationValidation = preservedAnimation;
        }
    }

    /**
     * Determines if the current DataModel configuration supports incremental updates.
     *
     * This method checks whether all components of the data processing pipeline support
     * incremental updates. If any component lacks this capability, the entire pipeline
     * must fall back to full reprocessing.
     *
     * @example Check before applying transactions
     * ```typescript
     * if (dataModel.supportsIncrementalUpdate()) {
     *     // Safe to use applyTransactions()
     *     const result = dataModel.applyTransactions(dataRef, processedData, sources);
     *     if (result) {
     *         console.log('Applied incremental update successfully');
     *     }
     * } else {
     *     console.log('Falling back to full reprocessing');
     *     // Use processData() instead
     *     const newProcessedData = dataModel.processData(sources);
     * }
     * ```
     *
     * @returns true if all processors support incremental updates, false otherwise
     *
     * @remarks
     * **Components Checked:**
     * - Aggregation functions: Must have `supportsIncremental !== false`
     * - Property processors: Must have `supportsIncremental !== false`
     * - Reducers: Must have `supportsIncremental !== false`
     * - Group processors: Must have `supportsIncremental !== false`
     * - Processors: Must have `supportsIncremental !== false`
     * - Grouping configuration: Requires supporting group processors and reducers
     *
     * **Performance Impact:**
     * - This check is performed once during transaction application
     * - Results in warning messages when incremental updates are disabled
     * - Helps developers understand why fallback occurs
     *
     * **Warning Messages:**
     * When incremental updates are disabled, warning messages are logged to help
     * developers identify which components need incremental support:
     * - "Incremental updates disabled due to aggregations: [list]"
     * - "Incremental updates disabled due to property processors: [list]"
     * - Similar messages for reducers, group processors, and processors
     */
    public supportsIncrementalUpdate(): boolean {
        // Check aggregates for capability flags
        const aggregatesOk = this.aggregates.every((a) => a.supportsIncremental !== false);
        if (!aggregatesOk) {
            const unsupported = this.aggregates
                .filter((a) => a.supportsIncremental === false)
                .map((a) => a.id ?? 'unknown');
            Logger.warnOnce(`Incremental updates disabled due to aggregations: ${unsupported.join(', ')}`);
            return false;
        }

        // Check property processors for capability flags
        const propertyProcessorsOk = this.propertyProcessors.every((p) => p.supportsIncremental !== false);
        if (!propertyProcessorsOk) {
            const unsupported = this.propertyProcessors
                .filter((p) => p.supportsIncremental === false)
                .map((p) => p.id ?? 'unknown');
            Logger.warnOnce(`Incremental updates disabled due to property processors: ${unsupported.join(', ')}`);
            return false;
        }

        // Check reducers for capability flags
        const reducersOk = this.reducers.every((r) => r.supportsIncremental !== false);
        if (!reducersOk) {
            const unsupported = this.reducers
                .filter((r) => r.supportsIncremental === false)
                .map((r) => r.id ?? 'unknown');
            Logger.warnOnce(`Incremental updates disabled due to reducers: ${unsupported.join(', ')}`);
            return false;
        }

        // Check group processors for capability flags - selective re-extraction handles these
        const groupProcessorsOk = this.groupProcessors.every((g) => g.supportsIncremental !== false);
        if (!groupProcessorsOk) {
            // Group processors with supportsIncremental: false can be handled via selective
            // re-extraction, so we don't return false here. The getColumnsRequiringReextraction()
            // method will identify which columns need to be re-extracted.
            const unsupported = this.groupProcessors
                .filter((g) => g.supportsIncremental === false)
                .map((g) => g.id ?? 'unknown');
            Logger.warnOnce(
                `Using selective re-extraction for columns affected by group processors: ${unsupported.join(', ')}`
            );
        }

        // Check processors for capability flags
        const processorsOk = this.processors.every((p) => p.supportsIncremental !== false);
        if (!processorsOk) {
            const unsupported = this.processors
                .filter((p) => p.supportsIncremental === false)
                .map((p) => p.id ?? 'unknown');
            Logger.warnOnce(`Incremental updates disabled due to processors: ${unsupported.join(', ')}`);
            return false;
        }

        return true;
    }

    /**
     * Identifies columns that need selective re-extraction due to non-incremental group processors.
     * Returns array of column indices that should be re-extracted, or undefined if no re-extraction needed.
     */
    private getColumnsRequiringReextraction(): number[] | undefined {
        const nonIncrementalProcessors = this.groupProcessors.filter((g) => g.supportsIncremental === false);

        if (nonIncrementalProcessors.length === 0) {
            return undefined; // All processors support incremental
        }

        const affectedColumnIndices = new Set<number>();
        for (const processor of nonIncrementalProcessors) {
            const columnIndices = this.valueGroupIdxLookup(processor);
            for (const idx of columnIndices) {
                affectedColumnIndices.add(idx);
            }
        }

        return Array.from(affectedColumnIndices).sort((a, b) => a - b);
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
            const rawColumnSource = columnScope != null ? sources.get(columnScope) : undefined;
            const columnSource = Array.isArray(rawColumnSource) ? rawColumnSource : [];
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

    /**
     * Selectively re-extracts specific columns from source data.
     * Similar to extractValues but only processes columns at the specified indices.
     * Used for hybrid incremental updates where most columns are updated incrementally
     * but certain columns (affected by non-incremental group processors) need full re-extraction.
     */
    private selectiveExtractValues(
        invalidData: Map<ScopeId, boolean[]>,
        valueDefs: InternalDatumPropertyDefinition<K>[],
        columnIndicesToReextract: number[],
        sources: Map<string, unknown[]>,
        scopeInvalidKeys: Map<ScopeId, boolean[]>,
        processValue: (
            def: InternalDatumPropertyDefinition<K>,
            datum: any,
            idx: number,
            scopes: string | string[]
        ) => ProcessedValue
    ): Map<number, unknown[]> {
        const reextractedColumns = new Map<number, unknown[]>();

        for (const columnIndex of columnIndicesToReextract) {
            const def = valueDefs[columnIndex];
            if (!def) continue;

            const { invalidValue } = def;

            const columnScope = first(def.scopes);
            const rawColumnSource = columnScope != null ? sources.get(columnScope) : undefined;
            const columnSource = Array.isArray(rawColumnSource) ? rawColumnSource : [];
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
                    value = invalidValue;
                }

                column[datumIndex] = value;
            }

            reextractedColumns.set(columnIndex, column);
        }

        return reextractedColumns;
    }

    /**
     * Applies selective re-extraction by replacing specified columns in processedData.
     * This is used during incremental updates when certain columns are affected by
     * non-incremental group processors (like accumulation) that need fresh raw values.
     */
    private applySelectiveReextraction(
        processedData: ProcessedData<D>,
        sources: Map<string, unknown[]>,
        columnIndicesToReextract: number[]
    ): void {
        // Re-extract the specified columns with fresh raw values
        const reextractedColumns = this.selectiveExtractValues(
            processedData.invalidData ?? new Map(),
            this.values,
            columnIndicesToReextract,
            sources,
            processedData.invalidKeys ?? new Map(),
            this.processValue.bind(this)
        );

        // Replace values in existing column arrays (in-place) rather than replacing the arrays themselves
        // This preserves array object identity which may be important for subsequent operations
        for (const [columnIndex, newColumnValues] of reextractedColumns) {
            const existingColumn = processedData.columns[columnIndex];
            if (!existingColumn) continue;

            // Clear and repopulate the existing array
            existingColumn.length = 0;
            existingColumn.push(...newColumnValues);
        }
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

        // Use the public processValue method with shared contexts
        const processValue = (
            def: InternalDatumPropertyDefinition<K>,
            datum: Record<string, any>,
            idx: number,
            valueScopes: string | string[]
        ): ProcessedValue => {
            return this.processValue(def, datum, idx, valueScopes, accessors, dataDomain, initDataDomain);
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
