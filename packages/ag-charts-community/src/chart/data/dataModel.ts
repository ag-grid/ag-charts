import { Logger, first } from 'ag-charts-core';

import { Debug } from '../../util/debug';
import type { ChartMode } from '../chartMode';
import { DomainInitializer } from './data-model/domain/domainInitializer';
import { DomainManager } from './data-model/domain/domainManager';
import { DataExtractor } from './data-model/extraction/dataExtractor';
import { createArray, datumKeys, isScoped, toKeyString } from './data-model/utils/helpers';
import { DataModelResolvers } from './data-model/utils/resolvers';
import { ScopeCacheManager } from './data-model/utils/scopeCache';
import { hasNoRemovals, isAppendOnly, isPrependOnly } from './dataChangeDescription';
import { BandedDomain, ContinuousDomain, DiscreteDomain } from './dataDomain';
// Import types for internal use
import type {
    AggregatePropertyDefinition,
    ColumnBatch,
    DataGroup,
    DataModelOptions,
    GroupDatumIteratorOutput,
    GroupValueProcessorDefinition,
    GroupedData,
    GroupingFn,
    InsertionCache,
    InsertionCacheValue,
    InternalDatumPropertyDefinition,
    InternalDefinition,
    MergedColumnBatch,
    ProcessedData,
    ProcessedDataDef,
    ProcessedOutputDiff,
    ProcessedValue,
    ProcessedValueEntry,
    ProcessorOutputPropertyDefinition,
    PropertyDefinition,
    PropertyId,
    PropertySelectors,
    PropertyValueProcessorDefinition,
    ReducerOutputPropertyDefinition,
    ScopeId,
    ScopeProvider,
    UngroupedData,
} from './dataModelTypes';
import {
    COLUMN_SORT_ORDERS,
    DOMAIN_BANDS,
    DOMAIN_RANGES,
    KEY_SORT_ORDERS,
    SHARED_ZERO_INDICES,
} from './dataModelTypes';
import type { DataChangeDescription, DataSet } from './dataSet';
import { type SortOrder } from './sortOrder';

// Export all types from dataModelTypes
export * from './dataModelTypes';

// Re-export helper functions that are part of the public API
export { fixNumericExtent, getMissCount, datumKeys, getPathComponents } from './data-model/utils/helpers';

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
    private readonly resolvers!: DataModelResolvers<D, K>;
    private readonly scopeCacheManager!: ScopeCacheManager<K>;
    private readonly domainInitializer!: DomainInitializer<K>;
    private readonly domainManager!: DomainManager<D, K>;
    private readonly dataExtractor!: DataExtractor<D, K>;
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

        // Initialize resolvers and scope cache manager after all properties are set up
        this.resolvers = new DataModelResolvers(this.scopeCache);
        this.scopeCacheManager = new ScopeCacheManager(
            this.scopeCache,
            this.keys,
            this.values,
            this.aggregates,
            this.suppressFieldDotNotation
        );
        this.domainInitializer = new DomainInitializer(this.debug, this.opts.domainBandingConfig);
        this.domainManager = new DomainManager(
            this.domainInitializer,
            this.scopeCacheManager,
            this.keys,
            this.values,
            this.debug,
            this.mode
        );
        this.dataExtractor = new DataExtractor(this.keys, this.values, this.domainManager);
    }

    resolveProcessedDataDefById(scope: ScopeProvider, searchId: string): ProcessedDataDef | never {
        return this.resolvers.resolveProcessedDataDefById(scope, searchId);
    }

    resolveProcessedDataIndexById(scope: ScopeProvider, searchId: string): number {
        return this.resolvers.resolveProcessedDataIndexById(scope, searchId);
    }

    resolveKeysById<T = string>(
        scope: ScopeProvider,
        searchId: string,
        processedData: UngroupedData<any> | GroupedData<any>
    ): T[] {
        return this.resolvers.resolveKeysById<T>(scope, searchId, processedData);
    }

    hasColumnById(scope: ScopeProvider, searchId: string) {
        return this.resolvers.hasColumnById(scope, searchId);
    }

    resolveColumnById<T = any>(
        scope: ScopeProvider,
        searchId: string,
        processedData: UngroupedData<any> | GroupedData<any>
    ): T[] {
        return this.resolvers.resolveColumnById<T>(scope, searchId, processedData);
    }

    resolveColumnNeedsValueOf(
        scope: ScopeProvider,
        searchId: string,
        processedData: UngroupedData<any> | GroupedData<any>
    ): boolean {
        return this.resolvers.resolveColumnNeedsValueOf(scope, searchId, processedData);
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
            const absoluteDatumIndex = this.resolvers.resolveAbsoluteIndex(groupIndex, relativeDatumIndex);
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
                output.datumIndex = this.resolvers.resolveAbsoluteIndex(output.groupIndex, relativeDatumIndex);
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
        return this.resolvers.getDomain(scope, searchId, type, processedData);
    }

    getDomainBetweenRange(
        scope: ScopeProvider,
        searchIds: string[],
        [i0, i1]: [number, number],
        processedData: ProcessedData<K>
    ): [number, number] {
        return this.resolvers.getDomainBetweenRange(scope, searchIds, [i0, i1], processedData);
    }

    getKeySortOrder(scope: ScopeProvider, searchId: string, processedData: ProcessedData<K>): SortOrder {
        return this.resolvers.getKeySortOrder(scope, searchId, processedData);
    }

    getColumnSortOrder(scope: ScopeProvider, searchId: string, processedData: ProcessedData<K>): SortOrder {
        return this.resolvers.getColumnSortOrder(scope, searchId, processedData);
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
     * Recomputes domains from transformed arrays.
     * Uses BandedDomain optimization for continuous domains to avoid full rescans.
     */
    private recomputeDomains(processedData: ProcessedData<D>): void {
        this.domainManager.recomputeDomains(processedData);
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
        this.dataExtractor.warnDataMissingProperties(sources);
    }

    private processScopeCache() {
        this.scopeCacheManager.processScopeCache();
    }

    private valueGroupIdxLookup(selector: PropertySelectors) {
        return this.scopeCacheManager.valueGroupIdxLookup(selector);
    }

    private valueIdxLookup(scopes: string[] | undefined, prop: PropertyId<string>) {
        return this.scopeCacheManager.valueIdxLookup(scopes, prop);
    }

    private extractData(sources: Map<string, DataSet<unknown>>): UngroupedData<D> {
        return this.dataExtractor.extractData(sources);
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
                        const absoluteDatumIndex = this.resolvers.resolveAbsoluteIndex(groupIndex, relativeDatumIndex);
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
        return this.domainManager.initDataDomainProcessor(domainMode);
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

    buildAccessors(defs: Iterable<{ property: string }>) {
        return this.scopeCacheManager.buildAccessors(defs);
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
