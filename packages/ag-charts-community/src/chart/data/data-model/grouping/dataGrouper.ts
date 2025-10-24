import { first } from 'ag-charts-core';

import type { DebugLogger } from '../../../../util/debug';
import type {
    ColumnBatch,
    GroupedData,
    GroupingFn,
    InternalDatumPropertyDefinition,
    MergedColumnBatch,
    ScopeId,
    UngroupedData,
} from '../../dataModelTypes';
import { DOMAIN_BANDS, SHARED_ZERO_INDICES } from '../../dataModelTypes';
import { createArray, toKeyString } from '../utils/helpers';

/**
 * DataGrouper handles grouping of extracted data into groups based on keys.
 *
 * GROUPING RESPONSIBILITIES:
 * - Groups data by key values to aggregate multiple datums
 * - Optimizes batch processing by merging compatible column batches
 * - Maintains group validity tracking across scopes
 * - Supports custom grouping functions for flexible aggregation
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
export class DataGrouper<D extends object, K extends keyof D & string> {
    constructor(
        _keys: InternalDatumPropertyDefinition<K>[],
        _groupByFn?: (data: UngroupedData<D>) => GroupingFn<D>,
        private readonly debug?: DebugLogger
    ) {}

    /**
     * Groups data by keys or custom grouping function.
     *
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
    groupData(data: UngroupedData<D>, customGroupingFn?: GroupingFn<D>): GroupedData<D> {
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

        const groups =
            allScopes.size !== 1 || customGroupingFn != null ? new Map<string, [number, Group]>() : undefined;
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
        if (this.debug?.check() && !data.optimizations) {
            data.optimizations = {};
        }
        if (this.debug?.check()) {
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

                const group = customGroupingFn?.(keys) ?? keys;
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
}
