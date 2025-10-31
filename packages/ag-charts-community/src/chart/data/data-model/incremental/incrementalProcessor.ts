import { first } from 'ag-charts-core';

import { hasNoRemovals, isAppendOnly, isPrependOnly } from '../../dataChangeDescription';
import { BandedDomain } from '../../dataDomain';
import type {
    DataGroup,
    GroupedData,
    InsertionCache,
    InsertionCacheValue,
    InternalDatumPropertyDefinition,
    ProcessedData,
    ProcessedOutputDiff,
    ProcessedValue,
    ProcessedValueEntry,
    ScopeId,
} from '../../dataModelTypes';
import {
    COLUMN_SORT_ORDERS,
    DOMAIN_BANDS,
    DOMAIN_RANGES,
    KEY_SORT_ORDERS,
    SHARED_ZERO_INDICES,
} from '../../dataModelTypes';
import type { DataChangeDescription, DataSet } from '../../dataSet';
import type { DataModelContext } from '../dataModelContext';
import { createArray, toKeyString } from '../utils/helpers';

/**
 * Handles incremental reprocessing of data when DataSets change.
 *
 * INCREMENTAL REPROCESSING OPTIMIZATION:
 * Instead of reprocessing all data, we:
 * 1. Apply change descriptions to transform existing arrays
 * 2. Process only new insertions
 * 3. Update only affected domain bands
 * 4. Reuse existing group structures when possible
 * This can reduce processing time by 90%+ for small updates to large datasets
 */
export class IncrementalProcessor<D extends object, K extends keyof D & string> {
    constructor(private readonly ctx: DataModelContext<D, K>) {}

    /**
     * Checks if incremental reprocessing is supported for the given data configuration.
     */
    isReprocessingSupported(processedData: ProcessedData<D>): boolean {
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
        if (this.ctx.aggregates.length > 0) return false;
        if (this.ctx.reducers.length > 0) return false;
        if (this.ctx.processors.length > 0) return false;
        if (this.ctx.propertyProcessors.length > 0) return false;

        // Check if all group processors support reprocessing
        return this.ctx.groupProcessors.every((p) => p.supportsReprocessing ?? false);
    }

