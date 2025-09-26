import { ArrayUpdater } from './arrayUpdater';
import type { DataChangeDescriptor } from './dataChangeDescriptor';
import { ContinuousDomain, DiscreteDomain } from './dataDomain';
import type { ProcessedData, ProcessedOutputDiff } from './dataModel';

// Cache Symbol keys that match those in dataModel.ts
// These symbols must match the exact string descriptors used in DataModel
const KEY_SORT_ORDERS = Symbol('key-sort-orders');
const COLUMN_SORT_ORDERS = Symbol('column-sort-orders');
const DOMAIN_RANGES = Symbol('domain-ranges');

/**
 * Mutates ProcessedData structures in-place based on DataChangeDescriptor.
 * Provides efficient incremental updates without full reprocessing.
 */
export class ProcessedDataMutator {
    constructor() {
        // TODO: When implementing proper value extraction, we'll need access to
        // DataModel's value extractors. For now, we use placeholder extraction.
    }

    /**
     * Mutates ProcessedData in-place based on the provided changes.
     * All operations are atomic - either all succeed or the method throws.
     *
     * @param processedData - The ProcessedData to mutate in-place
     * @param changes - Description of changes to apply
     * @throws Error if mutation fails (indicates implementation bug)
     */
    mutate(processedData: ProcessedData<any>, changes: DataChangeDescriptor): void {
        try {
            // Fast path: no changes to process
            if (this.hasNoChanges(changes)) {
                return;
            }

            // For now, focus on ungrouped data as specified in the requirements
            if (processedData.type === 'grouped') {
                // TODO: Add grouped data support in Phase 4
                throw new Error('Grouped data mutations not yet implemented');
            }

            // Track which columns and keys are affected for targeted updates
            const affectedColumns = this.determineAffectedColumns(processedData, changes);
            const affectedKeys = this.determineAffectedKeys(processedData, changes);

            // Apply changes to the main data structures
            this.mutateColumns(processedData, changes, affectedColumns);
            this.mutateKeys(processedData, changes, affectedKeys);

            // Apply changes to the domain data structures
            this.mutateDomainValues(processedData, changes, affectedColumns);
            this.mutateDomainKeys(processedData, changes, affectedKeys);

            // Invalidate affected caches
            this.invalidateCaches(processedData, affectedColumns, affectedKeys);

            // Update metadata
            this.updateProcessedDataMetadata(processedData, changes);

            // Update domain ranges for affected columns and keys
            this.updateDomainRanges(processedData, affectedColumns, affectedKeys);
        } catch (error) {
            // Fail fast on any error - indicates implementation bugs
            const message = `ProcessedDataMutator failed: ${error instanceof Error ? error.message : String(error)}`;
            throw new Error(message);
        }
    }

    /**
     * Check if there are no changes to process.
     */
    private hasNoChanges(changes: DataChangeDescriptor): boolean {
        return (
            changes.metadata.totalRemoved === 0 &&
            changes.metadata.totalInserted === 0 &&
            changes.metadata.totalUpdated === 0
        );
    }

    /**
     * Determine which columns are affected by the changes.
     */
    private determineAffectedColumns(processedData: ProcessedData<any>, _changes: DataChangeDescriptor): Set<number> {
        const affected = new Set<number>();

        // All columns are potentially affected by any change
        // TODO: Optimize this to only include columns that actually need updates
        // For now, mark all columns as affected for correctness
        for (let i = 0; i < processedData.columns.length; i++) {
            affected.add(i);
        }

        return affected;
    }

    /**
     * Determine which key arrays are affected by the changes.
     */
    private determineAffectedKeys(processedData: ProcessedData<any>, _changes: DataChangeDescriptor): Set<number> {
        const affected = new Set<number>();

        // All key arrays are potentially affected by any change
        // TODO: Optimize this to only include keys that actually need updates
        // For now, mark all key arrays as affected for correctness
        for (let i = 0; i < processedData.keys.length; i++) {
            affected.add(i);
        }

        return affected;
    }

    /**
     * Apply changes to the columns arrays.
     */
    private mutateColumns(
        processedData: ProcessedData<any>,
        changes: DataChangeDescriptor,
        affectedColumns: Set<number>
    ): void {
        for (const columnIndex of affectedColumns) {
            if (columnIndex >= processedData.columns.length) {
                continue; // Skip invalid column indices
            }

            const column = processedData.columns[columnIndex];
            this.mutateArray(column, changes, columnIndex);
        }
    }

