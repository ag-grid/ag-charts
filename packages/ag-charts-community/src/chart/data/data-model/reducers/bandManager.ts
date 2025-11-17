import type { BandedDomainConfig } from '../../dataDomain';

export interface ReducerBand {
    startIndex: number;
    endIndex: number;
    cachedResult: unknown;
    isDirty: boolean;
}

export interface BandManagerStats {
    totalBands: number;
    dirtyBands: number;
    dataSize: number;
    scanRatio: number;
    cacheHits: number;
}

const DEFAULT_MIN_DATA_SIZE_FOR_BANDING = 1000;
const DEFAULT_TARGET_BAND_COUNT = 10;

export class BandManager {
    private bands: ReducerBand[] = [];
    private dataSize: number = 0;
    private readonly config: Required<BandedDomainConfig>;
    private lastDirtyBandCount: number = 0;
    private lastScanRatio: number = 0;
    private statsCaptured: boolean = false;

    constructor(config: BandedDomainConfig = {}) {
        this.config = {
            minDataSizeForBanding: config.minDataSizeForBanding ?? DEFAULT_MIN_DATA_SIZE_FOR_BANDING,
            targetBandCount: config.targetBandCount ?? DEFAULT_TARGET_BAND_COUNT,
            maxBandSize: config.maxBandSize ?? Infinity,
            enableBanding: config.enableBanding ?? true,
        };
    }

    initializeBands(dataSize: number): void {
        this.dataSize = Math.max(0, dataSize);
        this.bands = [];
        this.statsCaptured = false; // Reset stats capture flag

        if (!this.config.enableBanding || this.dataSize < this.config.minDataSizeForBanding) {
            this.bands.push({
                startIndex: 0,
                endIndex: this.dataSize,
                cachedResult: undefined,
                isDirty: true,
            });
            return;
        }

        const targetBandCount = this.getTargetBandCount(this.dataSize);
        const bandSize = Math.max(1, Math.ceil(this.dataSize / targetBandCount));

        for (let startIndex = 0; startIndex < this.dataSize; startIndex += bandSize) {
            const endIndex = Math.min(startIndex + bandSize, this.dataSize);
            this.bands.push({
                startIndex,
                endIndex,
                cachedResult: undefined,
                isDirty: true,
            });
        }
    }

    handleInsertion(insertIndex: number, insertCount: number): void {
        this.dataSize += insertCount;

        if (this.bands.length === 0) {
            this.initializeBands(this.dataSize);
            return;
        }

        const targetBandCount = this.getTargetBandCount(this.dataSize);
        const idealBandSize = Math.ceil(this.dataSize / targetBandCount);
        const maxBandSize = Math.ceil(idealBandSize * 1.1); // 10% tolerance for mid-band insertions

        for (let i = 0; i < this.bands.length; i++) {
            const band = this.bands[i];
            const isLastBand = i === this.bands.length - 1;

            if (insertIndex < band.startIndex) {
                // Insertion before this band - shift boundaries
                band.startIndex += insertCount;
                band.endIndex += insertCount;
            } else if (insertIndex < band.endIndex) {
                // Mid-band insertion - grow and potentially split
                band.endIndex += insertCount;
                band.isDirty = true;

                const bandSize = band.endIndex - band.startIndex;
                if (bandSize > maxBandSize) {
                    this.splitBand(i, idealBandSize);
                }
            } else if (insertIndex === band.endIndex && isLastBand) {
                // Append case - check if we should create new band or grow existing
                const currentBandSize = band.endIndex - band.startIndex;

                if (currentBandSize >= idealBandSize) {
                    // Band is at ideal size - create new band (zero rescan of existing data!)
                    this.bands.push({
                        startIndex: insertIndex,
                        endIndex: insertIndex + insertCount,
                        cachedResult: undefined,
                        isDirty: true,
                    });
                } else {
                    // Band still growing to ideal size - extend it
                    band.endIndex += insertCount;
                    band.isDirty = true;
                }
                // Break to avoid processing newly created band in this iteration
                break;
            }
        }
    }

