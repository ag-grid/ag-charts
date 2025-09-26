import { ArrayUpdater } from './arrayUpdater';
import type { DataChangeDescriptor } from './dataChangeDescriptor';
import { ContinuousDomain, DiscreteDomain, type IDataDomain } from './dataDomain';
import type { ProcessedData, ProcessedOutputDiff } from './dataModel';

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
 */
export class ProcessedDataMutator {
    private readonly processValue: ProcessValueFn;
    private readonly accessors: Map<string, (d: any) => any>;

    constructor(options: ProcessedDataMutatorOptions) {
        if (!options || typeof options.processValue !== 'function') {
            throw new Error('ProcessedDataMutator requires a processValue implementation');
        }

        this.processValue = options.processValue;
        this.accessors = options.accessors ?? new Map();
    }

    mutate(processedData: ProcessedData<any>, changes: DataChangeDescriptor): void {
        try {
            if (this.hasNoChanges(changes)) {
                return;
            }

            if (processedData.type === 'grouped') {
                throw new Error('Grouped data mutations not yet implemented');
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
        processedData: ProcessedData<any>,
        changes: DataChangeDescriptor
    ): { affectedColumns: Set<number>; affectedKeys: Set<number> } {
        const scopeId = this.getSingleScope(processedData);
        const keyDefs = processedData.defs?.keys ?? [];
        const valueDefs = processedData.defs?.values ?? [];

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

    private getSingleScope(processedData: ProcessedData<any>): string {
        const iterator = processedData.scopes.values();
        const { value, done } = iterator.next();
        if (done || iterator.next().done === false) {
            throw new Error('Incremental updates currently support single-scope data only');
        }
        return value as string;
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

        for (let keyIndex = 0; keyIndex < keyDefs.length; keyIndex++) {
            this.computeKeyResult(keyDefs[keyIndex], datum, index, scopeId, false);
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
        processedData: ProcessedData<any>,
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
    private updateProcessedDataMetadata(processedData: ProcessedData<any>, changes: DataChangeDescriptor): void {
        // Initialize reduced metadata if not present
        if (!processedData.reduced) {
            processedData.reduced = {};
        }

        // Generate diff metadata
        processedData.reduced.diff = this.generateDiffMetadata(changes);

        // Disable animations for high-frequency updates
        processedData.reduced.animationValidation = {
            uniqueKeys: false,
            orderedKeys: false,
        };
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

        // Add keys for inserted data
        changes.inserted.forEach((_insertion, idx) => {
            diff.added.add(`inserted-${idx}`);
        });

        // Add keys for updated data
        changes.updated.forEach((_update, idx) => {
            diff.updated.add(`updated-${idx}`);
        });

        // Add keys for removed data
        changes.removed.forEach((_removal, idx) => {
            diff.removed.add(`removed-${idx}`);
        });

        // TODO: Implement proper key tracking for more accurate diff metadata
        // For now, use simple index-based keys

        return { default: diff };
    }

    /**
     * Update domain ranges for affected columns and keys after mutations.
     * Recalculates domain ranges based on the mutated data instead of clearing them.
     */
    private updateDomainRanges(
        processedData: ProcessedData<any>,
        affectedColumns: Set<number>,
        affectedKeys: Set<number>
    ): void {
        if (!processedData.domain) {
            return;
        }

        this.updateValueDomains(processedData, affectedColumns);
        this.updateKeyDomains(processedData, affectedKeys);

        if (processedData.type === 'grouped' && processedData.domain.groups) {
            processedData.domain.groups = processedData.domain.groups.map(() => []);
        }

        if (affectedColumns.size > 0 && processedData.domain.aggValues) {
            processedData.domain.aggValues = [];
        }
    }

    /**
     * Update domain.values for affected value columns.
     */
    private updateValueDomains(processedData: ProcessedData<any>, affectedColumns: Set<number>): void {
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
    private updateKeyDomains(processedData: ProcessedData<any>, affectedKeys: Set<number>): void {
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
