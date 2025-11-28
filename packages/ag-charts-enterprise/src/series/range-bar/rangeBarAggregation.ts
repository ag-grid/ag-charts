import { _ModuleSupport } from 'ag-charts-community';
import type { ScaleType } from 'ag-charts-core';
import { nextPowerOf2, simpleMemorize2 } from 'ag-charts-core';

const {
    AGGREGATION_SPAN,
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    AGGREGATION_MIN_RANGE,
    AGGREGATION_THRESHOLD,
    aggregationDomain,
    aggregationRangeFittingPoints,
    compactAggregationIndices,
    createAggregationIndices,
} = _ModuleSupport;

export const START = AGGREGATION_INDEX_X_MIN;
export const HIGH = AGGREGATION_INDEX_Y_MAX;
export const LOW = AGGREGATION_INDEX_Y_MIN;
export const END = AGGREGATION_INDEX_X_MAX;
export const SPAN = AGGREGATION_SPAN;

export interface RangeBarSeriesDataAggregationFilter {
    indexData: Uint32Array;
    valueData: Float64Array;
    maxRange: number;
    midpointIndices: Uint32Array;
}

export interface RangeBarPartialAggregationResult {
    /** Levels computed immediately (includes the target level) */
    immediate: RangeBarSeriesDataAggregationFilter[];
    /** Function to compute remaining coarser levels, or undefined if all levels computed */
    computeRemaining?: () => RangeBarSeriesDataAggregationFilter[];
}

function getMidpoints(maxRange: number, indexData: Uint32Array, reuseMidpointData?: Uint32Array): Uint32Array {
    const midpoints =
        reuseMidpointData && reuseMidpointData.length === maxRange ? reuseMidpointData : new Uint32Array(maxRange);
    for (let i = 0, offset = 0; i < maxRange; i += 1, offset += SPAN) {
        const xMinIndex = indexData[offset + START];
        const xMaxIndex = indexData[offset + END];
        midpoints[i] = xMinIndex === -1 ? -1 : (xMinIndex + xMaxIndex) >> 1;
    }
    return midpoints;
}

// ============================================================================
// CORE LAYER: Pure, testable aggregation functions
// ============================================================================

/**
 * Computes multi-level aggregation filters for Range Bar chart data.
 *
 * Creates progressively coarser aggregation levels for efficient rendering
 * of large datasets. Tracks Start/High/Low/End values as extrema indices
 * within each aggregation bucket.
 *
 * @param domain - Numeric domain bounds [min, max] for X values
 * @param xValues - X coordinate values (typically category or time)
 * @param highValues - High values for each range bar
 * @param lowValues - Low values for each range bar
 * @param options - Configuration options
 * @param options.smallestKeyInterval - Smallest interval between X keys
 * @param options.xNeedsValueOf - Whether X values need valueOf() conversion
 * @param options.yNeedsValueOf - Whether Y values need valueOf() conversion
 * @param options.existingFilters - Optional existing filters for array reuse
 * @returns Array of aggregation filters from coarse to fine resolution, or undefined if below threshold
 *
 * @complexity O(n * log(levels)) where n is data points and levels ≈ log2(maxRange/64)
 * @memory Creates TypedArrays for index storage
 *
 * @example
 * const filters = computeRangeBarAggregation(
 *   [0, 1000],
 *   timestamps,
 *   highs,
 *   lows,
 *   { smallestKeyInterval: undefined, xNeedsValueOf: false, yNeedsValueOf: false }
 * );
 * // Returns filters with range bar extrema indices for efficient rendering
 */
