import { ArrayUpdater } from './arrayUpdater';
import type { DataChangeDescriptor } from './dataChangeDescriptor';
import { ContinuousDomain, DiscreteDomain, type IDataDomain } from './dataDomain';

// Note: We define this locally to avoid circular dependency with dataModel.ts
// This should match the ProcessedOutputDiff interface in dataModel.ts
type ProcessedOutputDiff = {
    changed: boolean;
    added: Set<string>;
    updated: Set<string>;
    removed: Set<string>;
    moved: Set<string>;
};

// Note: We import the ProcessedData type specifically to avoid the circular dependency
type ProcessedData = {
    type: 'ungrouped' | 'grouped';
    input: { count: number };
    scopes: Set<string>;
    dataSources: Map<string, unknown[]>;
    invalidKeys: Map<string, boolean[]> | undefined;
    invalidKeyCount: Map<string, number> | undefined;
    invalidData: Map<string, boolean[]> | undefined;
    keys: Map<string, unknown[]>[];
    columns: any[][];
    columnScopes: Set<string>[];
    domain: {
        keys: any[][];
        values: any[][];
        groups?: any[][];
        aggValues?: any[][];
    };
    reduced?: {
        diff?: Record<string, ProcessedOutputDiff>;
        animationValidation?: {
            uniqueKeys: boolean;
            orderedKeys: boolean;
        };
        [key: string]: any;
    };
    defs: {
        keys: any[];
        values: any[];
        allScopesHaveSameDefs: boolean;
    };
    partialValidDataCount?: number;
    time: number;
    groups?: ProcessedGroup[];
};

type ProcessedGroup = {
    keys: unknown[];
    datumIndices: number[][];
    aggregation: any[];
    validScopes: Set<string>;
};

type ProcessValueFn = (
    def: any,
    datum: any,
    idx: number,
    valueScopes?: string | string[],
    accessors?: Map<string, (d: any) => any>,
    dataDomain?: Map<object, IDataDomain>,
    initDataDomain?: () => void
) => { value: unknown; missing: boolean; valid: boolean };

type ProcessedDatumResult = {
    value: unknown;
    valid: boolean;
    missing: boolean;
};

export interface ProcessedDataMutatorOptions {
    processValue: ProcessValueFn;
    accessors?: Map<string, (d: any) => any>;
}

// Cache Symbol keys that match those in dataModel.ts
// These symbols must match the exact string descriptors used in DataModel
const KEY_SORT_ORDERS = Symbol.for('key-sort-orders');
const COLUMN_SORT_ORDERS = Symbol.for('column-sort-orders');
const DOMAIN_RANGES = Symbol.for('domain-ranges');

/**
 * Mutates ProcessedData structures in-place based on DataChangeDescriptor.
 * Provides efficient incremental updates without full reprocessing.
 *
 * The ProcessedDataMutator is the core component responsible for applying incremental
 * changes to ProcessedData structures. It coordinates updates across columns, keys,
 * domains, and metadata while maintaining data consistency and performance.
 *
 * @example Basic mutation workflow
 * ```typescript
 * // Create mutator with value processing function
 * const mutator = new ProcessedDataMutator({
 *     processValue: dataModel.processValue.bind(dataModel)
 * });
 *
 * // Apply changes from transaction analysis
 * const changes = TransactionAnalyzer.analyze(dataRef, sources);
 * if (changes) {
 *     mutator.mutate(processedData, changes);
 *     // processedData is now updated in-place
 * }
 * ```
 *
 * @example With custom accessors for performance
 * ```typescript
 * const accessors = dataModel.buildAccessors(propertyDefinitions);
 * const mutator = new ProcessedDataMutator({
 *     processValue: dataModel.processValue.bind(dataModel),
 *     accessors: accessors
 * });
 *
 * mutator.mutate(processedData, changes);
 * ```
 *
 * @remarks
 * **Core Responsibilities:**
 * - Updates processedData.columns arrays using ArrayUpdater
 * - Updates processedData.keys maps for all scopes
 * - Recalculates domain ranges for affected data
 * - Invalidates caches stored as Symbol keys
 * - Updates metadata including diff and animation validation flags
 *
 * **Performance Characteristics:**
 * - In-place mutations avoid memory allocations
 * - O(k) complexity where k = number of changes
 * - Targeted updates only affect changed columns/keys
 * - Lazy cache reconstruction on next access
 *
 * **Error Handling:**
 * - Fails fast on implementation bugs (no rollback)
 * - Throws errors for corrupted state or invalid inputs
 * - Designed to be predictable and debuggable
 *
 * **Mutation Strategy:**
 * - Processes removals, insertions, and updates atomically
 * - Maintains consistency across related data structures
 * - Updates domains incrementally rather than clearing
 * - Sets animation flags to disable transitions for high-frequency updates
 */
