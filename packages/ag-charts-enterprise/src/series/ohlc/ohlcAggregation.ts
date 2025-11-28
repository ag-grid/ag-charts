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

export const OPEN = AGGREGATION_INDEX_X_MIN;
export const HIGH = AGGREGATION_INDEX_Y_MAX;
export const LOW = AGGREGATION_INDEX_Y_MIN;
export const CLOSE = AGGREGATION_INDEX_X_MAX;
export const SPAN = AGGREGATION_SPAN;

export interface OhlcSeriesDataAggregationFilter {
    indexData: Uint32Array;
    valueData: Float64Array;
    maxRange: number;
    midpointIndices: Uint32Array;
}

export interface OhlcPartialAggregationResult {
    /** Levels computed immediately (includes the target level) */
    immediate: OhlcSeriesDataAggregationFilter[];
    /** Function to compute remaining coarser levels, or undefined if all levels computed */
    computeRemaining?: () => OhlcSeriesDataAggregationFilter[];
}

function getMidpoints(maxRange: number, indexData: Uint32Array, reuseMidpointData?: Uint32Array): Uint32Array {
    const midpoints =
        reuseMidpointData && reuseMidpointData.length === maxRange ? reuseMidpointData : new Uint32Array(maxRange);
    for (let i = 0, offset = 0; i < maxRange; i += 1, offset += SPAN) {
        const openIndex = indexData[offset + OPEN];
        const closeIndex = indexData[offset + CLOSE];
        midpoints[i] = openIndex === -1 ? -1 : (openIndex + closeIndex) >> 1;
    }
    return midpoints;
}

// ============================================================================
// CORE LAYER: Pure, testable aggregation functions
// ============================================================================

/**
 * Computes multi-level aggregation filters for OHLC/Candlestick chart data.
 *
 * Creates progressively coarser aggregation levels for efficient rendering
 * of large datasets. Tracks Open/High/Low/Close values as extrema indices
 * within each aggregation bucket.
 *
 * @param domain - Numeric domain bounds [min, max] for X values
 * @param xValues - X coordinate values (typically time/date)
 * @param highValues - High values for each period
 * @param lowValues - Low values for each period
 * @param options - Configuration options
 * @param options.smallestKeyInterval - Smallest interval between X keys
 * @returns Array of aggregation filters from coarse to fine resolution, or undefined if below threshold
 *
 * @complexity O(n * log(levels)) where n is data points and levels ≈ log2(maxRange/64)
 * @memory Creates TypedArrays for index storage
 *
 * @example
 * const filters = computeOhlcAggregation(
 *   [0, 1000],
 *   timestamps,
 *   highs,
 *   lows,
 *   { smallestKeyInterval: undefined }
 * );
 * // Returns filters with OHLC extrema indices for efficient rendering
 */
