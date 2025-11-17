# Design Document: Banded Interval Reducers

**Status:** Design / Planning
**Author:** AI Analysis
**Date:** 2025-11-14
**Related Issue:** AG-16239 (Bar Series Performance Improvements)

## Problem Statement

The `smallestKeyInterval` and `largestKeyInterval` reducers currently force full data reprocessing on every `applyTransaction()` call, blocking incremental updates for BarSeries with continuous axes. This significantly impacts performance for high-frequency data scenarios, especially rolling window use cases.

**Current blocker:** `incrementalProcessor.ts:71`

```typescript
if (this.ctx.reducers.length > 0) return false;
```

## Proposed Solution

Implement **generic banded reducer infrastructure** that keeps reducers completely unaware of banding optimization.

**Key Design Principle:** Reducers stay clean and simple - banding is a pure infrastructure concern handled by the incremental processor.

### How It Works

1. **Reducer remains unchanged** - Standard reducer logic works as-is
2. **Add 3 metadata fields** - `supportsBanding`, `combineResults`, `needsOverlap`
3. **Generic infrastructure** - `BandManager` + `reprocessBandedReducers()` handles all the complexity
4. **Hierarchical application** - Run reducer on each band, combine results
5. **Overlap for stateful reducers** - Include last point from previous band when needed

This design mirrors the proven `BandedDomain` architecture but is more generic and reusable.

## Design Decisions & Technical Specifications

This section addresses technical design decisions and provides complete specifications for implementing banded reducers.

### Reducer Metadata Specification

**Full Type Signature:**

```typescript
export type ReducerOutputPropertyDefinition<P extends ReducerOutputKeys> = {
    type: 'reducer';
    property: P;
    initialValue?: ReducerOutputTypes[P];

    // Standard reducer function (unchanged)
    reducer: () => (acc: ReducerOutputTypes[P], keys: unknown[]) => ReducerOutputTypes[P];

    // Banding support (all optional with defaults shown below)
    supportsBanding?: boolean; // default: false
    combineResults?: (bandResults: ReducerOutputTypes[P][]) => ReducerOutputTypes[P]; // default: undefined
    needsOverlap?: boolean; // default: false
};
```

**Default Values:**