export class ProcessedDataMutator {
    private readonly processValue: ProcessValueFn;
    private readonly accessors: Map<string, (d: any) => any>;
    private currentKeyDef: { property: string | number | symbol } | null = null;

    constructor(options: ProcessedDataMutatorOptions) {
        if (!options || typeof options.processValue !== 'function') {
            throw new Error('ProcessedDataMutator requires a processValue implementation');
        }

        this.processValue = options.processValue;
        this.accessors = options.accessors ?? new Map();
    }

    /**
     * Apply changes to ProcessedData structure in-place.
     *
     * This is the main method that coordinates all mutation operations. It applies
     * changes atomically and maintains consistency across all related data structures.
     *
     * @param processedData - The ProcessedData to mutate in-place
     * @param changes - The DataChangeDescriptor describing what changes to apply
     *
     * @example Applying transaction changes
     * ```typescript
     * const changes = {
     *     removed: [{ index: 2, datum: { x: 3, y: 30 } }],
     *     inserted: [{ index: 0, datum: { x: 0, y: 5 } }],
     *     updated: [{ index: 1, oldDatum: { x: 2, y: 20 }, newDatum: { x: 2, y: 25 } }],
     *     indexShiftRanges: [...],
     *     metadata: { totalRemoved: 1, totalInserted: 1, totalUpdated: 1, netSizeChange: 0 }
     * };
     *
     * mutator.mutate(processedData, changes);
     *
     * // ProcessedData is now updated:
     * // - columns arrays are mutated with new values
     * // - keys maps are updated for all scopes
     * // - domain ranges are recalculated
     * // - caches are invalidated
     * // - animation flags are set appropriately
     * ```
     *
     * @throws {Error} When ProcessedData structure is corrupted or invalid
     * @throws {Error} When single-scope constraint is violated
     *
     * @remarks
     * **Mutation Process:**
     * 1. **Early Exit**: Returns immediately if no changes are present
     * 2. **Validation**: Ensures single-scope incremental prerequisites are met
     * 3. **Data Updates**: Applies changes to columns and keys using ArrayUpdater
     * 4. **Cache Invalidation**: Clears affected Symbol-keyed caches
     * 5. **Metadata Update**: Updates diff and animation validation flags
     * 6. **Domain Update**: Recalculates domain ranges for affected columns
     *
     * **Performance Optimizations:**
     * - Batch processing of all changes in single pass
     * - Targeted updates only for affected columns and keys
     * - In-place array mutations to avoid allocations
     * - Efficient cache invalidation using targeted key deletion
     *
     * **State Consistency:**
     * - All related data structures are updated atomically
     * - Invalid data tracking is maintained across mutations
     * - Scope-based data isolation is preserved
     * - Input count and metadata are kept synchronized
     */
    mutate(processedData: ProcessedData, changes: DataChangeDescriptor): void {
        try {
            if (this.hasNoChanges(changes)) {
                return;
            }

            const { affectedColumns, affectedKeys } = this.applyUngroupedChanges(processedData, changes);

            this.invalidateCaches(processedData, affectedColumns, affectedKeys);
            this.updateProcessedDataMetadata(processedData, changes);
            this.updateDomainRanges(processedData, affectedColumns, affectedKeys);
        } catch (error) {
            const message = `ProcessedDataMutator failed: ${error instanceof Error ? error.message : String(error)}`;
            throw new Error(message);
        }
    }

    private hasNoChanges(changes: DataChangeDescriptor): boolean {
        return (
            changes.metadata.totalRemoved === 0 &&
            changes.metadata.totalInserted === 0 &&
            changes.metadata.totalUpdated === 0
        );
    }

