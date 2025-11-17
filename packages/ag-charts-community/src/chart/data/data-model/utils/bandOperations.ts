/**
 * Shared utilities for band-based data structures.
 * Used by both BandedDomain and BandedReducer for consistent band manipulation.
 */

/**
 * Minimal interface for band-like structures.
 * Both domain bands and reducer bands must have these properties.
 */
export interface BandLike {
    startIndex: number;
    endIndex: number;
    isDirty: boolean;
}

/**
 * Configuration for band initialization.
 */
export interface BandConfig {
    enableBanding: boolean;
    minDataSizeForBanding: number;
    targetBandCount: number;
}

/**
 * Adjusts band indices for an insertion operation.
 * Handles three cases:
 * 1. Insertion before band - shift both boundaries
 * 2. Insertion within band or at end of last band - extend end boundary
 * 3. Insertion after band - no changes
 *
 * @param band The band to adjust
 * @param insertIndex Index where insertion occurs
 * @param insertCount Number of items inserted
 * @param isLastBand Whether this is the last band in the array
 * @returns true if band was modified and should be marked dirty
 */
export function adjustBandForInsertion<T extends BandLike>(
    band: T,
    insertIndex: number,
    insertCount: number,
    isLastBand: boolean
): boolean {
    if (insertIndex < band.startIndex) {
        // Insertion before band - shift both boundaries
        band.startIndex += insertCount;
        band.endIndex += insertCount;
        return false; // No need to mark dirty - data unchanged
    } else if (insertIndex < band.endIndex || (insertIndex === band.endIndex && isLastBand)) {
        // Insertion within band or at end of last band (for appending)
        band.endIndex += insertCount;
        return true; // Mark dirty - band data changed
    }
    return false; // Insertion after band - no changes
}

/**
 * Adjusts band indices for a removal operation.
 * Handles multiple overlap cases:
 * 1. Removal before band - shift both boundaries
 * 2. Removal fully contains band - collapse to empty
 * 3. Removal overlaps start of band - shrink from start
 * 4. Removal overlaps end of band - shrink from end
 * 5. Removal within band - shrink end boundary
 *
 * @param band The band to adjust
 * @param removeIndex Index where removal starts
 * @param removeCount Number of items removed
 * @returns true if band was affected and should be marked dirty
 */
export function adjustBandForRemoval<T extends BandLike>(band: T, removeIndex: number, removeCount: number): boolean {
    const removeEnd = removeIndex + removeCount;

    if (removeEnd <= band.startIndex) {
        // Removal before band - shift both boundaries
        band.startIndex = Math.max(0, band.startIndex - removeCount);
        band.endIndex = Math.max(band.startIndex, band.endIndex - removeCount);
        return false; // No need to mark dirty - data unchanged
    } else if (removeIndex >= band.endIndex) {
        // Removal after band - no changes
        return false;
    } else {
        // Removal affects band - calculate new boundaries
        if (removeIndex <= band.startIndex && removeEnd >= band.endIndex) {
            // Band fully contained in removal range - collapse to empty
            band.startIndex = removeIndex;
            band.endIndex = removeIndex;
        } else if (removeIndex <= band.startIndex) {
            // Removal overlaps start of band
            const deletedFromBand = removeEnd - band.startIndex;
            const oldBandSize = band.endIndex - band.startIndex;
            band.startIndex = removeIndex;
            band.endIndex = band.startIndex + Math.max(0, oldBandSize - deletedFromBand);
        } else if (removeEnd >= band.endIndex) {
            // Removal overlaps end of band
            band.endIndex = Math.max(band.startIndex, removeIndex);
        } else {
            // Removal within band
            band.endIndex = Math.max(band.startIndex, band.endIndex - removeCount);
        }
        return true; // Mark dirty - band data changed
    }
}

/**
 * Calculates target band count based on data size.
 * Uses 1000 items per band as a baseline, with a configurable minimum.
 *
 * @param dataSize Total number of data items
 * @param minBandCount Minimum number of bands to create
 * @returns Target number of bands
 */
export function calculateTargetBandCount(dataSize: number, minBandCount: number): number {
    const derivedCount = Math.ceil(dataSize / 1000);
    return Math.max(minBandCount, derivedCount);
}

