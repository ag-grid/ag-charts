import { type ScaleType, simpleMemorize2 } from 'ag-charts-core';

import {
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    AGGREGATION_MAX_POINTS,
    AGGREGATION_THRESHOLD,
    aggregationBucketForDatum,
    aggregationDatumMatchesIndex,
    aggregationDomain,
    aggregationRangeFittingPoints,
    collectAggregationLevels,
    createAggregationIndices,
} from '../aggregation';

export interface LineSeriesDataAggregationFilter {
    indices: number[];
    maxRange: number;
}

// ============================================================================
// CORE LAYER: Pure, testable aggregation functions
// ============================================================================

/**
 * Checks if a datum index is included in the aggregation at the current level.
 * A datum is included if it represents an extrema (min/max X or Y) within any bucket.
 *
 * @param xValues - Array of X values
 * @param d0 - Domain minimum
 * @param d1 - Domain maximum
 * @param indexData - Aggregation index data (TypedArray)
 * @param maxRange - Current aggregation range
 * @param datumIndex - Index to check
 * @param xNeedsValueOf - Whether X values need valueOf() conversion
 * @param xValuesLength - Length of X values array
 * @returns True if datum is an extrema point in aggregation
 */
function isIndexInAggregation(
    xValues: any[],
    d0: number,
    d1: number,
    indexData: Int32Array,
    maxRange: number,
    datumIndex: number,
    xNeedsValueOf: boolean,
    xValuesLength: number
): boolean {
    const aggIndex = aggregationBucketForDatum(xValues, d0, d1, maxRange, datumIndex, {
        xNeedsValueOf,
        xValuesLength,
    });

    if (aggIndex === -1) return false;

    return aggregationDatumMatchesIndex(indexData, aggIndex, datumIndex, [
        AGGREGATION_INDEX_X_MIN,
        AGGREGATION_INDEX_X_MAX,
        AGGREGATION_INDEX_Y_MIN,
        AGGREGATION_INDEX_Y_MAX,
    ]);
}

/**
 * Computes multi-level aggregation filters for line chart data.
 *
 * Creates progressively coarser aggregation levels for efficient rendering
 * of large datasets. Each filter level tracks indices of extrema (min/max X/Y)
 * within buckets, allowing the renderer to skip intermediate points while
 * preserving the visual envelope of the line.
 *
 * @param domain - Numeric domain bounds [min, max] for X values
 * @param xValues - X coordinate values
 * @param yValues - Y coordinate values
 * @param options - Configuration options
 * @param options.xNeedsValueOf - Whether X values need valueOf() conversion
 * @param options.yNeedsValueOf - Whether Y values need valueOf() conversion
 * @returns Array of aggregation filters from coarse to fine resolution, or undefined if below threshold
 *
 * @complexity O(n * log(levels)) where n is data points and levels ≈ log2(maxRange/64)
 * @memory Creates TypedArrays proportional to data size
 *
 * @example
 * const filters = computeLineAggregation(
 *   [0, 100],
 *   [1, 2, 3, ...1000],
 *   [10, 20, 15, ...50],
 *   { xNeedsValueOf: false, yNeedsValueOf: false }
 * );
 * // Returns filters with extrema indices for efficient rendering
 */
export function computeLineAggregation(
    domain: [number, number],
    xValues: any[],
    yValues: any[],
    options: {
        xNeedsValueOf: boolean;
        yNeedsValueOf: boolean;
    }
): LineSeriesDataAggregationFilter[] | undefined {
    const xValuesLength = xValues.length;
    if (xValuesLength < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = domain;
    const { xNeedsValueOf, yNeedsValueOf } = options;

    const maxRange = aggregationRangeFittingPoints(xValues, d0, d1, { xNeedsValueOf });

    const { indexData, valueData } = createAggregationIndices(xValues, yValues, yValues, d0, d1, maxRange, {
        xNeedsValueOf,
        yNeedsValueOf,
    });

    const filters = collectAggregationLevels<LineSeriesDataAggregationFilter>(
        { maxRange, indexData, valueData },
        {
            compactInPlace: true,
            collectLevel: ({ maxRange: range, indexData: levelIndexData }) => {
                const indices: number[] = [];
                for (let datumIndex = 0; datumIndex < xValuesLength; datumIndex++) {
                    if (
                        isIndexInAggregation(
                            xValues,
                            d0,
                            d1,
                            levelIndexData,
                            range,
                            datumIndex,
                            xNeedsValueOf,
                            xValuesLength
                        )
                    ) {
                        indices.push(datumIndex);
                    }
                }

                return { maxRange: range, indices };
            },
            shouldContinue: (level) => level.indices.length > AGGREGATION_MAX_POINTS,
        }
    );

    return filters;
}

// ============================================================================
// ADAPTER LAYER: Scale integration
// ============================================================================

/**
 * Aggregates line data for rendering optimization (low-level adapter).
 * Extracts domain from scale and delegates to core aggregation function.
 *
 * @internal
 */
function aggregateLineData(
    scale: ScaleType,
    xValues: any[],
    yValues: any[],
    domain: any[],
    xNeedsValueOf: boolean,
    yNeedsValueOf: boolean
): LineSeriesDataAggregationFilter[] | undefined {
    const [d0, d1] = aggregationDomain(scale, domain);
    return computeLineAggregation([d0, d1], xValues, yValues, { xNeedsValueOf, yNeedsValueOf });
}

// ============================================================================
// INTEGRATION LAYER: Memoization
// ============================================================================

/**
 * Memoized version of aggregateLineData for internal use.
 * @internal
 */
const memoizedAggregateLineData = simpleMemorize2(aggregateLineData);

/**
 * High-level aggregation function for series integration.
 * Handles data extraction from DataModel and delegates to memoized aggregation.
 *
 * @param scale - The X-axis scale
 * @param dataModel - Data model containing the processed data
 * @param processedData - Processed data to aggregate
 * @param yKey - The Y value key to use (e.g., 'yValue', 'yValueCumulative')
 * @param series - Series context for data model queries
 * @returns Aggregation filters or undefined if aggregation not needed
 */
export function aggregateLineDataFromDataModel(
    scale: ScaleType,
    dataModel: any,
    processedData: any,
    yKey: string,
    series: any
): LineSeriesDataAggregationFilter[] | undefined {
    const xValues = dataModel.resolveColumnById(series, 'xValue', processedData);
    const yValues = dataModel.resolveColumnById(series, yKey, processedData);
    const domain = dataModel.getDomain(series, 'xValue', 'value', processedData);

    const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, yKey, processedData);

    return memoizedAggregateLineData(scale, xValues, yValues, domain, xNeedsValueOf, yNeedsValueOf);
}