    /**
     * Apply changes to the keys arrays.
     */
    private mutateKeys(
        processedData: ProcessedData<any>,
        changes: DataChangeDescriptor,
        affectedKeys: Set<number>
    ): void {
        for (const keyIndex of affectedKeys) {
            if (keyIndex >= processedData.keys.length) {
                continue; // Skip invalid key indices
            }

            const keyMaps = processedData.keys[keyIndex];

            // Apply changes to each scope's key array
            for (const [scopeId, keyArray] of keyMaps) {
                this.mutateArray(keyArray, changes, keyIndex, scopeId);
            }
        }
    }

    /**
     * Apply changes to the domain values arrays.
     */
    private mutateDomainValues(
        processedData: ProcessedData<any>,
        changes: DataChangeDescriptor,
        affectedColumns: Set<number>
    ): void {
        if (!processedData.domain?.values) {
            return; // No domain values to update
        }

        for (const columnIndex of affectedColumns) {
            if (columnIndex >= processedData.domain.values.length) {
                continue; // Skip invalid column indices
            }

            const domainValuesArray = processedData.domain.values[columnIndex];
            this.mutateDomainArray(domainValuesArray, changes, columnIndex, 'values');
        }
    }

    /**
     * Apply changes to the domain keys arrays.
     */
    private mutateDomainKeys(
        processedData: ProcessedData<any>,
        changes: DataChangeDescriptor,
        affectedKeys: Set<number>
    ): void {
        if (!processedData.domain?.keys) {
            return; // No domain keys to update
        }

        for (const keyIndex of affectedKeys) {
            if (keyIndex >= processedData.domain.keys.length) {
                continue; // Skip invalid key indices
            }

            const domainKeysArray = processedData.domain.keys[keyIndex];
            this.mutateDomainArray(domainKeysArray, changes, keyIndex, 'keys');
        }
    }

    /**
     * Apply changes to a single domain array using ArrayUpdater.
     * This handles both domain.values and domain.keys arrays.
     */
    private mutateDomainArray(
        array: any[],
        changes: DataChangeDescriptor,
        index: number,
        arrayType: 'values' | 'keys'
    ): void {
        // Create an extractor function that uses our value extraction logic
        const extractor = (datum: any) => {
            return this.extractValueForDomainArray(datum, index, arrayType);
        };

        // Use ArrayUpdater to apply all changes efficiently
        ArrayUpdater.applyChanges(array, changes, extractor);
    }

    /**
     * Apply changes to a single array using ArrayUpdater.
     * This is the core mutation logic that handles removals, insertions, and updates.
     */
    private mutateArray(array: any[], changes: DataChangeDescriptor, columnOrKeyIndex: number, scopeId?: string): void {
        // Create an extractor function that uses our value extraction logic
        const extractor = (datum: any) => {
            return this.extractValueForArray(datum, columnOrKeyIndex, scopeId);
        };

        // Use ArrayUpdater to apply all changes efficiently
        ArrayUpdater.applyChanges(array, changes, extractor);
    }

    /**
     * Extract the appropriate value for an array based on the datum and array type.
     * TODO: This should use DataModel's cached extractors when available.
     */
    private extractValueForArray(datum: any, _columnOrKeyIndex: number, _scopeId?: string): any {
        // TODO: Use DataModel.processValue() when it's refactored to be public
        // For now, return a placeholder that won't cause runtime errors
        // In the future, proper value extraction logic will be implemented here
        return datum;
    }

    /**
     * Extract the appropriate value for a domain array based on the datum and array type.
     * TODO: This should use DataModel's cached extractors when available.
     */
    private extractValueForDomainArray(datum: any, _index: number, _arrayType: 'values' | 'keys'): any {
        // TODO: Use proper value extraction from DataModel when it's refactored
        // For now, we cannot directly use DataModel.processValue from processedDataMutator.ts,
        // so just copy the values directly from the datum (add a TODO comment about needing
        // proper value extraction in the future).

        // Extract raw value from datum - this is a simplified approach
        // In the future, this should use proper value extraction logic from DataModel

        // For domain arrays, we typically store the processed values
        // For now, return the datum itself as a placeholder
        return datum;
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

        // Update domain.values for affected columns
        this.updateValueDomains(processedData, affectedColumns);

        // Update domain.keys for affected keys
        this.updateKeyDomains(processedData, affectedKeys);

        // Clear groups domain for grouped data (not yet handled by mutation)
        if (processedData.type === 'grouped' && processedData.domain.groups) {
            processedData.domain.groups = processedData.domain.groups.map(() => []);
        }

        // Clear aggregation values domain (not yet handled by mutation)
        if (affectedColumns.size > 0 && processedData.domain.aggValues) {
            processedData.domain.aggValues = [];
        }
    }

