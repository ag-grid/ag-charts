import { Debug, Logger, first } from 'ag-charts-core';

import type { ChartMode } from '../chartMode';
import { Aggregator } from './data-model/aggregation/aggregator';
import type { DataModelContext } from './data-model/dataModelContext';
import { DomainInitializer } from './data-model/domain/domainInitializer';
import { DomainManager } from './data-model/domain/domainManager';
import { DataExtractor } from './data-model/extraction/dataExtractor';
import { DataGrouper } from './data-model/grouping/dataGrouper';
import { IncrementalProcessor } from './data-model/incremental/incrementalProcessor';
import { isScoped } from './data-model/utils/helpers';
import { DataModelResolvers } from './data-model/utils/resolvers';
import { ScopeCacheManager } from './data-model/utils/scopeCache';
import type {
    AggregatePropertyDefinition,
    DataGroup,
    DataModelOptions,
    GroupDatumIteratorOutput,
    GroupValueProcessorDefinition,
    GroupedData,
    InternalDatumPropertyDefinition,
    InternalDefinition,
    ProcessedData,
    ProcessedDataDef,
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
import type { DataChangeDescription, DataSet } from './dataSet';
import { type SortOrder } from './sortOrder';

export * from './dataModelTypes';

export { fixNumericExtent, getMissCount, datumKeys, getPathComponents } from './data-model/utils/helpers';

/**
 * Transforms raw chart data into a structured, renderable format for series visualization.
 *
 * The DataModel is responsible for processing data through a multi-stage pipeline:
 * - Extracting and validating data from input datasets
 * - Grouping data by keys (for categorical axes or stacked series)
 * - Computing aggregations (sum, average, etc.) for grouped data
 * - Calculating domains (value ranges) for axes and scales
 * - Managing scoped data processing for multi-series charts
 * - Supporting incremental updates when data changes
 *
 * The class orchestrates several specialized subsystems:
 * - DataExtractor: Extracts and validates raw data
 * - DataGrouper: Groups data by keys
 * - Aggregator: Computes aggregations over grouped data
 * - DomainManager: Calculates and maintains value domains
 * - IncrementalProcessor: Handles efficient data updates
 *
 * Performance optimizations:
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
    private readonly dataGrouper!: DataGrouper<D, K>;
    private readonly aggregator!: Aggregator<D, K>;
    private readonly incrementalProcessor!: IncrementalProcessor<D, K>;
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

        // Create shared context for all subsystems
        const ctx: DataModelContext<D, K> = {
            keys: this.keys,
            values: this.values,
            aggregates: this.aggregates,
            groupProcessors: this.groupProcessors,
            propertyProcessors: this.propertyProcessors,
            reducers: this.reducers,
            processors: this.processors,
            debug: this.debug,
            mode: this.mode,
            bandingConfig: this.opts.domainBandingConfig,
            suppressFieldDotNotation: this.suppressFieldDotNotation,
            scopeCache: this.scopeCache,
        };

        // Initialize subsystems with shared context
        this.resolvers = new DataModelResolvers(ctx);
        this.scopeCacheManager = new ScopeCacheManager(ctx);
        this.domainInitializer = new DomainInitializer(ctx);
        this.domainManager = new DomainManager(ctx, this.domainInitializer, this.scopeCacheManager);
        this.dataExtractor = new DataExtractor(ctx, this.domainManager);
        this.dataGrouper = new DataGrouper(ctx);
        this.aggregator = new Aggregator(ctx, this.scopeCacheManager, this.resolvers);
        this.incrementalProcessor = new IncrementalProcessor(ctx);
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

    resolveMissingDataCount(scope: ScopeProvider): number {
        return this.resolvers.resolveMissingDataCount(scope);
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
            processedData = this.dataGrouper.groupData(processedData);
        } else if (groupByFn) {
            processedData = this.dataGrouper.groupData(processedData, groupByFn(processedData));
        }
        if (groupProcessors.length > 0 && processedData.type === 'grouped') {
            this.aggregator.postProcessGroups(processedData);
        }
        if (aggregates.length > 0 && processedData.type === 'ungrouped') {
            this.aggregator.aggregateUngroupedData(processedData);
        } else if (aggregates.length > 0 && processedData.type === 'grouped') {
            this.aggregator.aggregateGroupedData(processedData);
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
        return this.incrementalProcessor.isReprocessingSupported(processedData);
    }

    public reprocessData(
        processedData: ProcessedData<D>,
        dataSets?: Map<DataSet<any>, DataChangeDescription | undefined>
    ): ProcessedData<D> {
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

        const { processValue } = this.initDataDomainProcessor('skip');
        return this.incrementalProcessor.reprocessData(
            processedData,
            dataSets,
            processValue,
            (pd, sc) => this.reprocessGroupProcessors(pd, sc),
            (pd) => this.recomputeDomains(pd),
            (pd, mode) => this.collectOptimizationMetadata(pd, mode)
        );
    }

    /**
     * Recomputes domains from transformed arrays.
     * Uses BandedDomain optimization for continuous domains to avoid full rescans.
     */
    private recomputeDomains(processedData: ProcessedData<D>): void {
        this.domainManager.recomputeDomains(processedData);
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
