import type { DataChangeDescriptor } from './dataChangeDescriptor';
import type { DataGroup } from './dataModel';

/**
 * Utility class for updating DataGroup membership when data changes occur.
 * Provides efficient in-place updates to group arrays, maintaining consistency
 * across group membership, indices, and scope validity.
 */
export class GroupUpdater {
    /**
     * Updates group membership when data changes occur during incremental updates.
     * Mutates the groups array in-place for performance.
     *
     * @param groups - Array of DataGroup objects to update in-place
     * @param changes - Descriptor of data changes (removals, insertions, updates)
     * @param keyExtractor - Function to extract group keys from datum objects
     *
     * Operations performed:
     * 1. Remove data from groups (remove indices, delete empty groups)
     * 2. Update group membership for changed data (move between groups)
     * 3. Add new data to appropriate groups (create new groups if needed)
     * 4. Update validScopes for partial invalidity
     * 5. Maintain index consistency across all groups
     */
    static updateGroups(groups: DataGroup[], changes: DataChangeDescriptor, keyExtractor: (datum: any) => any[]): void {
        // Step 1: Handle removed data
        GroupUpdater.handleRemovedData(groups, changes);

        // Step 2: Apply index shifts to existing indices after removals
        GroupUpdater.applyIndexShiftsAfterRemovals(groups, changes);

        // Step 3: Handle updated data (potentially moving between groups)
        GroupUpdater.handleUpdatedData(groups, changes, keyExtractor);

        // Step 4: Handle inserted data with their final indices
        GroupUpdater.handleInsertedData(groups, changes, keyExtractor);

        // Step 5: Clean up empty groups
        GroupUpdater.removeEmptyGroups(groups);

        // Step 6: Update validScopes for groups that had changes
        GroupUpdater.updateValidScopes(groups, changes);
    }

    /**
     * Remove data indices from groups and mark affected groups.
     * Uses efficient Set-based lookups for O(1) removal checks.
     * @private
     */
    private static handleRemovedData(groups: DataGroup[], changes: DataChangeDescriptor): void {
        const removedIndices = new Set(changes.removed.map((r) => r.index));

        for (const group of groups) {
            for (let scopeIdx = 0; scopeIdx < group.datumIndices.length; scopeIdx++) {
                const indices = group.datumIndices[scopeIdx];
                if (!indices) continue;

                // For large groups, use efficient filtering instead of repeated splicing
                if (indices.length > 100) {
                    // Filter approach is more efficient for large arrays
                    const filteredIndices = indices.filter((index) => !removedIndices.has(index));
                    group.datumIndices[scopeIdx] = filteredIndices;
                } else {
                    // For smaller groups, continue using splice in reverse order
                    for (let i = indices.length - 1; i >= 0; i--) {
                        if (removedIndices.has(indices[i])) {
                            indices.splice(i, 1);
                        }
                    }
                }
            }
        }
    }

    /**
     * Handle updated data that may need to move between groups.
     * @private
     */
    private static handleUpdatedData(
        groups: DataGroup[],
        changes: DataChangeDescriptor,
        keyExtractor: (datum: any) => any[]
    ): void {
        const removedIndices = changes.removed.map((r) => r.index).sort((a, b) => a - b);

        for (const update of changes.updated) {
            const oldKeys = keyExtractor(update.oldDatum);
            const newKeys = keyExtractor(update.newDatum);

            // Calculate the shifted index for this update (accounting for removals)
            let shift = 0;
            for (const removedIndex of removedIndices) {
                if (removedIndex < update.index) {
                    shift++;
                } else {
                    break;
                }
            }
            const shiftedIndex = update.index - shift;

            // Check if group membership changed
            if (!GroupUpdater.keysEqual(oldKeys, newKeys)) {
                // Remove from old group (using shifted index)
                GroupUpdater.removeFromGroups(groups, shiftedIndex);

                // Add to new group (using shifted index)
                GroupUpdater.addToGroup(groups, shiftedIndex, newKeys);
            }
            // If keys are the same, no group membership change needed
        }
    }

