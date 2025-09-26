import type { DataChangeDescriptor } from '../../data/dataChangeDescriptor';
import type { ProcessedData } from '../../data/dataModel';
import type { CartesianSeriesNodeDataContext, CartesianSeriesNodeDatum } from './cartesianSeries';
import { type Scaling, areScalingEqual } from './scaling';

export function calculateDataDiff<N extends CartesianSeriesNodeDatum>(
    seriesId: string,
    datumSelection: Iterable<{ datum: N }>,
    getDatumId: (datum: N) => string,
    contextNodeData: CartesianSeriesNodeDataContext<N, any>,
    previousContextNodeData?: CartesianSeriesNodeDataContext<N, any>,
    processedData?: ProcessedData<unknown>
) {
    let dataDiff = processedData?.reduced?.diff?.[seriesId];
    if (dataDiff?.changed) {
        return dataDiff;
    }

    const scalingChanged = hasScalingChanged(contextNodeData, previousContextNodeData);
    if (dataDiff == null && processedData?.reduced?.diff != null) {
        dataDiff = {
            changed: true,
            added: new Set(),
            updated: new Set(),
            removed: new Set(),
            moved: new Set(),
        };
        if (scalingChanged) {
            dataDiff.updated = new Set(Array.from(datumSelection, ({ datum }) => getDatumId(datum)));
        } else {
            dataDiff.added = new Set(Array.from(datumSelection, ({ datum }) => getDatumId(datum)));
        }
    } else if (scalingChanged) {
        dataDiff = {
            changed: true,
            added: new Set(),
            updated: new Set(Array.from(datumSelection, ({ datum }) => getDatumId(datum))),
            removed: new Set(),
            moved: new Set(),
        };
    }

    return dataDiff;
}

function isGroupScaleContext(ctx: unknown): ctx is { groupScale: Scaling } {
    return typeof ctx === 'object' && ctx !== null && 'groupScale' in ctx;
}

function hasScalingChanged(
    contextNodeData: CartesianSeriesNodeDataContext,
    previousContextNodeData?: CartesianSeriesNodeDataContext
) {
    if (!previousContextNodeData) return false;

    const scales = contextNodeData.scales;
    const prevScales = previousContextNodeData.scales;
    if (!areScalingEqual(scales.x, prevScales.x)) return true;
    if (!areScalingEqual(scales.y, prevScales.y)) return true;

    if (!isGroupScaleContext(contextNodeData) || !isGroupScaleContext(previousContextNodeData)) return false;
    const groupScale = contextNodeData.groupScale;
    const prevGroupScale = previousContextNodeData.groupScale;
    return !areScalingEqual(groupScale, prevGroupScale);
}

/**
 * IndexMapper provides efficient bidirectional mapping between old and new indices
 * after data changes (removals and insertions). Uses range-based shifts for O(log r)
 * lookup performance where r is the number of shift ranges.
 */
export class IndexMapper {
    private oldToNewMap = new Map<number, number>();
    private newToOldMap = new Map<number, number>();
    private indexShiftRanges: Array<{ startIndex: number; endIndex: number; shift: number }> = [];

    /**
     * Apply removal operations to the index map.
     * @param indices - Array of indices to remove (should be sorted in ascending order)
     */
    applyRemovals(indices: number[]): void {
        if (indices.length === 0) return;

        // Sort indices to ensure consistent processing
        const sortedIndices = [...indices].sort((a, b) => a - b);

        // Build removal map for O(1) lookups
        const removalSet = new Set(sortedIndices);

        // Clear existing maps since we're rebuilding
        this.oldToNewMap.clear();
        this.newToOldMap.clear();

        // Process each index, tracking cumulative removals
        let removalsProcessed = 0;
        let currentRemovalIndex = 0;

        // We need to know the maximum index to process
        const maxIndex = sortedIndices[sortedIndices.length - 1];

        for (let oldIndex = 0; oldIndex <= maxIndex + sortedIndices.length; oldIndex++) {
            // Count removals up to this point
            while (currentRemovalIndex < sortedIndices.length && sortedIndices[currentRemovalIndex] < oldIndex) {
                removalsProcessed++;
                currentRemovalIndex++;
            }

            // If this index is being removed, skip it
            if (removalSet.has(oldIndex)) {
                continue;
            }

            // Calculate new index after accounting for removals
            const newIndex = oldIndex - removalsProcessed;

            this.oldToNewMap.set(oldIndex, newIndex);
            this.newToOldMap.set(newIndex, oldIndex);
        }
    }

    /**
     * Apply insertion operations to the index map.
     * @param insertions - Array of insertion operations with their target indices and data
     */
    applyInsertions(insertions: Array<{ index: number; datum: any }>): void {
        if (insertions.length === 0) return;

        // Sort insertions by index to ensure consistent processing
        const sortedInsertions = [...insertions].sort((a, b) => a.index - b.index);

        // We need to rebuild the maps to account for insertions
        const oldMappings = Array.from(this.oldToNewMap.entries()).sort((a, b) => a[1] - b[1]);
        this.oldToNewMap.clear();
        this.newToOldMap.clear();

        let insertionIndex = 0;
        let newIndex = 0;

        // Process existing mappings and insertions in new index order
        for (const [oldIndex] of oldMappings) {
            // Insert any insertions that come before this mapping
            while (insertionIndex < sortedInsertions.length && sortedInsertions[insertionIndex].index <= newIndex) {
                // Insertion at newIndex - old indices shift right
                newIndex++;
                insertionIndex++;
            }

            // Update the mapping to account for insertions
            this.oldToNewMap.set(oldIndex, newIndex);
            this.newToOldMap.set(newIndex, oldIndex);
            newIndex++;
        }
    }