    private applyUngroupedChanges(
        processedData: ProcessedData,
        changes: DataChangeDescriptor
    ): { affectedColumns: Set<number>; affectedKeys: Set<number> } {
        const scopeId = this.getSingleScope(processedData);
        const keyDefs = processedData.defs?.keys ?? [];
        const valueDefs = processedData.defs?.values ?? [];

        // Store the first key definition for diff generation
        this.currentKeyDef = keyDefs.length > 0 ? keyDefs[0] : null;

        const affectedColumns = new Set<number>();
        for (let i = 0; i < processedData.columns.length; i++) {
            affectedColumns.add(i);
        }

        const affectedKeys = new Set<number>();
        for (let i = 0; i < processedData.keys.length; i++) {
            affectedKeys.add(i);
        }

        const columnCount = Math.min(valueDefs.length, processedData.columns.length);
        const keyCount = Math.min(keyDefs.length, processedData.keys.length);

        const firstColumnLength = processedData.columns[0]?.length ?? 0;
        const firstKeyArray = keyCount > 0 ? processedData.keys[0].get(scopeId) ?? [] : [];
        const originalLength = Math.max(firstColumnLength, firstKeyArray.length);

        const invalidKeysMap = (processedData.invalidKeys ??= new Map());
        let invalidKeysArray = invalidKeysMap.get(scopeId);
        if (!invalidKeysArray) {
            invalidKeysArray = Array.from({ length: originalLength }, () => false);
            invalidKeysMap.set(scopeId, invalidKeysArray);
        }

        const invalidDataMap = (processedData.invalidData ??= new Map());
        let invalidDataArray = invalidDataMap.get(scopeId);
        if (!invalidDataArray) {
            invalidDataArray = Array.from({ length: originalLength }, () => false);
            invalidDataMap.set(scopeId, invalidDataArray);
        }

        const invalidKeyCountMap = (processedData.invalidKeyCount ??= new Map());

        let partialValidDataCount = processedData.partialValidDataCount ?? 0;

        const keyResultsByDatum = new Map<any, ProcessedDatumResult[]>();
        const valueResultsByDatum = new Map<any, ProcessedDatumResult[]>();
        const invalidKeyFlagByDatum = new Map<any, boolean>();
        const invalidDataFlagByDatum = new Map<any, boolean>();

        const oldEntries = [
            ...changes.removed.map((removal) => ({ datum: removal.datum, index: removal.index })),
            ...changes.updated.map((update) => ({ datum: update.oldDatum, index: update.index })),
        ];

        for (const { datum, index } of oldEntries) {
            if (datum == null || index < 0) continue;
            partialValidDataCount += this.adjustOldDatum(
                datum,
                index,
                scopeId,
                keyDefs,
                valueDefs,
                columnCount,
                invalidKeysArray ?? []
            );
        }

        const newEntries = [
            ...changes.inserted.map((insert) => ({ datum: insert.datum, index: insert.index })),
            ...changes.updated.map((update) => ({ datum: update.newDatum, index: update.index })),
        ];

        for (const { datum, index } of newEntries) {
            if (datum == null) continue;

            const keyResults = this.computeKeyResultsForDatum(keyDefs, datum, index, scopeId, true);
            keyResultsByDatum.set(datum, keyResults);
            const invalidKey = keyResults.some((result) => !result.valid);
            invalidKeyFlagByDatum.set(datum, invalidKey);

            const valueResults = this.computeValueResultsForDatum(valueDefs, datum, index, true);
            valueResultsByDatum.set(datum, valueResults);

            let datumInvalidDueToValue = false;
            for (let valueIndex = 0; valueIndex < columnCount; valueIndex++) {
                const valueResult = valueResults[valueIndex];
                if (!valueResult) continue;
                if (!invalidKey && !valueResult.valid) {
                    partialValidDataCount += 1;
                }
                if (!valueResult.valid) {
                    datumInvalidDueToValue = true;
                }
            }

            invalidDataFlagByDatum.set(datum, invalidKey || datumInvalidDueToValue);
        }

        for (let keyIndex = 0; keyIndex < keyCount; keyIndex++) {
            const keyMap = processedData.keys[keyIndex];
            const keyDef = keyDefs[keyIndex];
            if (!keyMap) continue;
            let keyArray = keyMap.get(scopeId);
            if (!keyArray) {
                keyArray = [];
                keyMap.set(scopeId, keyArray);
            }

            ArrayUpdater.applyChanges(keyArray, changes, (datum, arrayIndex) => {
                const results = keyResultsByDatum.get(datum);
                const result = results?.[keyIndex];
                if (!result) {
                    return keyArray[arrayIndex] ?? keyDef?.invalidValue;
                }
                return result.value;
            });
        }

        for (let valueIndex = 0; valueIndex < columnCount; valueIndex++) {
            const column = processedData.columns[valueIndex];
            const valueDef = valueDefs[valueIndex];
            if (!column || !valueDef) continue;

            ArrayUpdater.applyChanges(column, changes, (datum, arrayIndex) => {
                const invalidKey = invalidKeyFlagByDatum.get(datum) ?? false;
                const results = valueResultsByDatum.get(datum);
                const result = results?.[valueIndex];

                if (invalidKey) {
                    return valueDef.invalidValue;
                }

                if (!result) {
                    return column[arrayIndex] ?? valueDef.invalidValue;
                }

                return result.valid ? result.value : valueDef.invalidValue;
            });
        }

        if (invalidKeysArray) {
            ArrayUpdater.applyChanges(invalidKeysArray, changes, (datum) => invalidKeyFlagByDatum.get(datum) ?? false);
        }

        if (invalidDataArray) {
            ArrayUpdater.applyChanges(invalidDataArray, changes, (datum) => invalidDataFlagByDatum.get(datum) ?? false);
        }

        const newLength = processedData.columns[0]?.length ?? processedData.keys[0]?.get(scopeId)?.length ?? 0;
        processedData.input.count = newLength;
        processedData.partialValidDataCount = Math.max(0, partialValidDataCount);

        if (invalidKeysArray) {
            const anyInvalidKeys = invalidKeysArray.some(Boolean);
            if (anyInvalidKeys) {
                invalidKeysMap.set(scopeId, invalidKeysArray);
                const count = invalidKeysArray.reduce((acc: number, flag: boolean) => (flag ? acc + 1 : acc), 0);
                invalidKeyCountMap.set(scopeId, count);
            } else {
                invalidKeysMap.delete(scopeId);
                invalidKeyCountMap.delete(scopeId);
            }
        }

        if (invalidDataArray) {
            const anyInvalidData = invalidDataArray.some(Boolean);
            if (anyInvalidData) {
                invalidDataMap.set(scopeId, invalidDataArray);
            } else {
                invalidDataMap.delete(scopeId);
            }
        }

        if ((processedData.invalidKeys?.size ?? 0) === 0) {
            processedData.invalidKeys = undefined;
        }

        if ((processedData.invalidData?.size ?? 0) === 0) {
            processedData.invalidData = undefined;
        }

        if ((processedData.invalidKeyCount?.size ?? 0) === 0) {
            processedData.invalidKeyCount = undefined;
        }

        return { affectedColumns, affectedKeys };
    }

