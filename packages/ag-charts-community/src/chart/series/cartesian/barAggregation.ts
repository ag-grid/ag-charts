import { type ScaleType, simpleMemorize2 } from 'ag-charts-core';
import { nextPowerOf2 } from 'ag-charts-core';

import {
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_MIN_RANGE,
    AGGREGATION_SPAN,
    AGGREGATION_THRESHOLD,
    aggregationDomain,
    aggregationRangeFittingPoints,
    compactAggregationIndices,
    createAggregationIndices,
} from '../aggregation';

export interface BarSeriesDataAggregationFilter {
    maxRange: number;
    positiveIndices: Int32Array;
    positiveIndexData: Int32Array;
    negativeIndices: Int32Array;
    negativeIndexData: Int32Array;
}

export interface PartialBarAggregationResult {
    /** Levels computed immediately (includes the target level) */
    immediate: BarSeriesDataAggregationFilter[];
    /** Function to compute remaining coarser levels, or undefined if all levels computed */
    computeRemaining?: () => BarSeriesDataAggregationFilter[];
}

// ============================================================================
// CORE LAYER: Pure, testable aggregation functions
// ============================================================================

/**
 * Extracts midpoint indices from aggregation index data.
 * For each bucket, calculates the midpoint between min and max X indices.
 *
 * @param maxRange - Number of aggregation buckets
 * @param indexData - Aggregation index data (TypedArray)
 * @returns Array of midpoint indices representing each bucket
 */
function getIndices(maxRange: number, indexData: Int32Array) {
    const indices = new Int32Array(maxRange);
    for (let i = 0, offset = 0; i < maxRange; i += 1, offset += AGGREGATION_SPAN) {
        const xMin = indexData[offset + AGGREGATION_INDEX_X_MIN];
        const xMax = indexData[offset + AGGREGATION_INDEX_X_MAX];
        indices[i] = (xMin + xMax) >> 1; // truncating midpoint
    }
    return indices;
}

/**
 * Computes multi-level aggregation filters for bar chart data.
 *
 * Creates progressively coarser aggregation levels for efficient rendering
 * of large datasets. Bar series requires separate aggregation for positive
 * and negative values to properly handle stacked bars and bi-directional data.
 *
 * @param domain - Numeric domain bounds [min, max] for X values
 * @param xValues - X coordinate values
 * @param yStartValues - Y start values for stacked bars (or undefined for non-stacked)
 * @param yEndValues - Y end values
 * @param options - Configuration options
 * @param options.smallestKeyInterval - Smallest interval between X keys (for category axes)
 * @param options.xNeedsValueOf - Whether X values need valueOf() conversion
 * @param options.yNeedsValueOf - Whether Y values need valueOf() conversion
 * @returns Array of aggregation filters from coarse to fine resolution, or undefined if below threshold
 *
 * @complexity O(n * log(levels)) where n is data points and levels ≈ log2(maxRange/64)
 * @memory Creates TypedArrays for both positive and negative aggregations
 *
 * @example
 * const filters = computeBarAggregation(
 *   [0, 100],
 *   [1, 2, 3, ...1000],
 *   undefined,
 *   [10, -5, 20, ...50],
 *   { smallestKeyInterval: undefined, xNeedsValueOf: false, yNeedsValueOf: false }
 * );
 * // Returns filters with separate positive/negative indices for efficient rendering
 */