/**
 * Calculates ideal band size given data size and target band count.
 *
 * @param dataSize Total number of data items
 * @param targetBandCount Target number of bands
 * @returns Ideal size for each band
 */
export function calculateIdealBandSize(dataSize: number, targetBandCount: number): number {
    return Math.max(1, Math.ceil(dataSize / targetBandCount));
}

/**
 * Filters out empty bands (where endIndex <= startIndex).
 * Empty bands can occur after removals that eliminate all data in a band.
 *
 * @param bands Array of bands to filter
 * @returns Array with empty bands removed
 */
export function filterEmptyBands<T extends BandLike>(bands: T[]): T[] {
    return bands.filter((band) => band.endIndex > band.startIndex);
}

/**
 * Creates an array of bands with the given configuration.
 * For small datasets or when banding is disabled, creates a single band.
 * Otherwise, divides data into approximately equal-sized bands.
 *
 * @param dataSize Total number of data items
 * @param config Banding configuration
 * @param bandFactory Function to create a band given start and end indices
 * @returns Array of initialized bands
 */
export function initializeBandArray<T extends BandLike>(
    dataSize: number,
    config: BandConfig,
    bandFactory: (startIndex: number, endIndex: number) => T
): T[] {
    if (!config.enableBanding || dataSize < config.minDataSizeForBanding) {
        // Single band for small datasets or when banding disabled
        return [bandFactory(0, dataSize)];
    }

    const targetBandCount = calculateTargetBandCount(dataSize, config.targetBandCount);
    const bandSize = calculateIdealBandSize(dataSize, targetBandCount);

    const bands: T[] = [];
    for (let startIndex = 0; startIndex < dataSize; startIndex += bandSize) {
        const endIndex = Math.min(startIndex + bandSize, dataSize);
        bands.push(bandFactory(startIndex, endIndex));
    }

    return bands;
}

/**
 * Marks bands containing the given index as dirty.
 * Used for update operations where data changes but dataset size doesn't.
 *
 * @param bands Array of bands
 * @param index Data index that was updated
 */
export function markBandDirtyAtIndex<T extends BandLike>(bands: T[], index: number): void {
    for (const band of bands) {
        if (index >= band.startIndex && index < band.endIndex) {
            band.isDirty = true;
            return; // Index can only be in one band
        }
    }
}

/**
 * Apply splice operations (insertions and deletions) to a band-like structure.
 * This is a generic helper for any structure with handleInsertion/handleRemoval methods.
 *
 * @param bandHandler Object with handleInsertion and handleRemoval methods
 * @param spliceOps Array of splice operations to apply
 */
export function applySpliceOperations(
    bandHandler: {
        handleInsertion(index: number, count: number): void;
        handleRemoval(index: number, count: number): void;
    },
    spliceOps: Array<{ index: number; insertCount: number; deleteCount: number }>
): void {
    for (const op of spliceOps) {
        if (op.insertCount > 0) {
            bandHandler.handleInsertion(op.index, op.insertCount);
        }
        if (op.deleteCount > 0) {
            bandHandler.handleRemoval(op.index, op.deleteCount);
        }
    }
}

/**
 * Mark bands dirty at updated indices by using handleInsertion with 0 count.
 * This avoids changing band structure while marking them for recalculation.
 *
 * @param bandHandler Object with handleInsertion method
 * @param updatedIndices Set of indices that were updated
 */
export function markUpdatedIndices(
    bandHandler: { handleInsertion(index: number, count: number): void },
    updatedIndices: Set<number>
): void {
    for (const index of updatedIndices) {
        bandHandler.handleInsertion(index, 0);
    }
}

/**
 * Applies a change description (insertions, deletions, updates) to a band-like structure.
 * Combines splice operations and updated-index handling to keep band dirty-state logic consistent.
 */
export function applyIndexMapToBandHandler(
    bandHandler: {
        handleInsertion(index: number, count: number): void;
        handleRemoval(index: number, count: number): void;
    },
    indexMap: { spliceOps: Array<{ index: number; insertCount: number; deleteCount: number }>; updatedIndices: Set<number> }
): void {
    applySpliceOperations(bandHandler, indexMap.spliceOps);

    if (indexMap.updatedIndices.size > 0) {
        markUpdatedIndices(bandHandler, indexMap.updatedIndices);
    }
}