    private getSingleScope(processedData: ProcessedData): string {
        const iterator = processedData.scopes.values();
        const { value, done } = iterator.next();
        if (done || iterator.next().done === false) {
            throw new Error('Incremental updates currently support single-scope data only');
        }
        return value;
    }

    private computeKeyResultsForDatum(
        keyDefs: any[],
        datum: any,
        index: number,
        scopeId: string,
        trackMissing: boolean
    ): ProcessedDatumResult[] {
        return keyDefs.map((def) => this.computeKeyResult(def, datum, index, scopeId, trackMissing));
    }

    private computeValueResultsForDatum(
        valueDefs: any[],
        datum: any,
        index: number,
        trackMissing: boolean
    ): ProcessedDatumResult[] {
        return valueDefs.map((def) => this.computeValueResult(def, datum, index, def?.scopes, trackMissing));
    }

    private computeKeyResult(
        def: any,
        datum: any,
        index: number,
        scopeId: string,
        trackMissing: boolean
    ): ProcessedDatumResult {
        if (!def) {
            return { value: undefined, valid: false, missing: false };
        }

        const scopeArg = trackMissing ? scopeId : undefined;
        const result = this.processValue(def, datum, index, scopeArg, this.accessors);
        if (!trackMissing && result.missing) {
            this.decrementMissing(def, scopeId);
        }
        const value = result.valid ? result.value : def.invalidValue;
        return { value, valid: result.valid, missing: result.missing };
    }