export function computeRangeBarAggregation(
    domain: [number, number],
    xValues: any[],
    highValues: any[],
    lowValues: any[],
    options: {
        smallestKeyInterval: number | undefined;
        xNeedsValueOf: boolean;
        yNeedsValueOf: boolean;
        existingFilters?: RangeBarSeriesDataAggregationFilter[];
    }
): RangeBarSeriesDataAggregationFilter[] | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = domain;
    const { smallestKeyInterval, xNeedsValueOf, yNeedsValueOf, existingFilters } = options;

    let maxRange = aggregationRangeFittingPoints(xValues, d0, d1, { smallestKeyInterval, xNeedsValueOf });

    // Find existing filter at finest level for array reuse
    const existingFilter = existingFilters?.find((f) => f.maxRange === maxRange);

    let { indexData, valueData } = createAggregationIndices(xValues, highValues, lowValues, d0, d1, maxRange, {
        xNeedsValueOf,
        yNeedsValueOf,
        reuseIndexData: existingFilter?.indexData,
        reuseValueData: existingFilter?.valueData,
    });
    let midpointIndices = getMidpoints(maxRange, indexData, existingFilter?.midpointIndices);

    const filters: RangeBarSeriesDataAggregationFilter[] = [
        {
            maxRange,
            indexData,
            valueData,
            midpointIndices,
        },
    ];

    // Build coarser aggregation levels with array reuse (like OHLC aggregation)
    while (maxRange > AGGREGATION_MIN_RANGE) {
        const currentMaxRange = maxRange;
        const nextMaxRange = Math.trunc(currentMaxRange / 2);

        // Find existing filter at target level for array reuse
        const nextExistingFilter = existingFilters?.find((f) => f.maxRange === nextMaxRange);

        const compacted = compactAggregationIndices(indexData, valueData, currentMaxRange, {
            reuseIndexData: nextExistingFilter?.indexData,
            reuseValueData: nextExistingFilter?.valueData,
        });

        maxRange = compacted.maxRange;
        indexData = compacted.indexData;
        valueData = compacted.valueData;
        midpointIndices =
            compacted.midpointData ?? getMidpoints(maxRange, indexData, nextExistingFilter?.midpointIndices);

        filters.push({
            maxRange,
            indexData,
            valueData,
            midpointIndices,
        });
    }

    filters.reverse();

    return filters;
}

/**
 * Computes Range Bar aggregation with deferred full recomputation.
 *
 * For real-time data updates, this computes only the single aggregation level
 * needed for the current zoom, deferring a full recomputation of all levels
 * to idle time. This design enables future incremental updates to focus on
 * just the immediate level, while deferred processing handles full rebuilds.
 *
 * @param domain - Numeric domain bounds [min, max] for X values
 * @param xValues - X coordinate values (typically category or time)
 * @param highValues - High values for each range bar
 * @param lowValues - Low values for each range bar
 * @param options - Configuration options including targetRange
 * @param options.targetRange - The current pixel range for determining bucket count
 * @returns Partial result with the immediate level and a function to compute all levels
 */
export function computeRangeBarAggregationPartial(
    domain: [number, number],
    xValues: any[],
    highValues: any[],
    lowValues: any[],
    options: {
        smallestKeyInterval: number | undefined;
        targetRange: number;
        xNeedsValueOf: boolean;
        yNeedsValueOf: boolean;
        existingFilters?: RangeBarSeriesDataAggregationFilter[];
    }
): RangeBarPartialAggregationResult | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = domain;
    const { smallestKeyInterval, targetRange, xNeedsValueOf, yNeedsValueOf, existingFilters } = options;

    // Calculate the finest level bucket count (based on data density)
    const finestMaxRange = aggregationRangeFittingPoints(xValues, d0, d1, { smallestKeyInterval, xNeedsValueOf });

    // Calculate target bucket count: next power of 2 >= targetRange, clamped to valid range
    const targetMaxRange = Math.min(finestMaxRange, nextPowerOf2(Math.max(targetRange, AGGREGATION_MIN_RANGE)));

    // Find existing filter at matching maxRange for array reuse
    const existingFilter = existingFilters?.find((f) => f.maxRange === targetMaxRange);

    // Create aggregation at exactly the target level - single O(n) scan
    const { indexData, valueData } = createAggregationIndices(xValues, highValues, lowValues, d0, d1, targetMaxRange, {
        xNeedsValueOf,
        yNeedsValueOf,
        reuseIndexData: existingFilter?.indexData,
        reuseValueData: existingFilter?.valueData,
    });
    const midpointIndices = getMidpoints(targetMaxRange, indexData, existingFilter?.midpointIndices);

    const immediateLevel: RangeBarSeriesDataAggregationFilter = {
        maxRange: targetMaxRange,
        indexData,
        valueData,
        midpointIndices,
    };

    // Defer full recomputation of all levels to idle time
    function computeRemaining(): RangeBarSeriesDataAggregationFilter[] {
        const allLevels = computeRangeBarAggregation([d0, d1], xValues, highValues, lowValues, {
            smallestKeyInterval,
            xNeedsValueOf,
            yNeedsValueOf,
            existingFilters,
        });

        // Filter out the immediate level (already computed) to avoid duplicates
        return allLevels?.filter((level) => level.maxRange !== targetMaxRange) ?? [];
    }

    return { immediate: [immediateLevel], computeRemaining };
}