-   `supportsBanding`: `false` (opt-in only - reducers must explicitly enable banding)
-   `combineResults`: `undefined` (required when `supportsBanding=true`, otherwise validation error)
-   `needsOverlap`: `false` (stateless reducers don't need overlap)

**Behavior Rules:**

1. Reducers without `supportsBanding=true` will block incremental processing (existing behavior preserved)
2. `combineResults` is **required** when `supportsBanding=true` - implementation will validate this
3. `combineResults` receives an array of all band results and combines them in a single pass (not accumulator pattern)
4. No separate "finalize" hook - `combineResults` handles all post-processing including filtering invalid values

**Example - Handling Empty/Invalid Results:**

```typescript
combineResults: (bandResults) => {
    const validResults = bandResults.filter(Number.isFinite);
    return validResults.length > 0 ? Math.min(...validResults) : Infinity; // Return initialValue when all bands produce no valid results
};
```

### Overlap Handling Rules

**Fixed Overlap Size:** Always exactly 1 element from the previous band when `needsOverlap=true`.

**Why Not Configurable?** Current reducers (interval calculations) only need 1 previous value. If future use cases require more (e.g., derivatives needing 2+ points), we can add `overlapSize?: number` later.

**Edge Case Handling:**

| Scenario            | Behavior                              | Rationale                                     |
| ------------------- | ------------------------------------- | --------------------------------------------- |
| Band 0 (first band) | Never gets overlap                    | No previous band exists to overlap from       |
| Empty bands         | Processed as-is, produce initialValue | Consistent with reducer semantics             |
| Single-point bands  | Processed as-is                       | Can't compute intervals, returns initialValue |

**Implementation Pattern:**

```typescript
// Band 0 never gets overlap due to band.startIndex > 0 check
const startIdx =
    reducerDef.needsOverlap && band.startIndex > 0
        ? Math.max(0, band.startIndex - 1) // Include last point from prev band
        : band.startIndex;

const dataSlice = processedData.data.slice(startIdx, band.endIndex);
```

**Why Math.max(0, ...)?** Defense-in-depth: prevents negative array indices even though the `band.startIndex > 0` check already prevents this.

### Band Dirty Marking Rules

**Strategy:** Mark **only directly affected bands** as dirty to minimize recomputation.

**Insertion Operations:**

-   Bands **containing** insertion point → marked dirty, endIndex extended
-   Bands **before** insertion point → boundaries shifted, **not** marked dirty (cached results still valid)
-   Bands **after** insertion point → boundaries shifted, **not** marked dirty
-   **Band splitting:** If a band grows beyond `idealBandSize * 1.1`, it's immediately split into two bands

**Deletion Operations:**

-   Bands **overlapping** deletion range → marked dirty, endIndex shrunk
-   Bands **before** deletion → boundaries shifted, **not** marked dirty
-   Bands **after** deletion → boundaries shifted, **not** marked dirty
-   Empty bands are removed from the band array

**Example - Rolling Window Efficiency:**

```
Data: 10,000 points in 10 bands of 1,000 points each
Operation: Remove 100 from start, add 100 to end
Result: Only 2 bands marked dirty (first and last) = 20% scan ratio
```

### Configuration Design

**Decision:** Mirror `BandedDomainConfig` exactly for consistency across the codebase.

```typescript
interface BandedDomainConfig {
    minDataSizeForBanding: 1000; // Threshold to enable banding
    targetBandCount: 10; // Minimum number of bands for large datasets
    enableBanding: true; // Global enable/disable flag
}
```

**Rationale:**

1. **Consistency:** Same thresholds ensure domain banding and reducer banding behave predictably together
2. **Simplicity:** One configuration point instead of multiple per-feature configs
3. **Proven values:** These thresholds are already validated in production through `BandedDomain`
4. **Future flexibility:** Can add per-reducer overrides later if needed, but start simple

**Why 1000 points?** Below this threshold, the overhead of band management exceeds the benefit. Full scans are fast enough for small datasets.

**Why 10 minimum bands?** Provides good granularity for incremental updates while keeping band management overhead low.

## Architecture Overview

### Core Concept: Hierarchical Reducer Application

Instead of maintaining a single global min/max interval that requires full rescanning, apply reducers **hierarchically**:

1. **Divide data into bands** - Split large datasets into manageable chunks
2. **Run standard reducer on each band** - Use the existing reducer logic unchanged
3. **Combine band results** - Apply a simple combiner function (e.g., `Math.min` for smallest interval)

```typescript
interface ReducerBand {
    startIndex: number; // Band start (inclusive)
    endIndex: number; // Band end (exclusive)
    cachedResult: any; // Result from running reducer on this band
    isDirty: boolean; // Needs recalculation
}
```

### Key Insight: Cross-Band Interval Handling via Overlap

Intervals can span band boundaries:

```
Band 0: [..., 40]
Band 1: [45, ...]  → interval = 45-40 = 5
```

**Solution:** When processing Band N, include the **last element from Band N-1** as context:

```
Data: [10, 20, 30, 40, 50, 60, 70, 80]
Band 0: process indices 0-3 → [10, 20, 30, 40]
Band 1: process indices 3-7 → [40, 50, 60, 70, 80] (includes 40 from prev band)
```

This way the reducer naturally computes `interval(40, 50) = 10` without knowing about banding!

### Configuration (Aligned with BandedDomain)

-   **Banding threshold:** 1000+ data points
-   **Target band count:** 10 minimum, scales with data size
-   **Band size formula:** `Math.max(10, Math.ceil(dataSize / 1000))`
-   **Example:** 1M points → ~100 bands of ~10K points each

## Performance Impact

| Scenario       | Data Size | Operation            | Current    | With Banding                                 | Speedup  |
| -------------- | --------- | -------------------- | ---------- | -------------------------------------------- | -------- |
| Rolling window | 10K       | Delete 100 + Add 100 | 10K scans  | 1K scans (2 bands dirty)                     | **10x**  |
| Large update   | 1M        | Delete 1K mid-range  | 1M scans   | 20K scans (2 affected bands)                 | **50x**  |
| Append-only    | 100K      | Add 100              | 100K scans | 100 scans (last band + occasional split 220) | **450x** |
| Small dataset  | 500       | Any                  | 500 scans  | 500 scans (no banding)                       | 1x       |

**Band Splitting Overhead:** When a band exceeds `idealBandSize * 1.1`, it's split into two bands. This requires rescanning only the oversized band (~1.1K points for a 1K ideal size), not the entire dataset. In a rolling window scenario with 10K points and 10 bands, splitting occurs approximately every 10 append operations (1% overhead per operation).

## Implementation Plan

### Phase 1: Generic Band Manager

**New File:** `packages/ag-charts-community/src/chart/data/data-model/reducers/bandManager.ts`

```typescript
import type { BandedDomainConfig } from '../domain/domainManager';

export interface ReducerBand {
    startIndex: number;
    endIndex: number;
    cachedResult: any; // Result from running reducer on this band
    isDirty: boolean;
}

/**
 * Generic band manager for reducer optimization.
 * Handles band lifecycle without knowledge of specific reducer logic.
 */
export class BandManager {
    private bands: ReducerBand[] = [];
    private dataSize: number = 0;
    private readonly config: BandedDomainConfig;

    constructor(config?: BandedDomainConfig) {
        this.config = {
            minDataSizeForBanding: config?.minDataSizeForBanding ?? 1000,
            targetBandCount: config?.targetBandCount ?? 10,
            enableBanding: config?.enableBanding ?? true,
        };
    }

    /**
     * Initialize bands for a given data size.
     * Mirrors BandedDomain.initializeBands()
     */
    initializeBands(dataSize: number): void {
        this.dataSize = dataSize;
        this.bands = [];

        if (!this.config.enableBanding || dataSize < this.config.minDataSizeForBanding) {
            // Single band covering entire dataset
            this.bands.push({
                startIndex: 0,
                endIndex: dataSize,
                cachedResult: undefined,
                isDirty: true,
            });
            return;
        }

        const targetBandCount = Math.max(this.config.targetBandCount, Math.ceil(dataSize / 1000));
        const bandSize = Math.ceil(dataSize / targetBandCount);

        for (let i = 0; i < targetBandCount; i++) {
            const startIndex = i * bandSize;
            const endIndex = Math.min((i + 1) * bandSize, dataSize);
            if (startIndex >= dataSize) break;

            this.bands.push({
                startIndex,
                endIndex,
                cachedResult: undefined,
                isDirty: true,
            });
        }
    }

    /**
     * Handle insertion of data points.
     * Mirrors BandedDomain.handleInsertion() with proactive band splitting.
     *
     * Dirty marking strategy (see "Band Dirty Marking Rules" in design doc):
     * - Bands containing insertion point: marked dirty
     * - Bands before/after insertion: boundaries shifted, NOT marked dirty (cached results still valid)
     * - Bands exceeding maxBandSize: immediately split into two bands
     */
    handleInsertion(insertIndex: number, insertCount: number): void {
        this.dataSize += insertCount;

        // Calculate ideal and max band sizes
        const targetBandCount = Math.max(this.config.targetBandCount, Math.ceil(this.dataSize / 1000));
        const idealBandSize = Math.ceil(this.dataSize / targetBandCount);
        const maxBandSize = Math.ceil(idealBandSize * 1.1); // 10% tolerance

        for (let i = 0; i < this.bands.length; i++) {
            const band = this.bands[i];
            const isLastBand = i === this.bands.length - 1;

            if (insertIndex < band.startIndex) {
                // Insertion before this band - shift both boundaries (NOT marked dirty)
                band.startIndex += insertCount;
                band.endIndex += insertCount;
            } else if (insertIndex < band.endIndex || (insertIndex === band.endIndex && isLastBand)) {
                // Insertion within this band - extend and mark dirty
                band.endIndex += insertCount;
                band.isDirty = true;

                // Check if band should be split
                const bandSize = band.endIndex - band.startIndex;
                if (bandSize > maxBandSize) {
                    this.splitBand(i, idealBandSize);
                }
            }
            // Bands after insertion have no changes (insertion doesn't affect them)
        }
    }

    /**
     * Handle removal of data points.
     * Mirrors BandedDomain.handleRemoval()
     *
     * Dirty marking strategy (see "Band Dirty Marking Rules" in design doc):
     * - Bands overlapping deletion range: marked dirty
     * - Bands before/after deletion: boundaries shifted, NOT marked dirty (cached results still valid)
     *
     * Handles multi-band deletions by cascading adjustments through all affected bands.
     */
    handleRemoval(removeIndex: number, removeCount: number): void {
        this.dataSize = Math.max(0, this.dataSize - removeCount);
        const removeEnd = removeIndex + removeCount;

        for (const band of this.bands) {
            if (removeEnd <= band.startIndex) {
                // Removal completely before this band - shift both boundaries back
                band.startIndex -= removeCount;
                band.endIndex -= removeCount;
                // NOT marked dirty - data is unchanged, just indices shifted
            } else if (removeIndex >= band.endIndex) {
                // Removal completely after this band - no changes needed
                continue;
            } else {
                // Removal overlaps this band - mark dirty and adjust boundaries
                band.isDirty = true;

                if (removeIndex <= band.startIndex && removeEnd >= band.endIndex) {
                    // Band is completely contained in removal range - will be removed later
                    band.startIndex = removeIndex;
                    band.endIndex = removeIndex;
                } else if (removeIndex <= band.startIndex) {
                    // Removal overlaps start of band
                    const deletedFromBand = removeEnd - band.startIndex;
                    band.startIndex = removeIndex;
                    band.endIndex -= deletedFromBand;
                } else if (removeEnd >= band.endIndex) {
                    // Removal overlaps end of band
                    band.endIndex = removeIndex;
                } else {
                    // Removal is completely within band
                    band.endIndex -= removeCount;
                }
            }
        }

        // Remove empty bands
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

    /**
     * Get all bands.
     */
    getBands(): ReducerBand[] {
        return this.bands;
    }

    /**
     * Get optimization statistics for debugging/monitoring.
     */
    getStats() {
        const dirtyBands = this.bands.filter((b) => b.isDirty);
        const cleanBands = this.bands.filter((b) => !b.isDirty && b.cachedResult !== undefined);
        return {
            totalBands: this.bands.length,
            dirtyBands: dirtyBands.length,
            dataSize: this.dataSize,
            scanRatio:
                this.dataSize > 0
                    ? dirtyBands.reduce((sum, b) => sum + (b.endIndex - b.startIndex), 0) / this.dataSize
                    : 0,
            cacheHits: cleanBands.length, // Bands using cached results
        };
    }
}
```

### Phase 2: Type System Extensions

**File:** `packages/ag-charts-community/src/chart/data/dataModelTypes.ts`

```typescript
// Extend existing ReducerOutputPropertyDefinition to support banding
// See "Design Decisions & Technical Specifications" section for complete specification
export type ReducerOutputPropertyDefinition<P extends ReducerOutputKeys> = {
    type: 'reducer';
    property: P;
    initialValue?: ReducerOutputTypes[P];

    // Standard reducer function (unchanged)
    reducer: () => (acc: ReducerOutputTypes[P], keys: unknown[]) => ReducerOutputTypes[P];

    // Banding support (all optional with defaults)
    supportsBanding?: boolean; // default: false

    /**
     * Combines results from multiple bands into final result.
     * REQUIRED when supportsBanding is true - implementation should validate this.
     * Receives array of all band results and combines in single pass.
     *
     * Should handle empty/invalid results by returning initialValue.
     *
     * Example for smallest interval:
     * (results) => {
     *   const valid = results.filter(Number.isFinite);
     *   return valid.length > 0 ? Math.min(...valid) : Infinity;
     * }
     */
    combineResults?: (bandResults: ReducerOutputTypes[P][]) => ReducerOutputTypes[P];

    /**
     * Whether to include the last element from the previous band when processing.
     * Useful for stateful reducers that need context from previous data points.
     * Default: false
     *
     * Note: Band 0 never receives overlap (no previous band exists).
     * Fixed overlap size of 1 element (see "Overlap Handling Rules" for rationale).
     *
     * Example: Interval calculation needs prev value to compute interval
     */
    needsOverlap?: boolean; // default: false
};
```

### Phase 3: Update Interval Reducers

**File:** `packages/ag-charts-community/src/chart/data/processors.ts`

**Key insight:** The reducer implementation itself is **completely unchanged**! We only add banding metadata.

```typescript
export const SMALLEST_KEY_INTERVAL: ReducerOutputPropertyDefinition<'smallestKeyInterval'> = {
    type: 'reducer',
    property: 'smallestKeyInterval',
    initialValue: Infinity,

    // Reducer implementation - UNCHANGED!
    reducer() {
        let prevX = Number.NaN;
        return function smallestKeyIntervalReducerFn(smallestSoFar, keys) {
            const key = keys[0];
            const nextX = typeof key === 'number' ? key : Number(key);
            if (!Number.isFinite(nextX)) return smallestSoFar;
            const prevX2 = prevX;
            prevX = nextX;
            if (!Number.isFinite(prevX)) return smallestSoFar;

            const interval = Math.abs(nextX - prevX2);
            const currentSmallest = smallestSoFar ?? Infinity;
            if (interval > 0 && interval < currentSmallest) {
                return interval;
            }
            return currentSmallest;
        };
    },

    // NEW: Banding support
    supportsBanding: true,
    combineResults: (bandResults) => {
        const validResults = bandResults.filter(Number.isFinite);
        return validResults.length > 0 ? Math.min(...validResults) : Infinity;
    },
    needsOverlap: true, // Include last point from prev band
};

export const LARGEST_KEY_INTERVAL: ReducerOutputPropertyDefinition<'largestKeyInterval'> = {
    type: 'reducer',
    property: 'largestKeyInterval',
    initialValue: -Infinity,

    // Reducer implementation - UNCHANGED!
    reducer() {
        let prevX = Number.NaN;
        return function largestKeyIntervalReducerFn(largestSoFar, keys) {
            const key = keys[0];
            const nextX = typeof key === 'number' ? key : Number(key);
            if (!Number.isFinite(nextX)) return largestSoFar;
            const prevX2 = prevX;
            prevX = nextX;
            if (!Number.isFinite(prevX)) return largestSoFar;

            const interval = Math.abs(nextX - prevX2);
            const currentLargest = largestSoFar ?? -Infinity;
            if (interval > 0 && interval > currentLargest) {
                return interval;
            }
            return currentLargest;
        };
    },

    // NEW: Banding support
    supportsBanding: true,
    combineResults: (bandResults) => {
        const validResults = bandResults.filter(Number.isFinite);
        return validResults.length > 0 ? Math.max(...validResults) : -Infinity;
    },
    needsOverlap: true,
};
```

### Phase 4: Incremental Processor Integration

**File:** `packages/ag-charts-community/src/chart/data/data-model/incremental/incrementalProcessor.ts`

**Key:** Generic implementation that works with **any** reducer that defines `combineResults`.

**Important:** Banding applies to **both** processing paths when dataset exceeds threshold (1000+ points):

-   **Initial processing** (`processData()`): Use banding for large datasets from the start
-   **Incremental updates** (`reprocessData()`): Use banding to update only dirty bands

This ensures consistent performance optimization regardless of how data is loaded.

#### 4a. Add storage symbol and type definition

**File:** `packages/ag-charts-community/src/chart/data/dataModelTypes.ts`

```typescript
// Add symbol export alongside DOMAIN_BANDS
export const REDUCER_BANDS = Symbol('reducer-bands');
```

**File:** `packages/ag-charts-community/src/chart/data/data-model/incremental/incrementalProcessor.ts`

```typescript
import { REDUCER_BANDS } from '../../dataModelTypes';
import { BandManager } from '../reducers/bandManager';

// ProcessedData already has symbol indexer, so no interface changes needed
// Usage: processedData[REDUCER_BANDS] as Map<string, BandManager> | undefined
```

#### 4b. Initialize bands during initial data processing

**Pattern:** Follow the same approach as `DOMAIN_BANDS` initialization.

**File:** `packages/ag-charts-community/src/chart/data/data-model/extraction/dataExtractor.ts`

```typescript
import { REDUCER_BANDS } from '../../dataModelTypes';

// In the return statement of extract() method:
return {
    // ... existing properties
    [REDUCER_BANDS]: new Map(), // Initialize empty map for reducer bands
} satisfies UngroupedData<D>;
```

**File:** `packages/ag-charts-community/src/chart/data/data-model/domain/domainManager.ts`

Add method to process banded reducers during initial data processing:

```typescript
/**
 * Process banded reducers during initial data extraction.
 * Creates BandManager instances and computes initial cached results.
 */
private processBandedReducers(processedData: ProcessedData<D>): void {
    const bandedReducers = this.ctx.reducers.filter(r => r.supportsBanding);
    if (bandedReducers.length === 0) return;

    // Initialize storage
    if (!processedData[REDUCER_BANDS]) {
        processedData[REDUCER_BANDS] = new Map();
    }

    const reducerBands = processedData[REDUCER_BANDS] as Map<string, BandManager>;

    for (const reducerDef of bandedReducers) {
        if (!reducerDef.combineResults) continue;

        const bandManager = new BandManager();
        bandManager.initializeBands(processedData.data.length);
        reducerBands.set(reducerDef.property, bandManager);

        // Compute initial results for all bands
        const bands = bandManager.getBands();
        const bandResults: any[] = [];

        for (const band of bands) {
            // Slice data for this band
            const startIdx = reducerDef.needsOverlap && band.startIndex > 0
                ? Math.max(0, band.startIndex - 1)
                : band.startIndex;
            const dataSlice = processedData.data.slice(startIdx, band.endIndex);

            // Run reducer on this slice
            const reducerFn = reducerDef.reducer();
            let result = reducerDef.initialValue;
            for (const item of dataSlice) {
                result = reducerFn(result, item.keys);
            }

            // Cache result and mark clean
            band.cachedResult = result;
            band.isDirty = false;
            bandResults.push(result);
        }

        // Combine and store final result
        const finalResult = reducerDef.combineResults(bandResults);
        if (!processedData.reduced) {
            processedData.reduced = {};
        }
        processedData.reduced[reducerDef.property] = finalResult;
    }
}
```

**Call from `recomputeDomains()`:**

```typescript
recomputeDomains(processedData: ProcessedData<D>): void {
    // ... existing domain computation

    // NEW: Process banded reducers during initial data processing
    this.processBandedReducers(processedData);
}
```

This ensures that:

1. `[REDUCER_BANDS]` is initialized with `BandManager` instances during initial processing
2. All bands have cached results populated from the start
3. Incremental updates can reuse these cached results
4. Pattern matches `DOMAIN_BANDS` initialization in `dataExtractor.ts`

#### 4c. Update isReprocessingSupported

```typescript
isReprocessingSupported(processedData: ProcessedData<D>): boolean {
    // ... existing grouped data constraints ...

    // OLD: if (this.ctx.reducers.length > 0) return false;

    // NEW: Only block if there are unsupported reducers
    const hasUnsupportedReducers = this.ctx.reducers.some(r => !r.supportsBanding);
    if (hasUnsupportedReducers) return false;

    if (this.ctx.aggregates.length > 0) return false;
    if (this.ctx.processors.length > 0) return false;
    if (this.ctx.propertyProcessors.length > 0) return false;

    return this.ctx.groupProcessors.every((p) => p.supportsReprocessing ?? false);
}
```

#### 4d. Add reprocessBandedReducers method

```typescript
/**
 * Generic banded reducer reprocessing.
 * Works with ANY reducer that defines combineResults and supportsBanding.
 *
 * IMPORTANT: This assumes processedData.data is globally sorted and unique,
 * which is a pre-requisite for incremental processing (enforced by isReprocessingSupported).
 * Simple array slicing by band indices is safe because data is one flat sorted array.
 */
private reprocessBandedReducers(
    processedData: ProcessedData<D>,
    scopeChanges: Map<ScopeId, DataChangeDescription>
): void {
    const bandedReducers = this.ctx.reducers.filter(r => r.supportsBanding);
    if (bandedReducers.length === 0) return;

    // Initialize storage if needed
    if (!processedData[REDUCER_BANDS]) {
        processedData[REDUCER_BANDS] = new Map();
    }

    // Deduplicate change descriptions (same as updateBandsForChanges)
    const processedChangeDescs = new Set<DataChangeDescription>();
    for (const [, changeDesc] of scopeChanges) {
        if (changeDesc) processedChangeDescs.add(changeDesc);
    }

    // Process each banded reducer
    for (const reducerDef of bandedReducers) {
        if (!reducerDef.supportsBanding || !reducerDef.combineResults) continue;

        const property = reducerDef.property;
        let bandManager = processedData[REDUCER_BANDS].get(property);

        // Initialize if needed
        if (!bandManager) {
            bandManager = new BandManager();
            bandManager.initializeBands(processedData.data.length);
            processedData[REDUCER_BANDS].set(property, bandManager);
        }

        // Apply all change operations to bands
        for (const changeDesc of processedChangeDescs) {
            for (const op of changeDesc.indexMap.spliceOps) {
                if (op.insertCount > 0) {
                    bandManager.handleInsertion(op.index, op.insertCount);
                }
                if (op.deleteCount > 0) {
                    bandManager.handleRemoval(op.index, op.deleteCount);
                }
            }
        }

        // Recompute dirty bands by running the STANDARD reducer on each
        const bands = bandManager.getBands();
        const bandResults: any[] = [];

        for (const band of bands) {
            if (!band.isDirty && band.cachedResult !== undefined) {
                // Use cached result
                bandResults.push(band.cachedResult);
                continue;
            }

            // Slice data for this band
            // Band 0 never gets overlap due to band.startIndex > 0 check
            const startIdx = reducerDef.needsOverlap && band.startIndex > 0
                ? Math.max(0, band.startIndex - 1)  // Include last point from prev band (defense-in-depth)
                : band.startIndex;
            const dataSlice = processedData.data.slice(startIdx, band.endIndex);

            // Run the STANDARD reducer on this slice
            const reducerFn = reducerDef.reducer();
            let result = reducerDef.initialValue;
            for (const item of dataSlice) {
                result = reducerFn(result, item.keys);
            }

            // Cache result and mark clean
            band.cachedResult = result;
            band.isDirty = false;
            bandResults.push(result);
        }

        // Combine all band results using the combiner function
        const finalResult = reducerDef.combineResults(bandResults);

        // Update processedData.reduced with new value
        if (!processedData.reduced) {
            processedData.reduced = {};
        }
        processedData.reduced[property] = finalResult;
    }
}
```

#### 4e. Call from reprocessData

```typescript
reprocessData(
    processedData: ProcessedData<D>,
    dataSets: Map<DataSet<D>, DataChangeDescription | undefined>
): ProcessedData<D> {
    // ... existing code for extracting scope changes ...

    // Update data arrays in-place
    this.updateDataArrays(processedData, scopeChanges);

    // Update domain bands (existing)
    this.updateBandsForChanges(processedData, scopeChanges);

    // NEW: Update reducer bands (generic for all banded reducers)
    this.reprocessBandedReducers(processedData, scopeChanges);

    // ... rest of reprocessing ...

    return processedData;
}
```

### Phase 5: Testing

**Test File:** `packages/ag-charts-community/src/chart/data/data-model/reducers/bandManager.test.ts`

```typescript
import { BandManager } from './bandManager';

describe('BandManager', () => {
    describe('initializeBands', () => {
        it('should create single band for small datasets', () => {
            const manager = new BandManager({ minDataSizeForBanding: 1000 });
            manager.initializeBands(500);
            expect(manager.getBands()).toHaveLength(1);
            expect(manager.getBands()[0]).toMatchObject({
                startIndex: 0,
                endIndex: 500,
                isDirty: true,
            });
        });

        it('should create multiple bands for large datasets', () => {
            const manager = new BandManager({ targetBandCount: 10 });
            manager.initializeBands(10000);
            const bands = manager.getBands();
            expect(bands.length).toBeGreaterThanOrEqual(10);
            // Verify bands cover full range without gaps
            expect(bands[0].startIndex).toBe(0);
            expect(bands[bands.length - 1].endIndex).toBe(10000);
        });
    });

    describe('handleInsertion', () => {
        it('should shift bands after insertion point', () => {
            const manager = new BandManager();
            manager.initializeBands(100);
            manager.handleInsertion(20, 10);
            // Verify bands after index 20 are shifted
        });

        it('should mark affected bands as dirty', () => {
            const manager = new BandManager();
            manager.initializeBands(100);
            const bands = manager.getBands();
            bands.forEach((b) => (b.isDirty = false)); // Reset dirty flags

            manager.handleInsertion(50, 10);
            // Verify only affected bands are dirty
        });
    });

    describe('handleRemoval', () => {
        it('should shrink affected bands', () => {
            const manager = new BandManager();
            manager.initializeBands(100);
            manager.handleRemoval(20, 10);
            // Verify bands are correctly adjusted
        });

        it('should remove empty bands', () => {
            const manager = new BandManager();
            manager.initializeBands(100);
            const initialCount = manager.getBands().length;
            manager.handleRemoval(0, 100); // Remove all data
            expect(manager.getBands().length).toBeLessThan(initialCount);
        });
    });

    describe('rolling window scenario', () => {
        it('should efficiently mark only affected bands as dirty', () => {
            const manager = new BandManager({ targetBandCount: 10 });
            manager.initializeBands(10000);
            const bands = manager.getBands();
            bands.forEach((b) => (b.isDirty = false)); // Mark all clean

            // Simulate rolling window: remove 100 from start, add 100 to end
            manager.handleRemoval(0, 100);
            manager.handleInsertion(10000 - 100, 100);

            const stats = manager.getStats();
            // Verify only ~20% of bands are dirty
            expect(stats.scanRatio).toBeLessThan(0.3);
        });
    });

    describe('band splitting', () => {
        it('should split oversized bands during insertion', () => {
            const manager = new BandManager({ targetBandCount: 10, minDataSizeForBanding: 1000 });
            manager.initializeBands(10000);
            const initialBandCount = manager.getBands().length;

            // Simulate many insertions to the last band
            for (let i = 0; i < 200; i++) {
                manager.handleInsertion(10000 + i, 1);
            }

            // Should have created additional bands via splitting
            expect(manager.getBands().length).toBeGreaterThan(initialBandCount);
        });

        it('should mark both split bands as dirty', () => {
            const manager = new BandManager({ targetBandCount: 10, minDataSizeForBanding: 1000 });
            manager.initializeBands(10000);
            const bands = manager.getBands();

            // Mark all clean and cache some results
            bands.forEach((band, i) => {
                band.isDirty = false;
                band.cachedResult = i * 100;
            });

            const initialBandCount = bands.length;

            // Trigger split by inserting many points to last band
            for (let i = 0; i < 200; i++) {
                manager.handleInsertion(10000 + i, 1);
            }

            // After split, new bands should be dirty
            const newBands = manager.getBands();
            if (newBands.length > initialBandCount) {
                // Last bands should be dirty (from splitting)
                expect(newBands[newBands.length - 1].isDirty).toBe(true);
                expect(newBands[newBands.length - 2].isDirty).toBe(true);
            }
        });

        it('should split bands evenly', () => {
            const manager = new BandManager({ targetBandCount: 10, minDataSizeForBanding: 1000 });
            manager.initializeBands(1000);

            // Force a band to grow significantly
            manager.handleInsertion(1000, 500); // Add 500 points to last band

            const bands = manager.getBands();
            const lastBands = bands.slice(-2);

            // If split occurred, verify both bands are roughly equal in size
            if (bands.length > 10) {
                const size1 = lastBands[0].endIndex - lastBands[0].startIndex;
                const size2 = lastBands[1].endIndex - lastBands[1].startIndex;
                const ratio = Math.max(size1, size2) / Math.min(size1, size2);
                expect(ratio).toBeLessThan(2); // Should be within 2x of each other
            }
        });
    });
});
```

**Test File:** `packages/ag-charts-community/src/chart/data/data-model/reducers/bandedReducers.test.ts`

```typescript
import { LARGEST_KEY_INTERVAL, SMALLEST_KEY_INTERVAL } from '../../processors';

describe('Banded Reducer Integration', () => {
    describe('interval correctness with banding', () => {
        it('should match full-scan results for simple case', () => {
            const data = [[10], [20], [25], [30], [40]];

            // Full scan
            const fullScanFn = SMALLEST_KEY_INTERVAL.reducer();
            let fullResult = SMALLEST_KEY_INTERVAL.initialValue;
            for (const keys of data) {
                fullResult = fullScanFn(fullResult, keys);
            }

            // Banded (simulate 2 bands)
            const band1Fn = SMALLEST_KEY_INTERVAL.reducer();
            let band1Result = SMALLEST_KEY_INTERVAL.initialValue;
            for (const keys of data.slice(0, 3)) {
                band1Result = band1Fn(band1Result, keys);
            }

            const band2Fn = SMALLEST_KEY_INTERVAL.reducer();
            let band2Result = SMALLEST_KEY_INTERVAL.initialValue;
            // Include overlap (last point from band 1)
            for (const keys of data.slice(2, 5)) {
                band2Result = band2Fn(band2Result, keys);
            }

            const bandedResult = SMALLEST_KEY_INTERVAL.combineResults!([band1Result, band2Result]);

            expect(bandedResult).toBe(fullResult); // Should match!
        });

        it('should handle cross-band intervals correctly', () => {
            const data = [[10], [20], [40], [42]]; // Min interval = 2 (between 40 and 42)

            // Band 0: [10, 20, 40]
            const band1Fn = SMALLEST_KEY_INTERVAL.reducer();
            let band1Result = SMALLEST_KEY_INTERVAL.initialValue;
            for (const keys of data.slice(0, 3)) {
                band1Result = band1Fn(band1Result, keys);
            }

            // Band 1: [40, 42] (includes overlap)
            const band2Fn = SMALLEST_KEY_INTERVAL.reducer();
            let band2Result = SMALLEST_KEY_INTERVAL.initialValue;
            for (const keys of data.slice(2, 4)) {
                band2Result = band2Fn(band2Result, keys);
            }

            const bandedResult = SMALLEST_KEY_INTERVAL.combineResults!([band1Result, band2Result]);
            expect(bandedResult).toBe(2); // Correctly finds cross-band minimum
        });

        it('should handle Band 0 with needsOverlap correctly (no overlap)', () => {
            const data = [[10], [20], [30]]; // Band 0 with 3 points

            // Band 0 should NOT get overlap (no previous band exists)
            const band0Fn = SMALLEST_KEY_INTERVAL.reducer();
            let band0Result = SMALLEST_KEY_INTERVAL.initialValue;
            for (const keys of data) {
                band0Result = band0Fn(band0Result, keys);
            }

            // Result should be 10 (interval between 10 and 20)
            expect(band0Result).toBe(10);
        });

        it('should handle all-NaN data by returning initialValue', () => {
            const data = [[NaN], [NaN], [NaN]];

            // Process with reducer
            const reducerFn = SMALLEST_KEY_INTERVAL.reducer();
            let result = SMALLEST_KEY_INTERVAL.initialValue;
            for (const keys of data) {
                result = reducerFn(result, keys);
            }

            // Simulate banding with single band
            const bandResults = [result];
            const combinedResult = SMALLEST_KEY_INTERVAL.combineResults!(bandResults);

            // Should return initialValue (Infinity) when no valid intervals
            expect(combinedResult).toBe(Infinity);
        });

        it('should handle empty bands correctly', () => {
            // Simulate empty bands producing no valid results
            const bandResults: number[] = [];
            const combinedResult = SMALLEST_KEY_INTERVAL.combineResults!(bandResults);

            // Should return initialValue when all bands are empty
            expect(combinedResult).toBe(Infinity);
        });

        it('should handle mix of valid and invalid band results', () => {
            // Simulate some bands with valid results, some with Infinity
            const bandResults = [Infinity, 5, Infinity, 10, Infinity];
            const combinedResult = SMALLEST_KEY_INTERVAL.combineResults!(bandResults);

            // Should correctly find minimum of valid results
            expect(combinedResult).toBe(5);
        });
    });
});
```

**Integration Test:** `packages/ag-charts-community/src/chart/series/cartesian/barSeries.test.ts`

```typescript
describe('BarSeries applyTransaction with banded reducers', () => {
    it('should use banded incremental updates for large datasets', async () => {
        // Setup bar chart with 10K data points
        // Apply transaction with small update
        // Verify incremental path was taken (check processedData[REDUCER_BANDS])
        // Verify intervals are correct
    });

    it('should fall back to full reprocessing for small datasets', async () => {
        // Setup bar chart with 500 data points
        // Verify no banding overhead
    });
});
```

### Phase 6: Optimization Metadata (Required for Debugging)

Add to `ProcessedData` for tracking banding effectiveness:

```typescript
interface ProcessedData<D> {
    // ... existing properties

    // Optimization metadata (required for debugging and monitoring)
    optimizations: {
        reducerBanding?: {
            applied: boolean; // Whether banding was used
            reason?: string; // Why banding was/wasn't applied (e.g., "dataset too small", "no banded reducers")
            bandCount?: number; // Number of bands created
            stats: {
                totalBands: number; // Total number of bands
                dirtyBands: number; // Number of bands marked dirty in last update
                dataSize: number; // Total data points
                scanRatio: number; // Ratio of data scanned vs total (0.0-1.0)
                cacheHits: number; // Number of bands using cached results
            };
        };
    };
}
```

**When to populate:**

-   `processData()`: Initialize stats when banding is first applied
-   `reprocessData()`: Update stats after each incremental update
-   Use `BandManager.getStats()` to extract current statistics

**Purpose:**

-   **Development:** Verify banding is working as expected
-   **Debugging:** Diagnose performance issues
-   **Monitoring:** Track effectiveness in production (via telemetry)

## Design Summary

### Files Modified

1. ✏️ **NEW:** `data-model/reducers/bandManager.ts` - Generic band lifecycle management (~250 lines)
2. ✏️ **NEW:** `data-model/reducers/bandManager.test.ts` - Band manager tests (~100 lines)
3. ✏️ **NEW:** `data-model/reducers/bandedReducers.test.ts` - Integration tests (~60 lines)
4. ✏️ `dataModelTypes.ts` - Add 3 optional fields to `ReducerOutputPropertyDefinition` (~15 lines)
5. ✏️ `processors.ts` - Add banding metadata to interval reducers (**3 lines each = 6 lines total!**)
6. ✏️ `incrementalProcessor.ts` - Remove blocker, add `reprocessBandedReducers()` (~80 lines)

**Total:** ~500 lines of new code, mostly generic infrastructure and tests
**Impact on existing reducers:** 6 lines (just metadata!)

### Key Advantages

✅ **Reducer simplicity** - Zero changes to reducer implementation logic
✅ **Reusability** - Generic `BandManager` works for any reducer (min, max, sum, average, etc.)
✅ **Testability** - Reducers remain testable independently of banding optimization
✅ **Extensibility** - Adding banding to new reducers requires only 3 metadata fields
✅ **Correctness** - Overlap strategy naturally handles cross-band state without special cases
✅ **Clean separation** - Banding is purely an infrastructure optimization, invisible to reducer logic
✅ **Architectural consistency** - Mirrors proven `BandedDomain` pattern

## Edge Cases to Handle

1. **Empty bands after deletion:** Removed from band array automatically
2. **Cross-band intervals:** Handled automatically via `needsOverlap` flag and data slicing
3. **Non-finite values:** Filtered same as current reducer (check `Number.isFinite`)
4. **First/last band edge cases:** Special handling for boundary insertions (last band can receive insertions at `endIndex`)
5. **Oversized bands:** Proactively split when exceeding `idealBandSize * 1.1`
6. **Small datasets:** No banding overhead below threshold (1000 points)
7. **Single-point bands:** Handle gracefully (no intervals possible, returns initialValue)
8. **Concurrent operations:** Multiple splice ops in single transaction processed sequentially
9. **Band splitting edge cases:** Handle bands that would split unevenly (use `Math.floor` for first half)

## Rollout Strategy

1. **Implement core infrastructure** with comprehensive tests
2. **Enable for bar series** as initial use case
3. **Monitor performance** metrics in development
4. **Benchmark** against current implementation
5. **Optional feature flag** for gradual rollout
6. **Expand to other series** if successful

## Future Enhancements

### Potential Optimizations

1. **Smart removal handling:** Track which bands contribute to global min/max, only rescan if removed
2. **Adaptive band sizing:** Adjust band count based on update patterns
3. **Parallel band computation:** Process dirty bands concurrently
4. **Incremental merging:** Cache partial results during merge phase

### Other Banded Reducers

If this pattern proves successful, consider banding for:

-   Running averages
-   Cumulative sums
-   Custom aggregate functions

## References

### Key Files

-   `packages/ag-charts-community/src/chart/data/data-model/domain/domainManager.ts` - BandedDomain implementation
-   `packages/ag-charts-community/src/chart/data/data-model/incremental/incrementalProcessor.ts` - Incremental processing
-   `packages/ag-charts-community/src/chart/data/processors.ts` - Current interval reducers
-   `packages/ag-charts-community/src/chart/series/cartesian/abstractBarSeries.ts` - Interval usage

### Related Patterns

-   **BandedDomain:** Template for banding architecture
-   **Group processors:** Incremental reprocessing pattern
-   **Domain bands:** Dirty marking and selective recalculation

## Success Criteria

✅ All existing tests pass
✅ New banding tests achieve 100% coverage
✅ Banded results exactly match full-scan results (correctness)
✅ Rolling window benchmark shows 10x+ improvement for 10K+ datasets
✅ Small datasets have no performance regression
✅ Integration test confirms incremental path is used
✅ Edge cases handled correctly (cross-band intervals, empty bands, etc.)

## Estimated Effort

-   **Core implementation:** 1.5 days (includes band splitting and initial processing path)
-   **Testing:** 1 day (includes Band 0, empty results, and band splitting tests)
-   **Integration & debugging:** 0.5 days
-   **Documentation & review:** 0.5 days
-   **Total:** ~3.5 days

Note: Proactive band splitting approach is simpler than reactive rebalancing, reducing implementation complexity.

## Design Questions Resolved

The following questions were addressed during design review:

1. **Feature flag for gradual rollout?**

    - **Decision:** No feature flag needed. Threshold-based opt-in (1000+ points) provides sufficient control.

2. **Performance numbers verified?**

    - **Decision:** Proceed with implementation and measure actual gains. Theoretical projections are reasonable.

3. **Banding in initial processing or incremental only?**

    - **Decision:** Use banding in both `processData()` and `reprocessData()` when dataset exceeds threshold for consistency.

4. **Proactive band splitting vs reactive rebalancing?**

    - **Decision:** Proactive splitting with 1.1x threshold. When a band exceeds `idealBandSize * 1.1` during insertion, split it immediately. Much simpler and cheaper than reactive rebalancing (only rescan split band vs full dataset).

5. **Metadata tracking optional or required?**

    - **Decision:** Required for debugging and monitoring. Use `optimizations` field in `ProcessedData`.

6. **combineResults signature?**

    - **Decision:** Array-based: `(bandResults[]) => result` (single pass, not accumulator).

7. **Finalize hook needed?**

    - **Decision:** No, `combineResults` handles all post-processing including filtering invalid values.

8. **Variable overlap size?**

    - **Decision:** Fixed 1 element. Can add `overlapSize?: number` later if needed.

9. **Overlap edge cases?**

    - **Decision:** Skip overlap if impossible (Band 0, empty/single-point bands processed as-is).

10. **Config design?**
    - **Decision:** Mirror `BandedDomainConfig` exactly for consistency (minDataSizeForBanding: 1000, targetBandCount: 10).

## Implementation Clarifications

During detailed design review, the following implementation details were clarified:

### Initial Data Processing (processData)

**Question:** Where should BandManager instances be created and cached results populated during initial processData()?

**Answer:** Follow the `DOMAIN_BANDS` pattern:

1. **Initialize storage in dataExtractor.ts:** Add `[REDUCER_BANDS]: new Map()` to initial ProcessedData
2. **Process during domain computation:** Add `processBandedReducers()` method to `domainManager.ts`, called from `recomputeDomains()`
3. **Populate all bands:** Compute initial cached results for all bands during first pass
4. **Incremental updates reuse:** `reprocessBandedReducers()` in `incrementalProcessor.ts` updates only dirty bands

See Phase 4b for complete implementation showing where to initialize, populate, and seed `[REDUCER_BANDS]`.

### Cache Hits Tracking

**Question:** `BandManager.getStats()` doesn't track cacheHits, but metadata requires it. Should we add it or remove from metadata?

**Answer:** Add to `getStats()`:

```typescript
cacheHits: cleanBands.length; // Bands using cached results (not dirty, has cachedResult)
```

This counts bands with `!isDirty && cachedResult !== undefined`, providing accurate cache hit metrics per cycle.

### Band Splitting Strategy

**Question:** When should bands be split and what threshold should trigger splitting?

**Answer:** Proactive splitting with 1.1x threshold:

1. **Calculate on every insertion:** `maxBandSize = Math.ceil(idealBandSize * 1.1)`
2. **Split immediately:** When a band exceeds maxBandSize, split it into two bands
3. **Both bands marked dirty:** Splitting indicates data changed, no cache preservation
4. **Split point:** `Math.min(idealSize, Math.floor(bandSize / 2))` to create roughly equal halves

This is much simpler and cheaper than reactive rebalancing (only rescan ~1.1K points per split vs 10K+ for full reinitialization).

### Multi-Band Deletion Handling

**Question:** Current handleRemoval logic doesn't properly cascade deletions spanning multiple bands. What's correct?

**Answer:** Fix cascade logic to handle all deletion scenarios:

1. **Deletion before band:** Shift both boundaries back by removeCount
2. **Deletion after band:** No changes
3. **Deletion overlaps band:** Mark dirty and adjust based on overlap type:
    - Band fully contained in deletion: Set both boundaries to removeIndex (will be filtered out)
    - Deletion overlaps start: Adjust startIndex and endIndex
    - Deletion overlaps end: Adjust endIndex only
    - Deletion within band: Shrink endIndex by removeCount

See updated Phase 1 `handleRemoval()` for correct implementation.

### Data Slicing and Scopes

**Question:** Does `processedData.data` respect scopes or is it globally sorted? Is simple slicing safe?

**Answer:** **Globally sorted can be assumed** - this is a pre-requisite for incremental processing (enforced by `isReprocessingSupported`):

-   `processedData.data` is one flat sorted array
-   Simple array slicing by band indices is safe
-   No need to filter by `scopeChanges` during slicing
-   Documentation added to `reprocessBandedReducers()` method clarifying this assumption

This matches the existing incremental processing model which requires sorted, unique data.
