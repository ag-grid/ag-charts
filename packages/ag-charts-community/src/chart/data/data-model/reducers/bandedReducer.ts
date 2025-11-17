import type { BandedDomainConfig } from '../../dataDomain';
import type { BandLike } from '../utils/bandOperations';
import { BandedStructure } from '../utils/bandedStructure';

export interface ReducerBand extends BandLike {
    cachedResult: unknown;
}

export interface BandedReducerStats extends Record<string, number> {
    totalBands: number;
    dirtyBands: number;
    dataSize: number;
    scanRatio: number;
    cacheHits: number;
}

/**
 * Band-based structure for reducer aggregations.
 * Each band maintains a cached result for efficient incremental updates.
 *
 * This class extends BandedStructure with reducer-specific functionality:
 * - Caching aggregation results per band
 * - Tracking scan ratios for performance metrics
 * - Providing statistics about cache hits and dirty bands
 */
export class BandedReducer extends BandedStructure<ReducerBand> {
    private lastDirtyBandCount: number = 0;
    private lastScanRatio: number = 0;
    private statsCaptured: boolean = false;

    constructor(config: BandedDomainConfig = {}) {
        super(config);
    }

    /**
     * Creates a new reducer band with undefined cached result.
     */
    protected createBand(startIndex: number, endIndex: number): ReducerBand {
        return {
            startIndex,
            endIndex,
            cachedResult: undefined,
            isDirty: true,
        };
    }

    /**
     * Initializes bands and resets stats capture flag.
     */
    override initializeBands(dataSize: number): void {
        super.initializeBands(dataSize);
        this.statsCaptured = false; // Reset stats capture flag
    }

    /**
     * Gets the array of bands for direct access by reducers.
     */
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

    /**
     * Returns reducer-specific statistics including cache hits and scan ratio.
     */
    override getStats(): BandedReducerStats {
        const cleanBands = this.bands.filter((band) => !band.isDirty && band.cachedResult !== undefined);

        // If stats haven't been captured yet, compute current state
        let dirtyBands: number;
        let scanRatio: number;

        if (this.statsCaptured) {
            dirtyBands = this.lastDirtyBandCount;
            scanRatio = this.lastScanRatio;
        } else {
            const currentDirtyBands = this.bands.filter((band) => band.isDirty);
            const dirtySpan = currentDirtyBands.reduce((sum, band) => sum + (band.endIndex - band.startIndex), 0);
            dirtyBands = currentDirtyBands.length;
            scanRatio = this.dataSize > 0 ? dirtySpan / this.dataSize : 0;
        }

        return {
            totalBands: this.bands.length,
            dirtyBands,
            dataSize: this.dataSize,
            scanRatio,
            cacheHits: cleanBands.length,
        };
    }
}