export function computeOhlcAggregation(
    domain: [number, number],
    xValues: any[],
    highValues: any[],
    lowValues: any[],
    options: {
        smallestKeyInterval: number | undefined;
        xNeedsValueOf: boolean;
        yNeedsValueOf: boolean;
        existingFilters?: OhlcSeriesDataAggregationFilter[];
    }
): OhlcSeriesDataAggregationFilter[] | undefined {
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

    const filters: OhlcSeriesDataAggregationFilter[] = [
        {
            maxRange,
            indexData,
            valueData,
            midpointIndices,
        },
    ];

    // Build coarser aggregation levels with array reuse (like bar aggregation)
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
 * Computes OHLC aggregation with deferred full recomputation.
 *
 * For real-time data updates, this computes only the single aggregation level
 * needed for the current zoom, deferring a full recomputation of all levels
 * to idle time. This design enables future incremental updates to focus on
 * just the immediate level, while deferred processing handles full rebuilds.
 *
 * @param domain - Numeric domain bounds [min, max] for X values
 * @param xValues - X coordinate values (typically time/date)
 * @param highValues - High values for each period
 * @param lowValues - Low values for each period
 * @param options - Configuration options including targetRange
 * @param options.targetRange - The current pixel range for determining bucket count
 * @returns Partial result with the immediate level and a function to compute all levels
 */
export function computeOhlcAggregationPartial(
    domain: [number, number],
    xValues: any[],
    highValues: any[],
    lowValues: any[],
    options: {
        smallestKeyInterval: number | undefined;
        targetRange: number;
        xNeedsValueOf: boolean;
        yNeedsValueOf: boolean;
        existingFilters?: OhlcSeriesDataAggregationFilter[];
    }
): OhlcPartialAggregationResult | undefined {
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

    const immediateLevel: OhlcSeriesDataAggregationFilter = {
        maxRange: targetMaxRange,
        indexData,
        valueData,
        midpointIndices,
    };

    // Defer full recomputation of all levels to idle time
    function computeRemaining(): OhlcSeriesDataAggregationFilter[] {
        const allLevels = computeOhlcAggregation([d0, d1], xValues, highValues, lowValues, {
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
 * Aggregates OHLC data for rendering optimization (low-level adapter).
 * Extracts domain from scale and delegates to core aggregation function.
 *
 * @internal
 */
function aggregateOhlcData(
    scale: ScaleType,
    xValues: any[],
    highValues: any[],
    lowValues: any[],
    domain: number[],
    smallestKeyInterval: number | undefined,
    xNeedsValueOf: boolean,
    yNeedsValueOf: boolean
): OhlcSeriesDataAggregationFilter[] | undefined {
    const [d0, d1] = aggregationDomain(scale, domain);
    return computeOhlcAggregation([d0, d1], xValues, highValues, lowValues, {
        smallestKeyInterval,
        xNeedsValueOf,
        yNeedsValueOf,
    });
}

// ============================================================================
// INTEGRATION LAYER: Memoization
// ============================================================================

/**
 * Memoized version of aggregateOhlcData for internal use.
 * @internal
 */
const memoizedAggregateOhlcData = simpleMemorize2(aggregateOhlcData);

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
export function aggregateOhlcDataFromDataModel(
    scale: ScaleType,
    dataModel: any,
    processedData: any,
    series: any
): OhlcSeriesDataAggregationFilter[] | undefined {
    const xValues = dataModel.resolveKeysById(series, 'xValue', processedData);
    const highValues = dataModel.resolveColumnById(series, 'highValue', processedData);
    const lowValues = dataModel.resolveColumnById(series, 'lowValue', processedData);

    const { index } = dataModel.resolveProcessedDataDefById(series, 'xValue');
    const domain = processedData.domain.keys[index];

    const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf =
        dataModel.resolveColumnNeedsValueOf(series, 'highValue', processedData) ??
        dataModel.resolveColumnNeedsValueOf(series, 'lowValue', processedData);

    return memoizedAggregateOhlcData(
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
export function aggregateOhlcDataFromDataModelPartial(
    scale: ScaleType,
    dataModel: any,
    processedData: any,
    series: any,
    targetRange: number,
    existingFilters?: OhlcSeriesDataAggregationFilter[]
): OhlcPartialAggregationResult | undefined {
    const xValues = dataModel.resolveKeysById(series, 'xValue', processedData);
    const highValues = dataModel.resolveColumnById(series, 'highValue', processedData);
    const lowValues = dataModel.resolveColumnById(series, 'lowValue', processedData);

    const { index } = dataModel.resolveProcessedDataDefById(series, 'xValue');
    const domain = processedData.domain.keys[index];

    const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf =
        dataModel.resolveColumnNeedsValueOf(series, 'highValue', processedData) ??
        dataModel.resolveColumnNeedsValueOf(series, 'lowValue', processedData);

    const [d0, d1] = aggregationDomain(scale, domain);
    return computeOhlcAggregationPartial([d0, d1], xValues, highValues, lowValues, {
        smallestKeyInterval: processedData.reduced?.smallestKeyInterval,
        targetRange,
        xNeedsValueOf,
        yNeedsValueOf,
        existingFilters,
    });
}
