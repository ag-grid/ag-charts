import type { BandedDomainConfig } from '../../dataDomain';

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
 * Shared index map type for splice/update operations applied to banded structures.
 */
export interface BandIndexMap {
    spliceOps: Array<{ index: number; insertCount: number; deleteCount: number }>;
    updatedIndices: Set<number>;
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
 */
export function filterEmptyBands<T extends BandLike>(bands: T[]): T[] {
    return bands.filter((band) => band.endIndex > band.startIndex);
}

/**
 * Creates an array of bands with the given configuration.
 * For small datasets or when banding is disabled, creates a single band.
 * Otherwise, divides data into approximately equal-sized bands.
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
    indexMap: BandIndexMap
): void {
    applySpliceOperations(bandHandler, indexMap.spliceOps);

    if (indexMap.updatedIndices.size > 0) {
        markUpdatedIndices(bandHandler, indexMap.updatedIndices);
    }
}

const DEFAULT_MIN_DATA_SIZE_FOR_BANDING = 1000;
const DEFAULT_TARGET_BAND_COUNT = 10;

/**
 * Abstract base class for band-based data structures.
 * Provides common functionality for dividing data into bands for efficient incremental updates.
 *
 * Both BandedReducer and BandedDomain share the same banding logic:
 * - Initialize bands based on data size
 * - Handle insertions with proactive splitting
 * - Handle removals with band cleanup
 * - Track dirty state for incremental processing
 *
 * Subclasses differ only in what they store per band:
 * - BandedReducer: stores cachedResult for aggregations
 * - BandedDomain: stores subDomain for domain calculations
 */
export abstract class BandedStructure<TBand extends BandLike> {
    protected bands: TBand[] = [];
    protected dataSize: number = 0;
    protected readonly config: Required<BandedDomainConfig>;

    constructor(config: BandedDomainConfig = {}) {
        this.config = {
            minDataSizeForBanding: config.minDataSizeForBanding ?? DEFAULT_MIN_DATA_SIZE_FOR_BANDING,
            targetBandCount: config.targetBandCount ?? DEFAULT_TARGET_BAND_COUNT,
            maxBandSize: config.maxBandSize ?? Infinity,
            enableBanding: config.enableBanding ?? true,
        };
    }

    applyIndexMap(indexMap: BandIndexMap): void {
        applyIndexMapToBandHandler(this, indexMap);
    }

    /**
     * Abstract method to create a band with subclass-specific data.
     * @param startIndex Starting index of the band
     * @param endIndex Ending index of the band
     * @returns A new band instance
     */
    protected abstract createBand(startIndex: number, endIndex: number): TBand;

    /**
     * Initializes or rebalances bands based on current data size.
     */
    initializeBands(dataSize: number): void {
        this.dataSize = Math.max(0, dataSize);

        this.bands = initializeBandArray(this.dataSize, this.config, (startIndex, endIndex) =>
            this.createBand(startIndex, endIndex)
        );
    }

    /**
     * Handles insertion of new data by adjusting band indices.
     * Uses proactive band splitting to maintain optimal band sizes.
     */
    handleInsertion(insertIndex: number, insertCount: number): void {
        this.dataSize += insertCount;

        if (this.bands.length === 0) {
            this.initializeBands(this.dataSize);
            return;
        }

        const targetBandCount = calculateTargetBandCount(this.dataSize, this.config.targetBandCount);
        const idealBandSize = calculateIdealBandSize(this.dataSize, targetBandCount);
        const maxBandSize = Math.ceil(idealBandSize * 1.1); // 10% tolerance for mid-band insertions

        for (let i = 0; i < this.bands.length; i++) {
            const band = this.bands[i];
            const isLastBand = i === this.bands.length - 1;

            // Handle special append case for last band before using shared utility
            if (insertIndex === band.endIndex && isLastBand) {
                const currentBandSize = band.endIndex - band.startIndex;

                if (currentBandSize >= idealBandSize) {
                    // Band is at ideal size - create new band (zero rescan of existing data!)
                    this.bands.push(this.createBand(insertIndex, insertIndex + insertCount));
                } else {
                    // Band still growing to ideal size - extend it
                    band.endIndex += insertCount;
                    band.isDirty = true;
                }
                // Break to avoid processing newly created band in this iteration
                break;
            }

            // Use shared utility for standard insertion handling
            const wasDirty = adjustBandForInsertion(band, insertIndex, insertCount, isLastBand);
            if (wasDirty) {
                band.isDirty = true;

                // Check if band needs splitting after mid-band insertion
                if (insertIndex < band.endIndex) {
                    const bandSize = band.endIndex - band.startIndex;
                    if (bandSize > maxBandSize) {
                        this.splitBand(i, idealBandSize);
                    }
                }
            }
        }
    }

    /**
     * Handles removal of data by adjusting band indices.
     * Uses shared utilities for consistent band manipulation.
     */
    handleRemoval(removeIndex: number, removeCount: number): void {
        if (removeCount <= 0 || this.bands.length === 0) return;

        const effectiveRemoveCount = Math.min(removeCount, Math.max(0, this.dataSize - removeIndex));
        if (effectiveRemoveCount <= 0) return;

        this.dataSize = Math.max(0, this.dataSize - effectiveRemoveCount);

        // Use shared utility for band adjustment
        for (const band of this.bands) {
            const wasDirty = adjustBandForRemoval(band, removeIndex, effectiveRemoveCount);
            if (wasDirty) {
                band.isDirty = true;
            }
        }

        // Use shared utility to filter out empty bands
        this.bands = filterEmptyBands(this.bands);
    }

    /**
     * Split an oversized band into two smaller bands.
     * Called when a band exceeds maxBandSize during insertion.
     *
     * Strategy:
     * - Split the band as evenly as possible
     * - Both halves marked as dirty (need recalculation)
     * - No cache preservation (splitting indicates data changed)
     */
    protected splitBand(bandIndex: number, idealSize: number): void {
        const band = this.bands[bandIndex];
        const bandSize = band.endIndex - band.startIndex;

        // Calculate split point: try to make both halves close to ideal size
        const firstHalfSize = Math.min(idealSize, Math.floor(bandSize / 2));
        const splitPoint = band.startIndex + firstHalfSize;

        // Create two new bands
        const band1 = this.createBand(band.startIndex, splitPoint);
        const band2 = this.createBand(splitPoint, band.endIndex);

        // Replace old band with two new bands
        this.bands.splice(bandIndex, 1, band1, band2);
    }

    /**
     * Returns statistics about the banded structure for debugging.
     * Subclasses can override to add domain-specific stats.
     */
    getStats(): Record<string, number> {
        const dirtyBands = this.bands.filter((band) => band.isDirty);

        return {
            totalBands: this.bands.length,
            dirtyBands: dirtyBands.length,
            dataSize: this.dataSize,
        };
    }

    markRangeDirty(startIndex: number, endIndex: number): void {
        for (const band of this.bands) {
            if (startIndex < band.endIndex && endIndex > band.startIndex) {
                band.isDirty = true;
            }
        }
    }
}