    /**
     * Add new data to appropriate groups, creating groups if necessary.
     * @private
     */
    private static handleInsertedData(
        groups: DataGroup[],
        changes: DataChangeDescriptor,
        keyExtractor: (datum: any) => any[]
    ): void {
        for (const insertion of changes.inserted) {
            const keys = keyExtractor(insertion.datum);
            GroupUpdater.addToGroup(groups, insertion.index, keys);
        }
    }

    /**
     * Apply index shifts to all group indices to account for removals.
     * Uses optimized algorithms for different group sizes and leverages
     * pre-computed shift ranges when available.
     * @private
     */
    private static applyIndexShiftsAfterRemovals(groups: DataGroup[], changes: DataChangeDescriptor): void {
        const removedIndices = changes.removed.map((r) => r.index).sort((a, b) => a - b);

        // Early exit if no removals
        if (removedIndices.length === 0) {
            return;
        }

        for (const group of groups) {
            for (const indices of group.datumIndices) {
                if (!indices || indices.length === 0) continue;

                // Use different strategies based on array size
                if (indices.length > 1000 && removedIndices.length > 10) {
                    // For very large groups with many removals, use binary search approach
                    GroupUpdater.applyShiftsWithBinarySearch(indices, removedIndices);
                } else if (indices.length > 100) {
                    // For moderately large groups, use the optimized linear approach
                    GroupUpdater.applyShiftsOptimized(indices, removedIndices);
                } else {
                    // For small groups, use the simple approach
                    GroupUpdater.applyShiftsSimple(indices, removedIndices);
                }

                // Indices should already be sorted from the optimization methods,
                // but verify for smaller arrays where sort overhead is minimal
                if (indices.length <= 100) {
                    indices.sort((a, b) => a - b);
                }
            }
        }
    }

    /**
     * Apply shifts using binary search for very large arrays.
     * @private
     */
    private static applyShiftsWithBinarySearch(indices: number[], removedIndices: number[]): void {
        for (let i = 0; i < indices.length; i++) {
            const currentIndex = indices[i];

            // Binary search to find how many removed indices are before currentIndex
            let left = 0;
            let right = removedIndices.length;

            while (left < right) {
                const mid = Math.floor((left + right) / 2);
                if (removedIndices[mid] < currentIndex) {
                    left = mid + 1;
                } else {
                    right = mid;
                }
            }

            indices[i] = currentIndex - left;
        }

        // Keep sorted (binary search approach may not preserve order)
        indices.sort((a, b) => a - b);
    }

    /**
     * Apply shifts using optimized linear scan for moderately large arrays.
     * @private
     */
    private static applyShiftsOptimized(indices: number[], removedIndices: number[]): void {
        let removeIdx = 0;
        let currentShift = 0;

        // Process indices in order, updating shift as we encounter removal points
        for (let i = 0; i < indices.length; i++) {
            const currentIndex = indices[i];

            // Update shift count as we pass removal indices
            while (removeIdx < removedIndices.length && removedIndices[removeIdx] < currentIndex) {
                currentShift++;
                removeIdx++;
            }

            indices[i] = currentIndex - currentShift;
        }

        // Indices remain sorted since we process in order
    }

    /**
     * Apply shifts using simple approach for small arrays.
     * @private
     */
    private static applyShiftsSimple(indices: number[], removedIndices: number[]): void {
        for (let i = 0; i < indices.length; i++) {
            const currentIndex = indices[i];
            let shift = 0;

            // Count how many removed indices are before this index
            for (const removedIndex of removedIndices) {
                if (removedIndex < currentIndex) {
                    shift++;
                } else {
                    break; // removedIndices is sorted, so no more will be < currentIndex
                }
            }

            indices[i] = currentIndex - shift;
        }
    }

    /**
     * Remove empty groups from the groups array.
     * @private
     */
    private static removeEmptyGroups(groups: DataGroup[]): void {
        for (let i = groups.length - 1; i >= 0; i--) {
            const group = groups[i];
            const hasData = group.datumIndices.some((indices) => indices && indices.length > 0);

            if (!hasData) {
                groups.splice(i, 1);
            }
        }
    }