export function computeBarAggregation(
    domain: [number, number],
    xValues: any[],
    yStartValues: any[] | undefined,
    yEndValues: any[],
    options: {
        smallestKeyInterval: number | undefined;
        xNeedsValueOf: boolean;
        yNeedsValueOf: boolean;
    }
): BarSeriesDataAggregationFilter[] | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = domain;
    const { smallestKeyInterval, xNeedsValueOf, yNeedsValueOf } = options;

    let maxRange = aggregationRangeFittingPoints(xValues, d0, d1, { smallestKeyInterval, xNeedsValueOf });

    let { indexData: positiveIndexData, valueData: positiveValueData } = createAggregationIndices(
        xValues,
        yEndValues,
        yStartValues ?? yEndValues,
        d0,
        d1,
        maxRange,
        { positive: true, xNeedsValueOf, yNeedsValueOf }
    );
    let { indexData: negativeIndexData, valueData: negativeValueData } = createAggregationIndices(
        xValues,
        yEndValues,
        yStartValues ?? yEndValues,
        d0,
        d1,
        maxRange,
        { positive: false, xNeedsValueOf, yNeedsValueOf }
    );

    let positiveIndices = getIndices(maxRange, positiveIndexData);
    let negativeIndices = getIndices(maxRange, negativeIndexData);

    const filters: BarSeriesDataAggregationFilter[] = [
        { maxRange, positiveIndices, positiveIndexData, negativeIndices, negativeIndexData },
    ];

    while (maxRange > 64) {
        const currentMaxRange = maxRange;
        const positiveCompacted = compactAggregationIndices(positiveIndexData, positiveValueData, currentMaxRange);
        const negativeCompacted = compactAggregationIndices(negativeIndexData, negativeValueData, currentMaxRange);

        maxRange = positiveCompacted.maxRange;

        positiveIndexData = positiveCompacted.indexData;
        positiveValueData = positiveCompacted.valueData;
        positiveIndices = positiveCompacted.midpointData ?? getIndices(maxRange, positiveIndexData);

        negativeIndexData = negativeCompacted.indexData;
        negativeValueData = negativeCompacted.valueData;
        negativeIndices = negativeCompacted.midpointData ?? getIndices(maxRange, negativeIndexData);

        filters.push({ maxRange, positiveIndices, positiveIndexData, negativeIndices, negativeIndexData });
    }

    filters.reverse();

    return filters;
}

/**
 * Computes bar aggregation with deferred full recomputation.
 *
 * For real-time data updates, this computes only the single aggregation level
 * needed for the current zoom, deferring a full recomputation of all levels
 * to idle time. This design enables future incremental updates to focus on
 * just the immediate level, while deferred processing handles full rebuilds.
 *
 * @param domain - Numeric domain bounds [min, max] for X values
 * @param xValues - X coordinate values
 * @param yStartValues - Y start values for stacked bars
 * @param yEndValues - Y end values
 * @param options - Configuration options including targetRange
 * @param options.targetRange - The current pixel range for determining bucket count
 * @returns Partial result with the immediate level and a function to compute all levels
 */
