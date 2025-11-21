import { _ModuleSupport } from 'ag-charts-community';
import type { ScaleType } from 'ag-charts-core';
import { simpleMemorize2 } from 'ag-charts-core';

const {
    AGGREGATION_SPAN,
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    aggregationDomain,
    aggregationRangeFittingPoints,
    compactAggregationIndices,
    createAggregationIndices,
} = _ModuleSupport;

const AGGREGATION_THRESHOLD = 1e3;

export const OPEN = AGGREGATION_INDEX_X_MIN;
export const HIGH = AGGREGATION_INDEX_Y_MAX;
export const LOW = AGGREGATION_INDEX_Y_MIN;
export const CLOSE = AGGREGATION_INDEX_X_MAX;
export { AGGREGATION_SPAN as SPAN };

export interface OhlcSeriesDataAggregationFilter {
    indexData: Int32Array;
    maxRange: number;
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
    }
): OhlcSeriesDataAggregationFilter[] | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = domain;
    const { smallestKeyInterval } = options;

    let maxRange = aggregationRangeFittingPoints(xValues, d0, d1, { smallestKeyInterval });
    let { indexData, valueData } = createAggregationIndices(xValues, highValues, lowValues, d0, d1, maxRange);

    const filters: OhlcSeriesDataAggregationFilter[] = [{ maxRange, indexData }];

    while (maxRange > 64) {
        ({ indexData, valueData, maxRange } = compactAggregationIndices(indexData, valueData, maxRange));

        filters.push({ maxRange, indexData });
    }

    filters.reverse();

    return filters;
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
    smallestKeyInterval: number | undefined
): OhlcSeriesDataAggregationFilter[] | undefined {
    const [d0, d1] = aggregationDomain(scale, domain);
    return computeOhlcAggregation([d0, d1], xValues, highValues, lowValues, { smallestKeyInterval });
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

    return memoizedAggregateOhlcData(
        scale,
        xValues,
        highValues,
        lowValues,
        domain,
        processedData.reduced?.smallestKeyInterval
    );
}