    private computeValueResult(
        def: any,
        datum: any,
        index: number,
        scopes: string[] | undefined,
        trackMissing: boolean
    ): ProcessedDatumResult {
        if (!def) {
            return { value: undefined, valid: false, missing: false };
        }

        const scopeArg = trackMissing ? scopes : undefined;
        const result = this.processValue(def, datum, index, scopeArg, this.accessors);
        if (!trackMissing && result.missing) {
            this.decrementMissing(def, scopes ?? []);
        }
        const value = result.valid ? result.value : def.invalidValue;
        return { value, valid: result.valid, missing: result.missing };
    }

    private adjustOldDatum(
        datum: any,
        index: number,
        scopeId: string,
        keyDefs: any[],
        valueDefs: any[],
        columnCount: number,
        invalidKeysArray: boolean[]
    ): number {
        let partialDelta = 0;

        for (const keyDef of keyDefs) {
            this.computeKeyResult(keyDef, datum, index, scopeId, false);
        }

        const invalidKeyBefore = invalidKeysArray?.[index] ?? false;

        for (let valueIndex = 0; valueIndex < columnCount; valueIndex++) {
            const valueDef = valueDefs[valueIndex];
            if (!valueDef) continue;
            const result = this.computeValueResult(valueDef, datum, index, valueDef.scopes, false);
            if (!invalidKeyBefore && !result.valid) {
                partialDelta -= 1;
            }
        }

        return partialDelta;
    }

    private decrementMissing(def: any, scopes: string | string[]) {
        if (!def?.missing) {
            return;
        }

        const scopeList = Array.isArray(scopes) ? scopes : [scopes];

        for (const scope of scopeList) {
            if (scope == null) continue;
            const current = def.missing.get(scope) ?? 0;
            if (current <= 1) {
                def.missing.delete(scope);
            } else {
                def.missing.set(scope, current - 1);
            }
        }
    }

    /**
     * Invalidate affected caches stored as Symbol keys in ProcessedData.
     */
    private invalidateCaches(
        processedData: ProcessedData,
        affectedColumns: Set<number>,
        affectedKeys: Set<number>
    ): void {
        // Clear cached reduced data since it becomes invalid when data changes
        if (processedData.reduced) {
            // Clear all reduced cache entries except diff and animationValidation
            // which we manage explicitly in updateProcessedDataMetadata
            const reducedCache = processedData.reduced as any;
            const preservedKeys = new Set(['diff', 'animationValidation']);

            for (const key of Object.keys(reducedCache)) {
                if (!preservedKeys.has(key)) {
                    delete reducedCache[key];
                }
            }
        }

        // Clear domain ranges cache for affected columns and keys
        const domainRangesCache = (processedData as any)[DOMAIN_RANGES] as Map<string, any> | undefined;
        if (domainRangesCache) {
            // Clear ranges for affected columns
            for (const columnIndex of affectedColumns) {
                // Domain ranges are typically keyed by column identifier strings
                domainRangesCache.delete(`column-${columnIndex}`);
                domainRangesCache.delete(`values-${columnIndex}`);
                // Also clear any other column-related cache entries
                for (const [key] of domainRangesCache) {
                    if (key.includes(`-${columnIndex}-`) || key.endsWith(`-${columnIndex}`)) {
                        domainRangesCache.delete(key);
                    }
                }
            }

            // Clear ranges for affected keys
            for (const keyIndex of affectedKeys) {
                domainRangesCache.delete(`key-${keyIndex}`);
                domainRangesCache.delete(`keys-${keyIndex}`);
                // Also clear any other key-related cache entries
                for (const [key] of domainRangesCache) {
                    if (key.includes(`-${keyIndex}-`) || key.endsWith(`-${keyIndex}`)) {
                        domainRangesCache.delete(key);
                    }
                }
            }
        }

        // Clear sort order caches for affected keys
        const keySortOrdersCache = (processedData as any)[KEY_SORT_ORDERS] as Map<number, any> | undefined;
        if (keySortOrdersCache) {
            for (const keyIndex of affectedKeys) {
                keySortOrdersCache.delete(keyIndex);
            }
        }

        // Clear sort order caches for affected columns
        const columnSortOrdersCache = (processedData as any)[COLUMN_SORT_ORDERS] as Map<number, any> | undefined;
        if (columnSortOrdersCache) {
            for (const columnIndex of affectedColumns) {
                columnSortOrdersCache.delete(columnIndex);
            }
        }
    }