export function computeBarAggregationPartial(
    domain: [number, number],
    xValues: any[],
    yStartValues: any[] | undefined,
    yEndValues: any[],
    options: {
        smallestKeyInterval: number | undefined;
        xNeedsValueOf: boolean;
        yNeedsValueOf: boolean;
        targetRange: number;
    }
): PartialBarAggregationResult | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = domain;
    const { smallestKeyInterval, xNeedsValueOf, yNeedsValueOf, targetRange } = options;

    // Calculate the finest level bucket count (based on data density)
    const finestMaxRange = aggregationRangeFittingPoints(xValues, d0, d1, { smallestKeyInterval, xNeedsValueOf });

    // Calculate target bucket count: next power of 2 >= targetRange, clamped to valid range
    const targetMaxRange = Math.min(finestMaxRange, nextPowerOf2(Math.max(targetRange, AGGREGATION_MIN_RANGE)));

    // Create aggregation at exactly the target level - single O(n) scan
    const { indexData: positiveIndexData } = createAggregationIndices(
        xValues,
        yEndValues,
        yStartValues ?? yEndValues,
        d0,
        d1,
        targetMaxRange,
        { positive: true, xNeedsValueOf, yNeedsValueOf }
    );
    const { indexData: negativeIndexData } = createAggregationIndices(
        xValues,
        yEndValues,
        yStartValues ?? yEndValues,
        d0,
        d1,
        targetMaxRange,
        { positive: false, xNeedsValueOf, yNeedsValueOf }
    );

    const immediateLevel: BarSeriesDataAggregationFilter = {
        maxRange: targetMaxRange,
        positiveIndices: getIndices(targetMaxRange, positiveIndexData),
        positiveIndexData,
        negativeIndices: getIndices(targetMaxRange, negativeIndexData),
        negativeIndexData,
    };

    // Defer full recomputation of all levels to idle time
    function computeRemaining(): BarSeriesDataAggregationFilter[] {
        const allLevels = computeBarAggregation([d0, d1], xValues, yStartValues, yEndValues, {
            smallestKeyInterval,
            xNeedsValueOf,
            yNeedsValueOf,
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
 * Aggregates bar data for rendering optimization (low-level adapter).
 * Extracts domain from scale and delegates to core aggregation function.
 *
 * @internal
 */
function aggregateBarData(
    scale: ScaleType,
    xValues: any[],
    yStartValues: any[] | undefined,
    yEndValues: any[],
    domain: number[],
    smallestKeyInterval: number | undefined,
    xNeedsValueOf: boolean,
    yNeedsValueOf: boolean
): BarSeriesDataAggregationFilter[] | undefined {
    const [d0, d1] = aggregationDomain(scale, domain);
    return computeBarAggregation([d0, d1], xValues, yStartValues, yEndValues, {
        smallestKeyInterval,
        xNeedsValueOf,
        yNeedsValueOf,
    });
}

// ============================================================================
// INTEGRATION LAYER: Memoization
// ============================================================================

/**
 * Memoized version of aggregateBarData for internal use.
 * @internal
 */
const memoizedAggregateBarData = simpleMemorize2(aggregateBarData);

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
export function aggregateBarDataFromDataModel(
    scale: ScaleType,
    dataModel: any,
    processedData: any,
    series: any
): BarSeriesDataAggregationFilter[] | undefined {
    const xValues = dataModel.resolveKeysById(series, 'xValue', processedData);

    const isStacked = dataModel.hasColumnById(series, 'yValue-start');
    const yStartValues = isStacked ? dataModel.resolveColumnById(series, 'yValue-start', processedData) : undefined;
    const yEndValues = isStacked
        ? dataModel.resolveColumnById(series, 'yValue-end', processedData)
        : dataModel.resolveColumnById(series, 'yValue-raw', processedData);

    const { index } = dataModel.resolveProcessedDataDefById(series, 'xValue');
    const domain = processedData.domain.keys[index];

    const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf = dataModel.resolveColumnNeedsValueOf(
        series,
        isStacked ? 'yValue-end' : 'yValue-raw',
        processedData
    );

    return memoizedAggregateBarData(
        scale,
        xValues,
        yStartValues,
        yEndValues,
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
 * @returns Partial aggregation result with immediate levels and deferred computation function
 */
export function aggregateBarDataFromDataModelPartial(
    scale: ScaleType,
    dataModel: any,
    processedData: any,
    series: any,
    targetRange: number
): PartialBarAggregationResult | undefined {
    const xValues = dataModel.resolveKeysById(series, 'xValue', processedData);

    const isStacked = dataModel.hasColumnById(series, 'yValue-start');
    const yStartValues = isStacked ? dataModel.resolveColumnById(series, 'yValue-start', processedData) : undefined;
    const yEndValues = isStacked
        ? dataModel.resolveColumnById(series, 'yValue-end', processedData)
        : dataModel.resolveColumnById(series, 'yValue-raw', processedData);

    const { index } = dataModel.resolveProcessedDataDefById(series, 'xValue');
    const domain = processedData.domain.keys[index];

    const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf = dataModel.resolveColumnNeedsValueOf(
        series,
        isStacked ? 'yValue-end' : 'yValue-raw',
        processedData
    );

    const [d0, d1] = aggregationDomain(scale, domain);
    // TODO: Use memoized version of computeBarAggregationPartial
    return computeBarAggregationPartial([d0, d1], xValues, yStartValues, yEndValues, {
        smallestKeyInterval: processedData.reduced?.smallestKeyInterval,
        xNeedsValueOf,
        yNeedsValueOf,
        targetRange,
    });
}