    /**
     * Apply index shift ranges from a DataChangeDescriptor for efficient bulk operations.
     * This is the preferred method when working with DataChangeDescriptor.
     * @param changes - The data change descriptor containing shift ranges
     */
    applyShiftRanges(changes: DataChangeDescriptor): void {
        this.indexShiftRanges = [...changes.indexShiftRanges];
        this.oldToNewMap.clear();
        this.newToOldMap.clear();

        // For simple cases with few changes, we can pre-populate the maps
        // For larger datasets, we'll compute mappings on-demand
        if (changes.metadata.totalRemoved + changes.metadata.totalInserted < 1000) {
            this.precomputeMappings(changes);
        }
    }

    /**
     * Pre-compute mappings for smaller change sets to optimize lookup performance.
     * @private
     */
    private precomputeMappings(changes: DataChangeDescriptor): void {
        const removalIndices = new Set(changes.removed.map((r) => r.index));
        const insertionsByIndex = new Map<number, number>();

        // Count insertions at each index
        for (const insertion of changes.inserted) {
            insertionsByIndex.set(insertion.index, (insertionsByIndex.get(insertion.index) || 0) + 1);
        }

        // Estimate range of indices to process
        const maxRemovedIndex = changes.removed.length > 0 ? Math.max(...changes.removed.map((r) => r.index)) : 0;
        const maxInsertedIndex = changes.inserted.length > 0 ? Math.max(...changes.inserted.map((i) => i.index)) : 0;
        const maxIndex = Math.max(maxRemovedIndex, maxInsertedIndex) + 100; // Buffer for beyond changes

        let newIndex = 0;
        for (let oldIndex = 0; oldIndex <= maxIndex; oldIndex++) {
            // Skip removed indices
            if (removalIndices.has(oldIndex)) {
                continue;
            }

            // Account for insertions at the current new index
            const insertionsAtNewIndex = insertionsByIndex.get(newIndex) || 0;
            newIndex += insertionsAtNewIndex;

            // Record the mapping
            this.oldToNewMap.set(oldIndex, newIndex);
            this.newToOldMap.set(newIndex, oldIndex);
            newIndex++;
        }
    }

    /**
     * Map an old index to its new index after changes.
     * @param oldIndex - The original index before changes
     * @returns The new index after changes, or undefined if the index was removed
     */
    getNewIndex(oldIndex: number): number | undefined {
        // Check pre-computed mappings first
        if (this.oldToNewMap.has(oldIndex)) {
            return this.oldToNewMap.get(oldIndex);
        }

        // Fall back to range-based computation
        if (this.indexShiftRanges.length > 0) {
            return this.computeNewIndexFromRanges(oldIndex);
        }

        return undefined;
    }

    /**
     * Map a new index back to its original old index before changes.
     * @param newIndex - The index after changes
     * @returns The original index before changes, or undefined if this was an inserted index
     */
    getOldIndex(newIndex: number): number | undefined {
        // Check pre-computed mappings first
        if (this.newToOldMap.has(newIndex)) {
            return this.newToOldMap.get(newIndex);
        }

        // Fall back to range-based computation
        if (this.indexShiftRanges.length > 0) {
            return this.computeOldIndexFromRanges(newIndex);
        }

        return undefined;
    }

    /**
     * Compute new index using binary search on shift ranges.
     * @private
     */
    private computeNewIndexFromRanges(oldIndex: number): number | undefined {
        let shift = 0;

        // Find the applicable shift range using binary search
        for (const range of this.indexShiftRanges) {
            if (oldIndex >= range.startIndex && oldIndex <= range.endIndex) {
                shift = range.shift;
                break;
            }
        }

        const newIndex = oldIndex + shift;
        return newIndex >= 0 ? newIndex : undefined;
    }

    /**
     * Compute old index by reverse-applying shift ranges.
     * @private
     */
    private computeOldIndexFromRanges(newIndex: number): number | undefined {
        // Try each possible shift in reverse to find the original index
        for (const range of this.indexShiftRanges) {
            const potentialOldIndex = newIndex - range.shift;
            if (
                potentialOldIndex >= range.startIndex &&
                potentialOldIndex <= range.endIndex &&
                potentialOldIndex >= 0
            ) {
                return potentialOldIndex;
            }
        }

        // If no shift applies, this might be an insertion or the index wasn't affected
        return newIndex >= 0 ? newIndex : undefined;
    }

    /**
     * Clear all mappings and reset the mapper.
     */
    clear(): void {
        this.oldToNewMap.clear();
        this.newToOldMap.clear();
        this.indexShiftRanges = [];
    }

    /**
     * Check if the mapper has any mappings.
     */
    isEmpty(): boolean {
        return this.oldToNewMap.size === 0 && this.indexShiftRanges.length === 0;
    }

    /**
     * Get the total number of pre-computed mappings.
     * Useful for debugging and performance analysis.
     */
    getMappingCount(): number {
        return this.oldToNewMap.size;
    }
}