    /**
     * Performs incremental reprocessing of data based on change descriptions.
     */
    reprocessData(
        processedData: ProcessedData<D>,
        dataSets: Map<DataSet<any>, DataChangeDescription | undefined> | undefined,
        processValue: (
            def: InternalDatumPropertyDefinition<K>,
            datum: any,
            idx: number,
            scopes: string | string[]
        ) => ProcessedValue,
        reprocessGroupProcessorsFn: (
            processedData: GroupedData<D>,
            scopeChanges: Map<ScopeId, DataChangeDescription>
        ) => void,
        recomputeDomainsFn: (processedData: ProcessedData<D>) => void,
        collectOptimizationMetadataFn: (processedData: ProcessedData<D>, mode: 'reprocess') => void
    ): ProcessedData<D> {
        const start = performance.now();

        const scopeChanges = this.collectScopeChanges(processedData, dataSets);
        if (scopeChanges.size === 0) {
            return processedData;
        }

        this.commitPendingTransactions(processedData);
        const insertionCaches = this.processAllInsertions(processedData, scopeChanges, processValue);
        this.processAllUpdates(processedData, scopeChanges, processValue, insertionCaches);

        this.updateBandsForChanges(processedData, scopeChanges);
        const removedKeys = this.transformKeysArrays(processedData, scopeChanges, insertionCaches);
        this.transformColumnsArrays(processedData, scopeChanges, insertionCaches);
        this.transformInvalidityArrays(processedData, scopeChanges, insertionCaches);

        // Transform groups array for grouped data (when groupsUnique=true)
        if (processedData.type === 'grouped') {
            this.transformGroupsArray(processedData, scopeChanges, insertionCaches);

            // Reapply group processors to new data if they support reprocessing
            if (this.ctx.groupProcessors.length > 0) {
                reprocessGroupProcessorsFn(processedData, scopeChanges);
            }
        }

        recomputeDomainsFn(processedData);

        if (processedData.reduced?.diff != null && scopeChanges.size > 0) {
            this.generateDiffMetadata(processedData, scopeChanges, removedKeys);
        }

        this.updateProcessedDataMetadata(processedData);

        const end = performance.now();
        processedData.time = end - start;

        // Collect optimization metadata for testing
        collectOptimizationMetadataFn(processedData, 'reprocess');

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
            const { spliceOps, updatedIndices } = indexMap;

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

            // Mark bands containing updated indices as dirty
            // We use handleInsertion with 0 count to mark the band as dirty without changing structure
            if (updatedIndices.size > 0) {
                for (const index of updatedIndices) {
                    this.applyOperationToBandedDomains(bandedDomains, (domain) => domain.handleInsertion(index, 0));
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
     * Processes all updated items once per scope, adding them to the insertion cache.
     * This ensures updated values are available when transforming columns/keys arrays.
     */
    private processAllUpdates(
        processedData: ProcessedData<D>,
        scopeChanges: Map<ScopeId, DataChangeDescription>,
        processValue: (
            def: InternalDatumPropertyDefinition<K>,
            datum: any,
            idx: number,
            scopes: string | string[]
        ) => ProcessedValue,
        insertionCaches: Map<ScopeId, InsertionCache>
    ): void {
        for (const [scope, changeDesc] of scopeChanges) {
            const dataSet = processedData.dataSources.get(scope);
            if (!dataSet) continue;

            const updatedIndices = changeDesc.getUpdatedIndices();
            if (updatedIndices.length === 0) continue;

            // Get or create cache for this scope
            let cache = insertionCaches.get(scope);
            if (!cache) {
                cache = new Map();
                insertionCaches.set(scope, cache);
            }

            // Process each updated index
            for (const destIndex of updatedIndices) {
                if (destIndex < 0 || destIndex >= dataSet.data.length) {
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
                    for (const [keyDefIndex, keyDef] of this.ctx.keys.entries()) {
                        if (!keyDef.scopes?.includes(scope)) continue;

                        const result = processValue(keyDef, datum, destIndex, scope);
                        keys.set(keyDefIndex, { value: result.value, valid: result.valid });

                        if (!result.valid) {
                            hasInvalidKey = true;
                        }
                    }

                    // Process all values for this scope
                    for (const [valueDefIndex, valueDef] of this.ctx.values.entries()) {
                        if (!valueDef.scopes?.includes(scope)) continue;

                        const result = processValue(valueDef, datum, destIndex, valueDef.scopes);
                        values.set(valueDefIndex, { value: result.value, valid: result.valid });

                        if (!result.valid) {
                            hasInvalidValue = true;
                        }
                    }
                }

                // Store in cache (overwrites any existing insertion at this index)
                cache.set(destIndex, { keys, values, hasInvalidKey, hasInvalidValue });
            }
        }
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
                    for (const [keyDefIndex, keyDef] of this.ctx.keys.entries()) {
                        if (!keyDef.scopes?.includes(scope)) continue;

                        const result = processValue(keyDef, datum, destIndex, scope);
                        keys.set(keyDefIndex, { value: result.value, valid: result.valid });

                        if (!result.valid) {
                            hasInvalidKey = true;
                        }
                    }

                    // Process all values for this scope
                    for (const [valueDefIndex, valueDef] of this.ctx.values.entries()) {
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

        for (const [defIndex, def] of this.ctx.keys.entries()) {
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
                                removedMetadata.tuples[removalCursor] = new Array(this.ctx.keys.length);
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
                    const keyDef = this.ctx.keys[defIndex];
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
            this.ctx.values,
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

        // Recompute invalidDataCount
        if (processedData.invalidDataCount) {
            for (const [scope, invalidData] of processedData.invalidData ?? new Map()) {
                const count = invalidData.filter(Boolean).length;
                processedData.invalidDataCount.set(scope, count);
            }
        }

        // Clear cached data that depends on array positions
        processedData[DOMAIN_RANGES].clear();
        processedData[KEY_SORT_ORDERS].clear();
        processedData[COLUMN_SORT_ORDERS].clear();
        // Note: We intentionally don't clear DOMAIN_BANDS here as they maintain state across updates
    }

    /**
     * Helper to get unique DataSets from processed data.
     */
    private getUniqueDataSets(processedData: ProcessedData<D>): Set<DataSet<any>> {
        // Deduplicate DataSets (multiple scopes can share same DataSet)
        return new Set(processedData.dataSources.values());
    }
}
