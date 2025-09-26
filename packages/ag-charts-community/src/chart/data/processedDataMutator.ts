import type { DataChangeDescriptor } from './dataChangeDescriptor';
import type { DataModel, ProcessedData, ProcessedOutputDiff } from './dataModel';

// Cache Symbol keys from dataModel.ts - we can't access them directly
// so we'll skip cache invalidation for now and add TODO for proper implementation

/**
 * Mutates ProcessedData structures in-place based on DataChangeDescriptor.
 * Provides efficient incremental updates without full reprocessing.
 */
export class ProcessedDataMutator {
    private readonly dataModel: DataModel<any>;

    constructor(dataModel: DataModel<any>) {
        this.dataModel = dataModel;
        // TODO: Use dataModel for value extraction when implementing proper extractor logic
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

            // Invalidate affected caches
            this.invalidateCaches(processedData, affectedColumns, affectedKeys);

            // Update metadata
            this.updateProcessedDataMetadata(processedData, changes);

            // Clear affected domain entries
            this.clearAffectedDomains(processedData, affectedColumns, affectedKeys);
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
     * Apply changes to a single array using splice operations.
     * This is the core mutation logic that handles removals, insertions, and updates.
     */
    private mutateArray(array: any[], changes: DataChangeDescriptor, columnOrKeyIndex: number, scopeId?: string): void {
        // TODO: Use ArrayUpdater when it's implemented in Phase 3
        // For now, implement basic splice-based operations

        // Apply removals first (in reverse order to maintain index stability)
        const sortedRemovals = [...changes.removed].sort((a, b) => b.index - a.index);
        for (const removal of sortedRemovals) {
            if (removal.index < array.length) {
                array.splice(removal.index, 1);
            }
        }

        // Apply insertions (in forward order)
        const sortedInsertions = [...changes.inserted].sort((a, b) => a.index - b.index);
        for (const insertion of sortedInsertions) {
            // TODO: Extract proper value using DataModel extractors
            // For now, use placeholder value
            const extractedValue = this.extractValueForArray(insertion.datum, columnOrKeyIndex, scopeId);

            if (insertion.index <= array.length) {
                array.splice(insertion.index, 0, extractedValue);
            }
        }

        // Apply updates (can be in any order since indices don't shift)
        for (const update of changes.updated) {
            if (update.index < array.length) {
                // TODO: Extract proper value using DataModel extractors
                const extractedValue = this.extractValueForArray(update.newDatum, columnOrKeyIndex, scopeId);
                array[update.index] = extractedValue;
            }
        }
    }

    /**
     * Extract the appropriate value for an array based on the datum and array type.
     * TODO: This should use DataModel's cached extractors when available.
     */
    private extractValueForArray(datum: any, _columnOrKeyIndex: number, _scopeId?: string): any {
        // TODO: Use this.dataModel.processValue() when it's refactored to be public
        // For now, return a placeholder that won't cause runtime errors
        // dataModel will be used for value extraction in future implementation
        this.dataModel; // Reference to prevent unused variable warning
        return datum ?? null;
    }

    /**
     * Invalidate affected caches stored as Symbol keys in ProcessedData.
     */
    private invalidateCaches(
        processedData: ProcessedData<any>,
        affectedColumns: Set<number>,
        affectedKeys: Set<number>
    ): void {
        // TODO: Implement proper cache invalidation when Symbol keys are accessible
        // For now, we skip cache invalidation since we can't access the Symbol keys
        // from dataModel.ts. This will be addressed when we refactor to expose
        // cache management methods from DataModel.

        // The cache invalidation should clear:
        // - processedData[DOMAIN_RANGES] for affected columns
        // - processedData[KEY_SORT_ORDERS] for affected keys
        // - processedData[COLUMN_SORT_ORDERS] for affected columns

        // Prevent unused parameter warnings - parameters will be used in future implementation
        processedData;
        affectedColumns;
        affectedKeys;
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
     * Clear affected entries in processedData.domain.
     */
    private clearAffectedDomains(
        processedData: ProcessedData<any>,
        affectedColumns: Set<number>,
        affectedKeys: Set<number>
    ): void {
        // TODO: Use DomainUpdater when it's implemented in Phase 3
        // For now, just clear the entire domain to force recalculation

        if (processedData.domain) {
            // Clear keys domain if any keys are affected
            if (affectedKeys.size > 0 && processedData.domain.keys) {
                processedData.domain.keys = processedData.domain.keys.map(() => []);
            }

            // Clear values domain if any columns are affected
            if (affectedColumns.size > 0 && processedData.domain.values) {
                processedData.domain.values = processedData.domain.values.map(() => []);
            }

            // Clear groups domain for grouped data
            if (processedData.type === 'grouped' && processedData.domain.groups) {
                processedData.domain.groups = processedData.domain.groups.map(() => []);
            }

            // Clear aggregation values domain
            if (affectedColumns.size > 0 && processedData.domain.aggValues) {
                processedData.domain.aggValues = [];
            }
        }
    }
}
