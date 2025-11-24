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

export interface AreaSeriesDataAggregationFilter {
    metaIndices: number[];
    indices: number[];
    maxRange: number;
}

// ============================================================================
// CORE LAYER: Pure, testable aggregation functions
// ============================================================================

/**
 * Determines the aggregation bucket index for a datum.
 * Returns the bucket index if the datum is an extrema point, or -1 if not included.
 *
 * @param xValues - Array of X values
 * @param d0 - Domain minimum
 * @param d1 - Domain maximum
 * @param indexData - Aggregation index data (TypedArray)
 * @param maxRange - Current aggregation range
 * @param datumIndex - Index to check
 * @param xNeedsValueOf - Whether X values need valueOf() conversion
 * @returns Bucket index if datum is extrema, -1 otherwise
 */
function aggregationIndexType(
    xValues: any[],
    d0: number,
    d1: number,
    indexData: Uint32Array,
    maxRange: number,
    datumIndex: number,
    xNeedsValueOf: boolean
): number {
    const aggIndex = aggregationBucketForDatum(xValues, d0, d1, maxRange, datumIndex, {
        xNeedsValueOf,
        xValuesLength: xValues.length,
    });

    if (
        aggIndex !== -1 &&
        aggregationDatumMatchesIndex(indexData, aggIndex, datumIndex, [
            AGGREGATION_INDEX_X_MIN,
            AGGREGATION_INDEX_X_MAX,
            AGGREGATION_INDEX_Y_MIN,
            AGGREGATION_INDEX_Y_MAX,
        ])
    ) {
        return aggIndex;
    }

    return -1;
}

/**
 * Computes multi-level aggregation filters for area chart data.
 *
 * Creates progressively coarser aggregation levels for efficient rendering
 * of large datasets. Each filter level tracks indices of extrema (min/max X/Y)
 * within buckets, plus metaIndices to preserve group boundaries for proper
 * area fill rendering.
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
 * const filters = computeAreaAggregation(
 *   [0, 100],
 *   [1, 2, 3, ...1000],
 *   [10, 20, 15, ...50],
 *   { xNeedsValueOf: false, yNeedsValueOf: false }
 * );
 * // Returns filters with extrema indices and group boundaries for efficient rendering
 */
export function computeAreaAggregation(
    domain: [number, number],
    xValues: any[],
    yValues: any[],
    options: {
        xNeedsValueOf: boolean;
        yNeedsValueOf: boolean;
    }
): AreaSeriesDataAggregationFilter[] | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = domain;
    const { xNeedsValueOf, yNeedsValueOf } = options;

    const maxRange = aggregationRangeFittingPoints(xValues, d0, d1, { xNeedsValueOf });

    const { indexData, valueData } = createAggregationIndices(xValues, yValues, yValues, d0, d1, maxRange, {
        xNeedsValueOf,
        yNeedsValueOf,
    });

    const allIndices = xValues.map((_, i) => i);
    let candidateIndices: number[] | undefined;

    const filters = collectAggregationLevels<AreaSeriesDataAggregationFilter>(
        { maxRange, indexData, valueData },
        {
            compactInPlace: true,
            collectLevel: ({ maxRange: range, indexData: levelIndexData }) => {
                const metaIndices: number[] = [];
                const indices: number[] = [];
                let currentGroup = -1;
                const source = candidateIndices ?? allIndices;

                for (const datumIndex of source) {
                    const group = aggregationIndexType(
                        xValues,
                        d0,
                        d1,
                        levelIndexData,
                        range,
                        datumIndex,
                        xNeedsValueOf
                    );
                    if (group === -1) continue;

                    const newGroupIndex = indices.push(datumIndex) - 1;
                    if (group !== currentGroup) {
                        metaIndices.push(newGroupIndex);
                        currentGroup = group;
                    }
                }

                metaIndices.push(indices.length - 1);
                candidateIndices = indices;

                return { maxRange: range, metaIndices, indices };
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
 * Aggregates area data for rendering optimization (low-level adapter).
 * Extracts domain from scale and delegates to core aggregation function.
 *
 * @internal
 */
function aggregateAreaData(
    scale: ScaleType,
    xValues: any[],
    yValues: any[],
    domain: any[],
    xNeedsValueOf: boolean,
    yNeedsValueOf: boolean
): AreaSeriesDataAggregationFilter[] | undefined {
    const [d0, d1] = aggregationDomain(scale, domain);
    return computeAreaAggregation([d0, d1], xValues, yValues, { xNeedsValueOf, yNeedsValueOf });
}

// ============================================================================
// INTEGRATION LAYER: Memoization
// ============================================================================

/**
 * Memoized version of aggregateAreaData for internal use.
 * @internal
 */
const memoizedAggregateAreaData = simpleMemorize2(aggregateAreaData);

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
export function aggregateAreaDataFromDataModel(
    scale: ScaleType,
    dataModel: any,
    processedData: any,
    yKey: string,
    series: any
): AreaSeriesDataAggregationFilter[] | undefined {
    const xValues = dataModel.resolveKeysById(series, 'xValue', processedData);
    const yValues = dataModel.resolveColumnById(series, yKey, processedData);
    const domain = dataModel.getDomain(series, 'xValue', 'key', processedData);

    const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, yKey, processedData);

    return memoizedAggregateAreaData(scale, xValues, yValues, domain, xNeedsValueOf, yNeedsValueOf);
}