    /**
     * Update validScopes for groups that were affected by changes.
     * For now, we mark all groups as requiring validation since determining
     * exactly which scopes were affected is complex.
     * @private
     */
    private static updateValidScopes(groups: DataGroup[], changes: DataChangeDescriptor): void {
        // For incremental updates, we need to be conservative about scope validity
        // Since we don't have perfect tracking of which scopes were affected,
        // we clear validScopes for all groups that have changes
        const hasChanges =
            changes.metadata.totalRemoved > 0 ||
            changes.metadata.totalInserted > 0 ||
            changes.metadata.totalUpdated > 0;

        if (hasChanges) {
            for (const group of groups) {
                // Clear validScopes to force revalidation
                group.validScopes.clear();
            }
        }
    }

    /**
     * Remove a specific index from all groups.
     * Uses optimized approach for different group sizes.
     * @private
     */
    private static removeFromGroups(groups: DataGroup[], indexToRemove: number): void {
        for (const group of groups) {
            for (let scopeIdx = 0; scopeIdx < group.datumIndices.length; scopeIdx++) {
                const indices = group.datumIndices[scopeIdx];
                if (!indices) continue;

                if (indices.length > 100) {
                    // For large groups, use filter for better performance
                    const filtered = indices.filter((index) => index !== indexToRemove);
                    if (filtered.length !== indices.length) {
                        group.datumIndices[scopeIdx] = filtered;
                    }
                } else {
                    // For small groups, use indexOf + splice
                    const removeIdx = indices.indexOf(indexToRemove);
                    if (removeIdx !== -1) {
                        indices.splice(removeIdx, 1);
                    }
                }
            }
        }
    }

    /**
     * Add an index to the appropriate group, creating the group if necessary.
     * Uses efficient insertion to maintain sorted order without full sorting.
     * @private
     */
    private static addToGroup(groups: DataGroup[], index: number, keys: any[]): void {
        // Find existing group with matching keys
        let targetGroup = groups.find((group) => GroupUpdater.keysEqual(group.keys, keys));

        if (!targetGroup) {
            // Create new group
            targetGroup = {
                keys: [...keys],
                datumIndices: [],
                aggregation: [],
                validScopes: new Set(),
            };
            groups.push(targetGroup);
        }

        // Add index to first scope column (assuming single-scope for now)
        // This is a simplification for the current implementation
        if (targetGroup.datumIndices.length === 0) {
            targetGroup.datumIndices.push([]);
        }

        // Add to the first scope's indices with efficient insertion
        const firstScopeIndices = targetGroup.datumIndices[0];
        if (!firstScopeIndices.includes(index)) {
            GroupUpdater.insertSorted(firstScopeIndices, index);
        }
    }

    /**
     * Insert an index into a sorted array, maintaining sort order.
     * Uses binary search for large arrays, linear insertion for small arrays.
     * @private
     */
    private static insertSorted(sortedArray: number[], value: number): void {
        if (sortedArray.length === 0) {
            sortedArray.push(value);
            return;
        }

        if (sortedArray.length < 50) {
            // For small arrays, use simple linear insertion
            let insertIndex = 0;
            while (insertIndex < sortedArray.length && sortedArray[insertIndex] < value) {
                insertIndex++;
            }
            sortedArray.splice(insertIndex, 0, value);
        } else {
            // For larger arrays, use binary search to find insertion point
            let left = 0;
            let right = sortedArray.length;

            while (left < right) {
                const mid = Math.floor((left + right) / 2);
                if (sortedArray[mid] < value) {
                    left = mid + 1;
                } else {
                    right = mid;
                }
            }

            sortedArray.splice(left, 0, value);
        }
    }

    /**
     * Compare two key arrays for equality.
     * @private
     */
    private static keysEqual(keys1: any[], keys2: any[]): boolean {
        if (keys1.length !== keys2.length) {
            return false;
        }

        for (let i = 0; i < keys1.length; i++) {
            if (keys1[i] !== keys2[i]) {
                // For object keys, do a deep comparison
                if (
                    typeof keys1[i] === 'object' &&
                    typeof keys2[i] === 'object' &&
                    keys1[i] != null &&
                    keys2[i] != null
                ) {
                    if (JSON.stringify(keys1[i]) !== JSON.stringify(keys2[i])) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }

        return true;
    }
}