    handleRemoval(removeIndex: number, removeCount: number): void {
        if (removeCount <= 0 || this.bands.length === 0) return;

        const effectiveRemoveCount = Math.min(removeCount, Math.max(0, this.dataSize - removeIndex));
        if (effectiveRemoveCount <= 0) return;

        this.dataSize = Math.max(0, this.dataSize - effectiveRemoveCount);
        const removeEnd = removeIndex + effectiveRemoveCount;

        for (const band of this.bands) {
            if (removeEnd <= band.startIndex) {
                band.startIndex = Math.max(0, band.startIndex - effectiveRemoveCount);
                band.endIndex = Math.max(band.startIndex, band.endIndex - effectiveRemoveCount);
            } else if (removeIndex >= band.endIndex) {
                continue;
            } else {
                band.isDirty = true;

                if (removeIndex <= band.startIndex && removeEnd >= band.endIndex) {
                    band.startIndex = removeIndex;
                    band.endIndex = removeIndex;
                } else if (removeIndex <= band.startIndex) {
                    const deletedFromBand = removeEnd - band.startIndex;
                    const oldBandSize = band.endIndex - band.startIndex;
                    band.startIndex = removeIndex;
                    band.endIndex = band.startIndex + Math.max(0, oldBandSize - deletedFromBand);
                } else if (removeEnd >= band.endIndex) {
                    band.endIndex = Math.max(band.startIndex, removeIndex);
                } else {
                    band.endIndex = Math.max(band.startIndex, band.endIndex - effectiveRemoveCount);
                }
            }
        }

        this.bands = this.bands.filter((band) => band.endIndex > band.startIndex);
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
    private splitBand(bandIndex: number, idealSize: number): void {
        const band = this.bands[bandIndex];
        const bandSize = band.endIndex - band.startIndex;

        // Calculate split point: try to make both halves close to ideal size
        const firstHalfSize = Math.min(idealSize, Math.floor(bandSize / 2));
        const splitPoint = band.startIndex + firstHalfSize;

        // Create two new bands
        const band1: ReducerBand = {
            startIndex: band.startIndex,
            endIndex: splitPoint,
            cachedResult: undefined,
            isDirty: true,
        };

        const band2: ReducerBand = {
            startIndex: splitPoint,
            endIndex: band.endIndex,
            cachedResult: undefined,
            isDirty: true,
        };

        // Replace old band with two new bands
        this.bands.splice(bandIndex, 1, band1, band2);
    }

    getBands(): ReducerBand[] {
        return this.bands;
    }

    /**
     * Capture the current dirty state before processing.
     * Call this before marking bands as clean to preserve stats for reporting.
     */
    captureStatsBeforeProcessing(): void {
        const dirtyBands = this.bands.filter((band) => band.isDirty);
        const dirtySpan = dirtyBands.reduce((sum, band) => sum + (band.endIndex - band.startIndex), 0);

        this.lastDirtyBandCount = dirtyBands.length;
        this.lastScanRatio = this.dataSize > 0 ? dirtySpan / this.dataSize : 0;
        this.statsCaptured = true;
    }

    getStats(): BandManagerStats {
        const cleanBands = this.bands.filter((band) => !band.isDirty && band.cachedResult !== undefined);

        // If stats haven't been captured yet, compute current state
        let dirtyBands: number;
        let scanRatio: number;

        if (!this.statsCaptured) {
            const currentDirtyBands = this.bands.filter((band) => band.isDirty);
            const dirtySpan = currentDirtyBands.reduce((sum, band) => sum + (band.endIndex - band.startIndex), 0);
            dirtyBands = currentDirtyBands.length;
            scanRatio = this.dataSize > 0 ? dirtySpan / this.dataSize : 0;
        } else {
            dirtyBands = this.lastDirtyBandCount;
            scanRatio = this.lastScanRatio;
        }

        return {
            totalBands: this.bands.length,
            dirtyBands,
            dataSize: this.dataSize,
            scanRatio,
            cacheHits: cleanBands.length,
        };
    }

    private getTargetBandCount(dataSize: number): number {
        const derivedCount = Math.ceil(dataSize / 1000);
        return Math.max(this.config.targetBandCount, derivedCount);
    }
}
