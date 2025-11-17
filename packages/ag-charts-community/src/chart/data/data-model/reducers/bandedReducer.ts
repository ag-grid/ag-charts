import type { BandedDomainConfig } from '../../dataDomain';
import type { ReducerOutputPropertyDefinition } from '../../dataModelTypes';
import { type BandLike, BandedStructure } from '../utils/bandedStructure';

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

export interface ReducerContext {
    rawData: unknown[];
    keyColumns: unknown[][];
    keysParam: unknown[];
}

/**
 * Band-based structure for reducer aggregations.
 * Each band maintains a cached result for efficient incremental updates.
 *
 * This class extends BandedStructure with reducer-specific functionality:
 * - Caching aggregation results per band
 * - Evaluating reducers across bands with overlap support
 * - Combining band results into final aggregated values
 * - Tracking scan ratios for performance metrics
 *
 * Symmetrical to BandedDomain which handles domain aggregation.
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
     * Gets the array of bands for direct access.
     * @deprecated Use evaluateFromData() and getResult() instead for symmetry with BandedDomain.
     */
    getBands(): ReducerBand[] {
        return this.bands;
    }

    /**
     * Evaluates a reducer across all bands, reusing cached results for clean bands.
     * Symmetrical to BandedDomain.extendBandsFromData().
     *
     * @param def Reducer definition with reducer function, initial value, and overlap settings
     * @param context Reducer context containing raw data and key columns
     * @param reuseCleanBands Whether to reuse cached results for clean bands (default: false)
     */
    evaluateFromData(
        def: ReducerOutputPropertyDefinition,
        context: ReducerContext,
        reuseCleanBands: boolean = false
    ): void {
        const reducerFn = def.reducer();

        for (const band of this.bands) {
            if (reuseCleanBands && !band.isDirty) {
                continue; // Keep cached result
            }

            // Handle overlap for interval reducers (e.g., min/max interval calculations)
            const startIndex =
                def.needsOverlap && band.startIndex > 0 ? Math.max(0, band.startIndex - 1) : band.startIndex;

            const result = this.evaluateRange(def, reducerFn, context, startIndex, band.endIndex);
            band.cachedResult = result;
            band.isDirty = false;
        }
    }

    /**
     * Combines all band results to get the final aggregated value.
     * Symmetrical to BandedDomain.getDomain().
     *
     * @param def Reducer definition with combineResults function
     * @returns Combined result from all bands
     */
    getResult(def: ReducerOutputPropertyDefinition): unknown {
        const bandResults = this.bands.map((band) => band.cachedResult);
        return def.combineResults!(bandResults as any[]);
    }

    /**
     * Evaluates a reducer over a specific range of data indices.
     * Symmetrical to BandedDomain's band scanning loop in extendBandsFromData().
     *
     * @param def Reducer definition with initial value
     * @param reducer Reducer function to apply
     * @param context Reducer context with data and keys
     * @param startIndex Starting index (inclusive)
     * @param endIndex Ending index (exclusive)
     * @returns Accumulated reducer result for the range
     */
    private evaluateRange(
        def: ReducerOutputPropertyDefinition,
        reducer: ReturnType<ReducerOutputPropertyDefinition['reducer']>,
        context: ReducerContext,
        startIndex: number,
        endIndex: number
    ): unknown {
        let accValue: any = def.initialValue;
        const { keyColumns, keysParam, rawData } = context;
        const clampedEnd = Math.min(endIndex, rawData.length);

        for (let datumIndex = startIndex; datumIndex < clampedEnd; datumIndex += 1) {
            for (let keyIdx = 0; keyIdx < keysParam.length; keyIdx++) {
                keysParam[keyIdx] = keyColumns[keyIdx]?.[datumIndex];
            }
            accValue = reducer(accValue, keysParam);
        }

        return accValue;
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
