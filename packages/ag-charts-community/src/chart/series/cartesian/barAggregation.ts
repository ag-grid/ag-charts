import type { ScaleType } from 'ag-charts-core';
import { nextPowerOf2, simpleMemorize2 } from 'ag-charts-core';

import type { DataModel } from '../../data/dataModel';
import type { ProcessedData, ScopeProvider } from '../../data/dataModelTypes';
import {
    AGGREGATION_MIN_RANGE,
    AGGREGATION_THRESHOLD,
    aggregationDomain,
    aggregationRangeFittingPoints,
    compactAggregationIndices,
    createAggregationIndices,
    getMidpointsForIndices,
} from '../aggregation';

export interface BarSeriesDataAggregationFilter {
    maxRange: number;
    positiveIndices: Uint32Array;
    positiveIndexData: Uint32Array;
    positiveValueData: Float64Array;
    negativeIndices: Uint32Array;
    negativeIndexData: Uint32Array;
    negativeValueData: Float64Array;
    stale?: boolean;
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
        existingFilters?: BarSeriesDataAggregationFilter[];
    }
): BarSeriesDataAggregationFilter[] | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = domain;
    const { smallestKeyInterval, xNeedsValueOf, yNeedsValueOf, existingFilters } = options;

    let maxRange = aggregationRangeFittingPoints(xValues, d0, d1, { smallestKeyInterval, xNeedsValueOf });

    // Find existing filter at finest level for array reuse
    const existingFilter = existingFilters?.find((f) => f.maxRange === maxRange);

    let {
        indexData: positiveIndexData,
        valueData: positiveValueData,
        negativeIndexData,
        negativeValueData,
    } = createAggregationIndices(xValues, yEndValues, yStartValues ?? yEndValues, d0, d1, maxRange, {
        split: true,
        xNeedsValueOf,
        yNeedsValueOf,
        reuseIndexData: existingFilter?.positiveIndexData,
        reuseValueData: existingFilter?.positiveValueData,
        reuseNegativeIndexData: existingFilter?.negativeIndexData,
        reuseNegativeValueData: existingFilter?.negativeValueData,
    });

    // Ensure we have valid arrays (typescript safety, though split=true guarantees them)
    if (!negativeIndexData || !negativeValueData) {
        throw new Error('Negative aggregation data missing in split mode');
    }

    let positiveIndices = getMidpointsForIndices(maxRange, positiveIndexData, existingFilter?.positiveIndices);
    let negativeIndices = getMidpointsForIndices(maxRange, negativeIndexData, existingFilter?.negativeIndices);

    const filters: BarSeriesDataAggregationFilter[] = [
        {
            maxRange,
            positiveIndices,
            positiveIndexData,
            positiveValueData,
            negativeIndices,
            negativeIndexData,
            negativeValueData,
        },
    ];

    while (maxRange > 64) {
        const currentMaxRange = maxRange;
        const nextMaxRange = Math.trunc(currentMaxRange / 2);

        // Find existing filter at target level for array reuse
        const nextExistingFilter = existingFilters?.find((f) => f.maxRange === nextMaxRange);

        const positiveCompacted = compactAggregationIndices(positiveIndexData, positiveValueData, currentMaxRange, {
            reuseIndexData: nextExistingFilter?.positiveIndexData,
            reuseValueData: nextExistingFilter?.positiveValueData,
        });
        const negativeCompacted = compactAggregationIndices(negativeIndexData, negativeValueData, currentMaxRange, {
            reuseIndexData: nextExistingFilter?.negativeIndexData,
            reuseValueData: nextExistingFilter?.negativeValueData,
        });

        maxRange = positiveCompacted.maxRange;

        positiveIndexData = positiveCompacted.indexData;
        positiveValueData = positiveCompacted.valueData;
        positiveIndices =
            positiveCompacted.midpointData ??
            getMidpointsForIndices(maxRange, positiveIndexData, nextExistingFilter?.positiveIndices);

        negativeIndexData = negativeCompacted.indexData;
        negativeValueData = negativeCompacted.valueData;
        negativeIndices =
            negativeCompacted.midpointData ??
            getMidpointsForIndices(maxRange, negativeIndexData, nextExistingFilter?.negativeIndices);

        filters.push({
            maxRange,
            positiveIndices,
            positiveIndexData,
            positiveValueData,
            negativeIndices,
            negativeIndexData,
            negativeValueData,
        });
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
        // Optional existing filters to find matching level for array reuse
        existingFilters?: BarSeriesDataAggregationFilter[];
    }
): PartialBarAggregationResult | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = domain;
    const { smallestKeyInterval, xNeedsValueOf, yNeedsValueOf, targetRange, existingFilters } = options;

    // Calculate the finest level bucket count (based on data density)
    const finestMaxRange = aggregationRangeFittingPoints(xValues, d0, d1, { smallestKeyInterval, xNeedsValueOf });

    // Calculate target bucket count: next power of 2 >= targetRange, clamped to valid range
    const targetMaxRange = Math.min(finestMaxRange, nextPowerOf2(Math.max(targetRange, AGGREGATION_MIN_RANGE)));

    // Find existing filter at matching maxRange for array reuse
    const existingFilter = existingFilters?.find((f) => f.maxRange === targetMaxRange);

    // Create aggregation at exactly the target level - single O(n) scan
    const {
        indexData: positiveIndexData,
        valueData: positiveValueData,
        negativeIndexData,
        negativeValueData,
    } = createAggregationIndices(xValues, yEndValues, yStartValues ?? yEndValues, d0, d1, targetMaxRange, {
        split: true,
        xNeedsValueOf,
        yNeedsValueOf,
        reuseIndexData: existingFilter?.positiveIndexData,
        reuseValueData: existingFilter?.positiveValueData,
        reuseNegativeIndexData: existingFilter?.negativeIndexData,
        reuseNegativeValueData: existingFilter?.negativeValueData,
    });

    if (!negativeIndexData || !negativeValueData) {
        throw new Error('Negative aggregation data missing in split mode');
    }

    const immediateLevel: BarSeriesDataAggregationFilter = {
        maxRange: targetMaxRange,
        positiveIndices: getMidpointsForIndices(targetMaxRange, positiveIndexData, existingFilter?.positiveIndices),
        positiveIndexData,
        positiveValueData,
        negativeIndices: getMidpointsForIndices(targetMaxRange, negativeIndexData, existingFilter?.negativeIndices),
        negativeIndexData,
        negativeValueData,
    };

    // Defer full recomputation of all levels to idle time
    function computeRemaining(): BarSeriesDataAggregationFilter[] {
        const allLevels = computeBarAggregation([d0, d1], xValues, yStartValues, yEndValues, {
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
 * Handles data extraction from DataModel and delegates to aggregation.
 *
 * @param scale - The X-axis scale type
 * @param dataModel - Data model containing the processed data
 * @param processedData - Processed data to aggregate
 * @param series - Series context for data model queries
 * @param existingFilters - Optional existing filters for array reuse
 * @returns Aggregation filters or undefined if aggregation not needed
 */
export function aggregateBarDataFromDataModel(
    scale: ScaleType,
    dataModel: DataModel<any, any, any>,
    processedData: ProcessedData<any>,
    series: ScopeProvider,
    existingFilters?: BarSeriesDataAggregationFilter[]
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

    // When existingFilters provided, bypass memoization to enable array reuse
    if (existingFilters) {
        const [d0, d1] = aggregationDomain(scale, domain);
        return computeBarAggregation([d0, d1], xValues, yStartValues, yEndValues, {
            smallestKeyInterval: processedData.reduced?.smallestKeyInterval,
            xNeedsValueOf,
            yNeedsValueOf,
            existingFilters,
        });
    }

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
 * @param existingFilters - Optional existing filters for array reuse
 * @returns Partial aggregation result with immediate levels and deferred computation function
 */
export function aggregateBarDataFromDataModelPartial(
    scale: ScaleType,
    dataModel: DataModel<any, any, any>,
    processedData: ProcessedData<any>,
    series: ScopeProvider,
    targetRange: number,
    existingFilters?: BarSeriesDataAggregationFilter[]
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
        existingFilters,
    });
}
