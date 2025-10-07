import { Logger, first, isNegative, isObject, iterate } from 'ag-charts-core';

import { Debug } from '../../util/debug';
import type { ChartMode } from '../chartMode';
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
const DOMAIN_BANDS = Symbol('domain-bands');

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
    columnValueTypes?: boolean[]; // true if column needs valueOf() (contains Dates/objects), false for primitives
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

    resolveColumnNeedsValueOf(
        scope: ScopeProvider,
        searchId: string,
        processedData: UngroupedData<any> | GroupedData<any>
    ): boolean {
        const index = this.resolveProcessedDataIndexById(scope, searchId);
        return processedData.columnValueTypes?.[index] ?? true;
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
        const output: GroupDatumIteratorOutput = {
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
        // Use columnValueTypes metadata to determine if valueOf() is needed
        const needsValueOf = processedData.columnValueTypes?.[columnIndex] ?? true;
        return this.getSortOrder(
            processedData.columns[columnIndex],
            columnIndex,
            processedData[COLUMN_SORT_ORDERS],
            needsValueOf
        );
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

        if (this.debug.check()) {
            logProcessedData(processedData);
        }

        this.processScopeCache();

        return processedData as Grouped extends true ? GroupedData<D> : UngroupedData<D>;
    }

    public isReprocessingSupported(processedData: ProcessedData<D>): boolean {
        if (processedData.type !== 'ungrouped') return false;
        if (this.aggregates.length > 0) return false;
        if (this.reducers.length > 0) return false;
        if (this.processors.length > 0) return false;
        return this.propertyProcessors.length <= 0;
    }

    public reprocessData(processedData: ProcessedData<D>): ProcessedData<D> {
        if (!this.isReprocessingSupported(processedData)) {
            throw new Error('reprocessing data is not supported');
        }

        const start = performance.now();

        // Collect and validate changes
        const scopeChanges = this.collectScopeChanges(processedData);
        if (scopeChanges.size === 0) {
            return processedData;
        }

        // Commit all pending transactions (mutates data arrays)
        this.commitPendingTransactions(processedData);

        // Initialize processValue for processing new insertions
        const { processValue } = this.initDataDomainProcessor();

        // Pre-process all insertions
        const insertionCaches = this.processAllInsertions(processedData, scopeChanges, processValue);

        // Track band updates for optimization
        this.updateBandsForChanges(processedData, scopeChanges);

        // Transform all arrays using cached insertion results
        this.transformKeysArrays(processedData, scopeChanges, insertionCaches);
        this.transformColumnsArrays(processedData, scopeChanges, insertionCaches);
        this.transformInvalidityArrays(processedData, scopeChanges, insertionCaches);

        // Recompute domains from transformed arrays
        this.recomputeDomains(processedData);

        // Generate diff metadata for animations/incremental rendering
        if (processedData.reduced?.diff != null && scopeChanges.size > 0) {
            this.generateDiffMetadata(processedData, scopeChanges);
        }

        // Update metadata
        this.updateProcessedDataMetadata(processedData);

        const end = performance.now();
        processedData.time = end - start;

        return processedData;
    }

    /**
     * Updates banded domains based on pending changes.
     * This optimizes domain recalculation by only marking affected bands as dirty.
     */
    private updateBandsForChanges(
        processedData: ProcessedData<D>,
        scopeChanges: Map<ScopeId, DataChangeDescription>
    ): void {
        const bandedDomains = processedData[DOMAIN_BANDS];
        if (bandedDomains.size === 0) return;

        for (const [, changeDesc] of scopeChanges) {
            const { indexMap } = changeDesc;
            const { spliceOps, isAppendOnly, isPrependOnly } = indexMap;

            // Process each splice operation
            for (const op of spliceOps) {
                if (op.insertCount > 0) {
                    // Handle insertions - update band indices
                    for (const domain of bandedDomains.values()) {
                        if (domain instanceof BandedDomain) {
                            domain.handleInsertion(op.index, op.insertCount);
                        }
                    }
                }

                if (op.deleteCount > 0) {
                    // Handle removals - check for boundary values
                    // Note: For now we don't have the removed values here,
                    // so we'll mark affected bands as dirty
                    for (const domain of bandedDomains.values()) {
                        if (domain instanceof BandedDomain) {
                            // Simple approach: mark affected bands as dirty
                            domain.handleRemoval(op.index, op.deleteCount);
                        }
                    }
                }
            }

            // Optimize for common patterns
            if (isAppendOnly) {
                // For append-only, we only need to extend the last band
                for (const domain of bandedDomains.values()) {
                    if (domain instanceof BandedDomain) {
                        const stats = domain.getStats();
                        if (stats.bandCount > 0) {
                            // Mark only the last band as dirty
                            domain.markBandsDirty(indexMap.originalLength, indexMap.finalLength);
                        }
                    }
                }
            } else if (isPrependOnly) {
                // For prepend-only, mark first band as dirty
                for (const domain of bandedDomains.values()) {
                    if (domain instanceof BandedDomain) {
                        domain.markBandsDirty(0, indexMap.totalPrependCount);
                    }
                }
            }
        }
    }

    /**
     * Collects change descriptions from all DataSets before committing.
     */
    private collectScopeChanges(processedData: ProcessedData<D>): Map<ScopeId, DataChangeDescription> {
        const scopeChanges = new Map<ScopeId, DataChangeDescription>();
        for (const [scopeId, dataSet] of processedData.dataSources) {
            const changeDesc = dataSet.getChangeDescription();
            if (changeDesc) {
                scopeChanges.set(scopeId, changeDesc);
            }
        }
        return scopeChanges;
    }

    /**
     * Commits all pending transactions to the data arrays.
     */
    private commitPendingTransactions(processedData: ProcessedData<D>): void {
        for (const dataSet of processedData.dataSources.values()) {
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
     * Transforms keys arrays using cached insertion results.
     */
    private transformKeysArrays(
        processedData: ProcessedData<D>,
        scopeChanges: Map<ScopeId, DataChangeDescription>,
        insertionCaches: Map<ScopeId, InsertionCache>
    ): void {
        for (const [keyDefIndex, keyDef] of this.keys.entries()) {
            const keysMap = processedData.keys[keyDefIndex];

            for (const scope of keyDef.scopes ?? []) {
                const changeDesc = scopeChanges.get(scope);
                if (!changeDesc) continue;

                const keys = keysMap.get(scope);
                if (!keys) continue;

                const insertionCache = insertionCaches.get(scope);

                changeDesc.applyToArray(keys, (destIndex) => {
                    const cached = insertionCache?.get(destIndex);
                    if (cached) {
                        const keyResult = cached.keys.get(keyDefIndex);
                        return keyResult?.valid ? keyResult.value : keyDef.invalidValue;
                    }
                    return keyDef.invalidValue;
                });
            }
        }
    }

    /**
     * Transforms columns arrays using cached insertion results.
     */
    private transformColumnsArrays(
        processedData: ProcessedData<D>,
        scopeChanges: Map<ScopeId, DataChangeDescription>,
        insertionCaches: Map<ScopeId, InsertionCache>
    ): void {
        for (const [valueDefIndex, valueDef] of this.values.entries()) {
            const column = processedData.columns[valueDefIndex];
            const columnScope = first(valueDef.scopes);
            const changeDesc = scopeChanges.get(columnScope);

            if (!changeDesc) continue;

            const insertionCache = insertionCaches.get(columnScope);

            changeDesc.applyToArray(column, (destIndex) => {
                const cached = insertionCache?.get(destIndex);
                if (cached) {
                    const valueResult = cached.values.get(valueDefIndex);
                    return valueResult?.valid ? valueResult.value : valueDef.invalidValue;
                }
                return valueDef.invalidValue;
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
        // Transform invalidKeys arrays
        if (processedData.invalidKeys) {
            for (const [scope, changeDesc] of scopeChanges) {
                const invalidKeys = processedData.invalidKeys.get(scope);
                if (!invalidKeys) continue;

                const insertionCache = insertionCaches.get(scope);

                changeDesc.applyToArray(invalidKeys, (destIndex) => {
                    const cached = insertionCache?.get(destIndex);
                    return cached?.hasInvalidKey ?? false;
                });
            }
        }

        // Transform invalidData arrays
        if (processedData.invalidData) {
            for (const [scope, changeDesc] of scopeChanges) {
                const invalidData = processedData.invalidData.get(scope);
                if (!invalidData) continue;

                const insertionCache = insertionCaches.get(scope);

                changeDesc.applyToArray(invalidData, (destIndex) => {
                    const cached = insertionCache?.get(destIndex);
                    if (!cached) return false;

                    // A datum is considered invalid if it has invalid keys OR invalid values
                    return cached.hasInvalidKey || cached.hasInvalidValue;
                });
            }
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

        // Initialize or reuse domain objects
        for (const keyDef of this.keys) {
            // Check if we have an existing banded domain for this def
            let domain = bandedDomains.get(keyDef);

            if (keyDef.valueType === 'category') {
                // Don't use banding for discrete domains
                keyDomains.set(keyDef, new DiscreteDomain());
            } else {
                // Use banded domain for continuous values if configured
                if (!domain && bandingConfig?.enableBanding !== false) {
                    domain = new BandedDomain(() => new ContinuousDomain(), bandingConfig, false);
                    bandedDomains.set(keyDef, domain);
                }

                if (domain) {
                    keyDomains.set(keyDef, domain);
                } else {
                    keyDomains.set(keyDef, new ContinuousDomain());
                }
            }
        }

        for (const valueDef of this.values) {
            // Check if we have an existing banded domain for this def
            let domain = bandedDomains.get(valueDef);

            if (valueDef.valueType === 'category') {
                // Don't use banding for discrete domains
                valueDomains.set(valueDef, new DiscreteDomain());
            } else {
                // Use banded domain for continuous values if configured
                if (!domain && bandingConfig?.enableBanding !== false) {
                    domain = new BandedDomain(() => new ContinuousDomain(), bandingConfig, false);
                    bandedDomains.set(valueDef, domain);
                }

                if (domain) {
                    valueDomains.set(valueDef, domain);
                } else {
                    valueDomains.set(valueDef, new ContinuousDomain());
                }
            }
        }

        // Extend key domains from keys arrays
        for (const [keyDefIndex, keyDef] of this.keys.entries()) {
            const keysMap = processedData.keys[keyDefIndex];
            const domain = keyDomains.get(keyDef)!;

            // If using banded domain, handle it specially
            if (domain instanceof BandedDomain) {
                // Initialize bands if needed
                const maxKeyLength = Math.max(...Array.from(keysMap.values()).map((keys) => keys.length));
                domain.initializeBands(maxKeyLength);

                // Scan dirty bands for each scope
                for (const scope of keyDef.scopes ?? []) {
                    const keys = keysMap.get(scope);
                    if (!keys) continue;

                    const invalidData = processedData.invalidData?.get(scope);
                    domain.extendBandsFromData(keys, invalidData);
                }
            } else {
                // Standard domain extension (discrete or non-banded continuous)
                for (const scope of keyDef.scopes ?? []) {
                    const keys = keysMap.get(scope);
                    if (!keys) continue;

                    const invalidData = processedData.invalidData?.get(scope);
                    for (let i = 0; i < keys.length; i++) {
                        if (invalidData?.[i] === true) continue;
                        domain.extend(keys[i]);
                    }
                }
            }
        }

        // Extend value domains from columns arrays
        for (const [valueDefIndex, valueDef] of this.values.entries()) {
            const column = processedData.columns[valueDefIndex];
            const domain = valueDomains.get(valueDef)!;
            const columnScope = first(valueDef.scopes);
            const invalidData = processedData.invalidData?.get(columnScope);

            // If using banded domain, handle it specially
            if (domain instanceof BandedDomain) {
                domain.initializeBands(column.length);
                domain.extendBandsFromData(column, invalidData);
            } else {
                // Standard domain extension
                for (let i = 0; i < column.length; i++) {
                    if (invalidData?.[i] === true) continue;
                    domain.extend(column[i]);
                }
            }
        }

        // Collect band statistics if in debug mode
        if (this.debug.check() && bandedDomains.size > 0) {
            bandStats = {
                totalBands: 0,
                dirtyBands: 0,
                totalData: 0,
            };

            for (const domain of bandedDomains.values()) {
                if (domain instanceof BandedDomain) {
                    const stats = domain.getStats();
                    bandStats.totalBands += stats.bandCount;
                    bandStats.dirtyBands += stats.dirtyBandCount;
                    bandStats.totalData = Math.max(bandStats.totalData, stats.dataSize);
                }
            }
        }

        // Update processedData domains
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

        // Log performance metrics
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
        scopeChanges: Map<ScopeId, DataChangeDescription>
    ): void {
        // Helper to get key string for a datum at a given index
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
                removed: new Set<string>(),
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

            // Optimize moved items detection based on transaction type
            const { isAppendOnly, isPrependOnly, hasNoRemovals, originalLength, totalPrependCount } =
                changeDesc.indexMap;

            if (isAppendOnly) {
                // Append-only: nothing moved
            } else if (isPrependOnly && originalLength > 0) {
                // Prepend-only: all preserved items moved
                for (let destIndex = totalPrependCount; destIndex < totalPrependCount + originalLength; destIndex++) {
                    const keyStr = getKeyString(scope, destIndex);
                    if (keyStr) {
                        diff.moved.add(keyStr);
                    }
                }
            } else if (hasNoRemovals && totalPrependCount > 0) {
                // No removals but has prepends: all preserved items shifted
                for (let sourceIndex = 0; sourceIndex < originalLength; sourceIndex++) {
                    const destIndex = sourceIndex + totalPrependCount;
                    const keyStr = getKeyString(scope, destIndex);
                    if (keyStr) {
                        diff.moved.add(keyStr);
                    }
                }
            } else {
                // General case with removals: need full iteration
                changeDesc.forEachPreservedIndex((sourceIndex, destIndex) => {
                    if (sourceIndex !== destIndex) {
                        const keyStr = getKeyString(scope, destIndex);
                        if (keyStr) {
                            diff.moved.add(keyStr);
                        }
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
        // Find maximum data length across all scopes
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
                const count = invalidKeys.filter((invalid: boolean) => invalid).length;
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
        const { dataDomain, processValue, allScopesHaveSameDefs } = this.initDataDomainProcessor();

        const { keys: keyDefs, values: valueDefs } = this;

        const { invalidData, invalidKeys, invalidKeyCount, allKeyMappings } = this.extractKeys(
            keyDefs,
            sources,
            processValue
        );

        const { columns, columnScopes, columnValueTypes, partialValidDataCount, maxDataLength } = this.extractValues(
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
            columnValueTypes,
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
        const columnValueTypes: boolean[] = [];
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

                // Detect if this column contains Date objects or other objects needing valueOf()
                if (!needsValueOf && value != null && typeof value === 'object') {
                    needsValueOf = true;
                }

                column[datumIndex] = value;
            }

            columns.push(column);
            allColumnScopes.push(columnScopes);
            columnValueTypes.push(needsValueOf);
            maxDataLength = Math.max(maxDataLength, column.length);
        }

        return { columns, columnScopes: allColumnScopes, columnValueTypes, partialValidDataCount, maxDataLength };
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
            [DOMAIN_BANDS]: data[DOMAIN_BANDS],
        };
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