// ============================================================================
// ADAPTER LAYER: Scale integration
// ============================================================================

/**
 * Aggregates Range Bar data for rendering optimization (low-level adapter).
 * Extracts domain from scale and delegates to core aggregation function.
 *
 * @internal
 */
function aggregateRangeBarData(
    scale: ScaleType,
    xValues: any[],
    highValues: any[],
    lowValues: any[],
    domain: number[],
    smallestKeyInterval: number | undefined,
    xNeedsValueOf: boolean,
    yNeedsValueOf: boolean
): RangeBarSeriesDataAggregationFilter[] | undefined {
    const [d0, d1] = aggregationDomain(scale, domain);
    return computeRangeBarAggregation([d0, d1], xValues, highValues, lowValues, {
        smallestKeyInterval,
        xNeedsValueOf,
        yNeedsValueOf,
    });
}

// ============================================================================
// INTEGRATION LAYER: Memoization
// ============================================================================

/**
 * Memoized version of aggregateRangeBarData for internal use.
 * @internal
 */
const memoizedAggregateRangeBarData = simpleMemorize2(aggregateRangeBarData);

/**
 * High-level aggregation function for series integration.
 * Handles data extraction from DataModel and delegates to memoized aggregation.
 *
 * @param scale - The X-axis scale type
 * @param dataModel - Data model containing the processed data
 * @param processedData - Processed data to aggregate
 * @param series - Series context for data model queries
 * @returns Aggregation filters or undefined if aggregation not needed
 */
export function aggregateRangeBarDataFromDataModel(
    scale: ScaleType,
    dataModel: any,
    processedData: any,
    series: any
): RangeBarSeriesDataAggregationFilter[] | undefined {
    const xValues = dataModel.resolveKeysById(series, 'xValue', processedData);
    const highValues = dataModel.resolveColumnById(series, 'yHighValue', processedData);
    const lowValues = dataModel.resolveColumnById(series, 'yLowValue', processedData);

    const { index } = dataModel.resolveProcessedDataDefById(series, 'xValue');
    const domain = processedData.domain.keys[index];

    const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf =
        dataModel.resolveColumnNeedsValueOf(series, 'yHighValue', processedData) ??
        dataModel.resolveColumnNeedsValueOf(series, 'yLowValue', processedData);

    return memoizedAggregateRangeBarData(
        scale,
        xValues,
        highValues,
        lowValues,
        domain,
        processedData.reduced?.smallestKeyInterval,
        xNeedsValueOf,
        yNeedsValueOf
    );
}

/**
 * High-level partial aggregation function for series integration.
 * Computes immediate levels for the target range and defers coarser levels.
 *
 * @param scale - The X-axis scale type
 * @param dataModel - Data model containing the processed data
 * @param processedData - Processed data to aggregate
 * @param series - Series context for data model queries
 * @param targetRange - Current pixel range for determining which levels to compute immediately
 * @param existingFilters - Optional existing filters for array reuse
 * @returns Partial aggregation result with immediate levels and deferred computation function
 */
export function aggregateRangeBarDataFromDataModelPartial(
    scale: ScaleType,
    dataModel: any,
    processedData: any,
    series: any,
    targetRange: number,
    existingFilters?: RangeBarSeriesDataAggregationFilter[]
): RangeBarPartialAggregationResult | undefined {
    const xValues = dataModel.resolveKeysById(series, 'xValue', processedData);
    const highValues = dataModel.resolveColumnById(series, 'yHighValue', processedData);
    const lowValues = dataModel.resolveColumnById(series, 'yLowValue', processedData);

    const { index } = dataModel.resolveProcessedDataDefById(series, 'xValue');
    const domain = processedData.domain.keys[index];

    const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf =
        dataModel.resolveColumnNeedsValueOf(series, 'yHighValue', processedData) ??
        dataModel.resolveColumnNeedsValueOf(series, 'yLowValue', processedData);

    const [d0, d1] = aggregationDomain(scale, domain);
    return computeRangeBarAggregationPartial([d0, d1], xValues, highValues, lowValues, {
        smallestKeyInterval: processedData.reduced?.smallestKeyInterval,
        targetRange,
        xNeedsValueOf,
        yNeedsValueOf,
        existingFilters,
    });
}