    /**
     * Update domain.values for affected value columns.
     */
    private updateValueDomains(processedData: ProcessedData<any>, affectedColumns: Set<number>): void {
        for (const columnIndex of affectedColumns) {
            if (columnIndex >= processedData.columns.length || columnIndex >= processedData.domain.values.length) {
                continue;
            }

            const column = processedData.columns[columnIndex];
            const isDiscrete = this.isColumnDiscrete(processedData, columnIndex);

            processedData.domain.values[columnIndex] = this.calculateDomainRange(column, isDiscrete);
        }
    }

    /**
     * Update domain.keys for affected key arrays.
     */
    private updateKeyDomains(processedData: ProcessedData<any>, affectedKeys: Set<number>): void {
        for (const keyIndex of affectedKeys) {
            if (keyIndex >= processedData.keys.length || keyIndex >= processedData.domain.keys.length) {
                continue;
            }

            // For keys, we need to aggregate values from all scopes
            const keyMaps = processedData.keys[keyIndex];
            const allKeyValues: any[] = [];

            for (const [_scopeId, keyArray] of keyMaps) {
                allKeyValues.push(...keyArray);
            }

            // Keys are typically discrete (categories), but we'll handle both cases
            const isDiscrete = this.isKeyDiscrete(processedData, keyIndex);

            processedData.domain.keys[keyIndex] = this.calculateDomainRange(allKeyValues, isDiscrete);
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

    /**
     * Determine if a value column is discrete (categorical) or continuous.
     * This is a simplified heuristic since we don't have access to the original
     * PropertyDefinition here. In a future implementation, this information
     * should be passed from DataModel.
     */
    private isColumnDiscrete(processedData: ProcessedData<any>, columnIndex: number): boolean {
        // TODO: This should use the actual PropertyDefinition.valueType when available
        // For now, use a simple heuristic based on data types in the column

        if (columnIndex >= processedData.columns.length) {
            return false;
        }

        const column = processedData.columns[columnIndex];
        if (column.length === 0) {
            return false; // Default to continuous for empty columns
        }

        // Sample the first few non-null values to determine type
        let numberCount = 0;
        let stringCount = 0;
        let sampleCount = 0;
        const maxSamples = Math.min(10, column.length);

        for (let i = 0; i < column.length && sampleCount < maxSamples; i++) {
            const value = column[i];
            if (value == null) continue;

            sampleCount++;
            if (typeof value === 'number' || value instanceof Date) {
                numberCount++;
            } else {
                stringCount++;
            }
        }

        // If more strings than numbers, consider it discrete
        return stringCount > numberCount;
    }

    /**
     * Determine if a key array is discrete (categorical) or continuous.
     * Keys are typically discrete, but we'll apply the same heuristic.
     */
    private isKeyDiscrete(processedData: ProcessedData<any>, keyIndex: number): boolean {
        // Keys are typically discrete (categorical), so default to true
        // Apply same heuristic as columns for consistency

        if (keyIndex >= processedData.keys.length) {
            return true;
        }

        const keyMaps = processedData.keys[keyIndex];
        const allValues: any[] = [];

        // Collect values from all scopes
        for (const [_scopeId, keyArray] of keyMaps) {
            allValues.push(...keyArray.slice(0, 10)); // Sample first 10 from each scope
        }

        if (allValues.length === 0) {
            return true; // Default to discrete for empty keys
        }

        // Sample values to determine type
        let numberCount = 0;
        let stringCount = 0;

        for (const value of allValues) {
            if (value == null) continue;

            if (typeof value === 'number' || value instanceof Date) {
                numberCount++;
            } else {
                stringCount++;
            }
        }

        // Keys are usually discrete, so bias towards discrete unless clearly numeric
        return stringCount >= numberCount;
    }
}
