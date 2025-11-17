import type { BandedDomainConfig } from '../../dataDomain';
import type { BandLike } from './bandOperations';
import {
    adjustBandForInsertion,
    adjustBandForRemoval,
    calculateIdealBandSize,
    calculateTargetBandCount,
    filterEmptyBands,
    initializeBandArray,
} from './bandOperations';

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
}
