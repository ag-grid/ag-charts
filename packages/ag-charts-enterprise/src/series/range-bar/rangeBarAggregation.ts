import { _ModuleSupport } from 'ag-charts-community';
import type { ScaleType } from 'ag-charts-core';
import { simpleMemorize2 } from 'ag-charts-core';

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
    collectAggregationLevels,
    createAggregationIndices,
} = _ModuleSupport;

export const START = AGGREGATION_INDEX_X_MIN;
export const HIGH = AGGREGATION_INDEX_Y_MAX;
export const LOW = AGGREGATION_INDEX_Y_MIN;
export const END = AGGREGATION_INDEX_X_MAX;
export const SPAN = AGGREGATION_SPAN;

export interface RangeBarSeriesDataAggregationFilter {
    indexData: Uint32Array;
    maxRange: number;
    midpointIndices: Uint32Array;
}

function getMidpoints(maxRange: number, indexData: Uint32Array): Uint32Array {
    const midpoints = new Uint32Array(maxRange);
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
 *   { smallestKeyInterval: undefined }
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
    }
): RangeBarSeriesDataAggregationFilter[] | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = domain;
    const { smallestKeyInterval } = options;

    const maxRange = aggregationRangeFittingPoints(xValues, d0, d1, { smallestKeyInterval });
    const { indexData, valueData } = createAggregationIndices(xValues, highValues, lowValues, d0, d1, maxRange);
    const midpointData = getMidpoints(maxRange, indexData);

    const filters = collectAggregationLevels<RangeBarSeriesDataAggregationFilter>(
        { maxRange, indexData, valueData, midpointData },
        {
            minRange: AGGREGATION_MIN_RANGE,
            collectLevel: ({ maxRange: range, indexData: levelIndexData, midpointData: levelMidpointData }) => ({
                maxRange: range,
                indexData: levelIndexData,
                midpointIndices: levelMidpointData ?? getMidpoints(range, levelIndexData),
            }),
            shouldContinue: () => true,
        }
    );

    return filters;
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
    smallestKeyInterval: number | undefined
): RangeBarSeriesDataAggregationFilter[] | undefined {
    const [d0, d1] = aggregationDomain(scale, domain);
    return computeRangeBarAggregation([d0, d1], xValues, highValues, lowValues, { smallestKeyInterval });
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

    return memoizedAggregateRangeBarData(
        scale,
        xValues,
        highValues,
        lowValues,
        domain,
        processedData.reduced?.smallestKeyInterval
    );
}