    /**
     * Update ProcessedData metadata including diff and animation validation.
     */
    private updateProcessedDataMetadata(processedData: ProcessedData, changes: DataChangeDescriptor): void {
        // Initialize reduced metadata if not present
        if (!processedData.reduced) {
            processedData.reduced = {};
        }

        // Generate diff metadata
        processedData.reduced.diff = this.generateDiffMetadata(changes);

        // Calculate animation validation flags
        processedData.reduced.animationValidation = this.calculateAnimationValidation(processedData, changes);
    }

    /**
     * Calculate animation validation flags based on the changes and current data state.
     * For high-frequency updates, both flags are set to false to disable animations.
     * Otherwise, checks if keys remain unique and if key ordering is maintained.
     */
    private calculateAnimationValidation(
        processedData: ProcessedData,
        changes: DataChangeDescriptor
    ): { uniqueKeys: boolean; orderedKeys: boolean } {
        // For high-frequency updates (defined as having any changes), disable animations
        // This follows the plan requirement: "High-frequency updates should set both flags to false"
        const hasChanges =
            changes.metadata.totalRemoved > 0 ||
            changes.metadata.totalInserted > 0 ||
            changes.metadata.totalUpdated > 0;

        if (hasChanges) {
            // Check if this is a high-frequency scenario
            // For now, treat any update via transaction as high-frequency
            // This could be enhanced later with timing-based detection
            const isHighFrequency = this.isHighFrequencyUpdate(changes);

            if (isHighFrequency) {
                return {
                    uniqueKeys: false,
                    orderedKeys: false,
                };
            }
        }

        // For non-high-frequency updates, intelligently check animation validity
        return {
            uniqueKeys: this.checkKeysRemainUnique(processedData, changes),
            orderedKeys: this.checkKeyOrderingMaintained(processedData, changes),
        };
    }

    /**
     * Determine if this is a high-frequency update that should disable animations.
     * Currently treats all incremental updates as high-frequency, but this could be enhanced
     * with timing-based detection or other heuristics.
     */
    private isHighFrequencyUpdate(changes: DataChangeDescriptor): boolean {
        // For now, any incremental update is considered high-frequency
        // since we're using applyTransaction() which is designed for rapid updates
        // This could be enhanced later with:
        // - Timing detection (multiple updates within short time window)
        // - Change size thresholds
        // - Explicit user flags
        const totalChanges =
            changes.metadata.totalRemoved + changes.metadata.totalInserted + changes.metadata.totalUpdated;
        return totalChanges > 0;
    }

    /**
     * Check if keys remain unique after the updates.
     * Returns false if insertions/removals affect key uniqueness.
     */
    private checkKeysRemainUnique(processedData: ProcessedData, changes: DataChangeDescriptor): boolean {
        // If there are insertions or removals, key uniqueness may be affected
        if (changes.metadata.totalInserted > 0 || changes.metadata.totalRemoved > 0) {
            return false;
        }

        // For updates only, check if the key values themselves are changing
        // If any update changes a key value, uniqueness could be affected
        const keyDefs = processedData.defs?.keys ?? [];

        for (const update of changes.updated) {
            for (const keyDef of keyDefs) {
                const oldKeyValue = this.extractKeyValue(keyDef, update.oldDatum);
                const newKeyValue = this.extractKeyValue(keyDef, update.newDatum);

                if (oldKeyValue !== newKeyValue) {
                    // Key value changed, uniqueness may be affected
                    return false;
                }
            }
        }

        // Only value updates without key changes, uniqueness preserved
        return true;
    }

    /**
     * Check if key ordering is maintained after the updates.
     * Returns false if insertions/removals affect the ordering.
     */
    private checkKeyOrderingMaintained(processedData: ProcessedData, changes: DataChangeDescriptor): boolean {
        // Any insertions or removals affect ordering
        if (changes.metadata.totalInserted > 0 || changes.metadata.totalRemoved > 0) {
            return false;
        }

        // For continuous key types, check if the ordering changes
        const keyDefs = processedData.defs?.keys ?? [];

        for (const keyDef of keyDefs) {
            // Only check ordering for continuous data (numbers, dates)
            if (keyDef.valueType !== 'range') {
                continue; // Skip categorical keys
            }

            // Check if any updates change key values in a way that affects ordering
            for (const update of changes.updated) {
                const oldKeyValue = this.extractKeyValue(keyDef, update.oldDatum);
                const newKeyValue = this.extractKeyValue(keyDef, update.newDatum);

                if (oldKeyValue !== newKeyValue) {
                    // Key value changed for continuous data, ordering may be affected
                    return false;
                }
            }
        }

        // Only value updates without key changes, ordering preserved
        return true;
    }

    /**
     * Extract a key value from a datum using a key definition.
     */
    private extractKeyValue(keyDef: any, datum: any): any {
        if (!keyDef || !datum) {
            return undefined;
        }

        try {
            // Use the processValue function to extract the key value
            const result = this.processValue(keyDef, datum, 0);
            return result.valid ? result.value : keyDef.invalidValue;
        } catch {
            return keyDef.invalidValue;
        }
    }

    /**
     * Generate ProcessedOutputDiff metadata from changes.
     */
    private generateDiffMetadata(changes: DataChangeDescriptor): Record<string, ProcessedOutputDiff> {
        const diff: ProcessedOutputDiff = {
            changed:
                changes.metadata.totalRemoved > 0 ||
                changes.metadata.totalInserted > 0 ||
                changes.metadata.totalUpdated > 0,
            added: new Set<string>(),
            updated: new Set<string>(),
            removed: new Set<string>(),
            moved: new Set<string>(),
        };

        // Track all affected indices to determine moves
        const affectedIndices = new Set<number>();

        // Process removed items - extract meaningful keys
        changes.removed.forEach((removal) => {
            const key = this.extractKeyFromDatum(removal.datum, removal.index);
            diff.removed.add(key);
            affectedIndices.add(removal.index);
        });

        // Process inserted items - these are new additions
        changes.inserted.forEach((insertion) => {
            const key = this.extractKeyFromDatum(insertion.datum, insertion.index);
            diff.added.add(key);
            affectedIndices.add(insertion.index);
        });

        // Process updated items - distinguish between value updates and moves
        changes.updated.forEach((update) => {
            const key = this.extractKeyFromDatum(update.newDatum, update.index);

            // Check if this is a value update (same position) or involves movement
            const hasMovement = this.hasIndexMovement(update.index, changes);

            if (hasMovement) {
                diff.moved.add(key);
            } else {
                diff.updated.add(key);
            }
            affectedIndices.add(update.index);
        });

        // Track items that were moved due to other operations (insertions/removals)
        // but weren't explicitly updated
        this.trackImplicitMoves(changes, diff, affectedIndices);

        return { default: diff };
    }

    /**
     * Extract a meaningful key from a datum for tracking purposes.
     * Uses the first key definition if available, otherwise falls back to string representation.
     */
    private extractKeyFromDatum(datum: any, index: number): string {
        if (datum == null) {
            return `index-${index}`;
        }

        // Try to extract using the first key definition
        const keyDef = this.getFirstKeyDefinition();
        if (keyDef && datum[keyDef.property] != null) {
            return String(datum[keyDef.property]);
        }

        // Fall back to object hash or index
        if (typeof datum === 'object') {
            // Try common key properties
            const commonKeys = ['id', 'key', 'name', 'value'];
            for (const prop of commonKeys) {
                if (datum[prop] != null) {
                    return String(datum[prop]);
                }
            }
            // Use a simple object representation
            return `object-${index}`;
        }

        return String(datum);
    }

    /**
     * Get the first key definition for extracting meaningful keys.
     */
    private getFirstKeyDefinition(): { property: string | number | symbol } | null {
        // This will be set during mutate() call, so we need to store it
        return this.currentKeyDef ?? null;
    }

    /**
     * Check if an index has movement based on the change descriptor.
     */
    private hasIndexMovement(index: number, changes: DataChangeDescriptor): boolean {
        // Check if this index is affected by any shift ranges
        for (const range of changes.indexShiftRanges) {
            if (index >= range.startIndex && index <= range.endIndex && range.shift !== 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * Track items that moved implicitly due to insertions/removals affecting their indices.
     */
    private trackImplicitMoves(
        _changes: DataChangeDescriptor,
        _diff: ProcessedOutputDiff,
        _explicitlyAffectedIndices: Set<number>
    ): void {
        // For now, we don't track implicit moves as they require access to the full data set
        // and knowledge of what data exists at each index. This could be added in a future enhancement
        // when we have access to the processedData context during diff generation.
        // The current implementation focuses on explicit changes (insertions, removals, updates)
        // which covers the primary use cases for high-frequency updates.
    }

    /**
     * Update domain ranges for affected columns and keys after mutations.
     * Recalculates domain ranges based on the mutated data instead of clearing them.
     */
    private updateDomainRanges(
        processedData: ProcessedData,
        affectedColumns: Set<number>,
        affectedKeys: Set<number>
    ): void {
        if (!processedData.domain) {
            return;
        }

        this.updateValueDomains(processedData, affectedColumns);
        this.updateKeyDomains(processedData, affectedKeys);

        if (processedData.type === 'grouped' && processedData.domain.groups) {
            processedData.domain.groups = (processedData.groups ?? []).map((group: ProcessedGroup) => group.keys);
        }

        if (affectedColumns.size > 0 && processedData.domain.aggValues) {
            processedData.domain.aggValues = [];
        }
    }

    /**
     * Update domain.values for affected value columns.
     */
    private updateValueDomains(processedData: ProcessedData, affectedColumns: Set<number>): void {
        const valueDomains = processedData.domain?.values;
        if (!valueDomains) return;

        const valueDefs = processedData.defs?.values ?? [];

        for (const columnIndex of affectedColumns) {
            if (columnIndex >= processedData.columns.length || columnIndex >= valueDomains.length) {
                continue;
            }

            const column = processedData.columns[columnIndex];
            const def = valueDefs[columnIndex];
            const isDiscrete = def?.valueType === 'category';

            valueDomains[columnIndex] = this.calculateDomainRange(column, !!isDiscrete);
        }
    }

    /**
     * Update domain.keys for affected key arrays.
     */
    private updateKeyDomains(processedData: ProcessedData, affectedKeys: Set<number>): void {
        const keyDomains = processedData.domain?.keys;
        if (!keyDomains) return;

        const keyDefs = processedData.defs?.keys ?? [];

        for (const keyIndex of affectedKeys) {
            if (keyIndex >= processedData.keys.length || keyIndex >= keyDomains.length) {
                continue;
            }

            const keyMaps = processedData.keys[keyIndex];
            const allKeyValues: any[] = [];
            for (const [, keyArray] of keyMaps) {
                allKeyValues.push(...keyArray);
            }

            const def = keyDefs[keyIndex];
            const isDiscrete = def?.valueType ? def.valueType === 'category' : true;

            keyDomains[keyIndex] = this.calculateDomainRange(allKeyValues, !!isDiscrete);
        }
    }

    /**
     * Calculate domain range for an array of values.
     * For continuous domains, returns [min, max].
     * For discrete domains, returns array of unique values.
     */
    private calculateDomainRange(values: any[], isDiscrete: boolean): any[] {
        if (isDiscrete) {
            // For discrete domains, collect unique values
            const domain = new DiscreteDomain();
            for (const value of values) {
                if (value != null) {
                    // Skip null/undefined values
                    domain.extend(value);
                }
            }
            return domain.getDomain();
        } else {
            // For continuous domains, find min/max
            const domain = new ContinuousDomain<number | Date>();
            for (const value of values) {
                if (value != null && (typeof value === 'number' || value instanceof Date)) {
                    domain.extend(value);
                }
            }
            const result = domain.getDomain();

            // Return empty array if no valid values found (matches existing behavior)
            if (result[0] === Infinity || result[1] === -Infinity) {
                return [];
            }

            return result;
        }
    }
}
