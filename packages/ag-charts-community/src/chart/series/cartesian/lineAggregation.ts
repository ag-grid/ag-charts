import { type ScaleType, nextPowerOf2, simpleMemorize2 } from 'ag-charts-core';

import type { DataModel } from '../../data/dataModel';
import type { ProcessedData, ScopeProvider } from '../../data/dataModelTypes';
import {
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    AGGREGATION_MIN_RANGE,
    AGGREGATION_THRESHOLD,
    aggregationDomain,
    aggregationIndexForXRatio,
    aggregationRangeFittingPoints,
    aggregationXRatioForDatumIndex,
    aggregationXRatioForXValue,
    compactAggregationIndices,
    createAggregationIndices,
} from '../aggregation';

const MAX_POINTS = 10;

export interface LineSeriesDataAggregationFilter {
    maxRange: number;
    indices: Uint32Array;
    indexData: Uint32Array;
    valueData: Float64Array;
    stale?: boolean;
}

export interface PartialLineAggregationResult {
    /** Levels computed immediately (includes the target level) */
    immediate: LineSeriesDataAggregationFilter[];
    /** Function to compute remaining coarser levels, or undefined if all levels computed */
    computeRemaining?: () => LineSeriesDataAggregationFilter[];
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
    indexData: Uint32Array,
    maxRange: number,
    datumIndex: number,
    xNeedsValueOf: boolean,
    xValuesLength: number
): boolean {
    const xValue = xValues[datumIndex];
    if (xValue == null) return false;

    const xRatio = Number.isFinite(d0)
        ? aggregationXRatioForXValue(xValue, d0, d1, xNeedsValueOf)
        : aggregationXRatioForDatumIndex(datumIndex, xValuesLength);
    const aggIndex = aggregationIndexForXRatio(xRatio, maxRange);

    return (
        datumIndex === indexData[aggIndex + AGGREGATION_INDEX_X_MIN] ||
        datumIndex === indexData[aggIndex + AGGREGATION_INDEX_X_MAX] ||
        datumIndex === indexData[aggIndex + AGGREGATION_INDEX_Y_MIN] ||
        datumIndex === indexData[aggIndex + AGGREGATION_INDEX_Y_MAX]
    );
}

/**
 * Builds a Uint32Array of indices from aggregation data with optional array reuse.
 */
function buildIndicesFromAggregation(
    xValues: any[],
    d0: number,
    d1: number,
    indexData: Uint32Array,
    maxRange: number,
    xNeedsValueOf: boolean,
    xValuesLength: number,
    reuseArray?: Uint32Array
): Uint32Array {
    // First pass: count valid indices
    let count = 0;
    for (let datumIndex = 0; datumIndex < xValuesLength; datumIndex++) {
        if (isIndexInAggregation(xValues, d0, d1, indexData, maxRange, datumIndex, xNeedsValueOf, xValuesLength)) {
            count++;
        }
    }

    // Reuse existing array if size matches, otherwise allocate new
    const indices = reuseArray?.length === count ? reuseArray : new Uint32Array(count);

    // Second pass: populate indices
    let idx = 0;
    for (let datumIndex = 0; datumIndex < xValuesLength; datumIndex++) {
        if (isIndexInAggregation(xValues, d0, d1, indexData, maxRange, datumIndex, xNeedsValueOf, xValuesLength)) {
            indices[idx++] = datumIndex;
        }
    }

    return indices;
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
 * @param options.existingFilters - Optional existing filters for array reuse
 * @returns Array of aggregation filters from coarse to fine resolution, or undefined if below threshold
 *
 * @complexity O(n * log(levels)) where n is data points and levels ≈ log2(maxRange/64)
 * @memory Creates TypedArrays proportional to data size
 */
export function computeLineAggregation(
    domain: [number, number],
    xValues: any[],
    yValues: any[],
    options: {
        xNeedsValueOf: boolean;
        yNeedsValueOf: boolean;
        existingFilters?: LineSeriesDataAggregationFilter[];
    }
): LineSeriesDataAggregationFilter[] | undefined {
    const xValuesLength = xValues.length;
    if (xValuesLength < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = domain;
    const { xNeedsValueOf, yNeedsValueOf, existingFilters } = options;

    let maxRange = aggregationRangeFittingPoints(xValues, d0, d1, { xNeedsValueOf });

    // Find existing filter at finest level for array reuse
    const existingFilter = existingFilters?.find((f) => f.maxRange === maxRange);

    let { indexData, valueData } = createAggregationIndices(xValues, yValues, yValues, d0, d1, maxRange, {
        xNeedsValueOf,
        yNeedsValueOf,
        reuseIndexData: existingFilter?.indexData,
        reuseValueData: existingFilter?.valueData,
    });

    let indices = buildIndicesFromAggregation(
        xValues,
        d0,
        d1,
        indexData,
        maxRange,
        xNeedsValueOf,
        xValuesLength,
        existingFilter?.indices
    );

    const filters: LineSeriesDataAggregationFilter[] = [{ maxRange, indices, indexData, valueData }];

    while (indices.length > MAX_POINTS && maxRange > 64) {
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

        indices = buildIndicesFromAggregation(
            xValues,
            d0,
            d1,
            indexData,
            maxRange,
            xNeedsValueOf,
            xValuesLength,
            nextExistingFilter?.indices
        );

        filters.push({ maxRange, indices, indexData, valueData });
    }

    filters.reverse();

    return filters;
}

/**
 * Computes line aggregation with deferred full recomputation.
 *
 * For real-time data updates, this computes only the single aggregation level
 * needed for the current zoom, deferring a full recomputation of all levels
 * to idle time.
 *
 * @param domain - Numeric domain bounds [min, max] for X values
 * @param xValues - X coordinate values
 * @param yValues - Y coordinate values
 * @param options - Configuration options including targetRange
 * @returns Partial result with the immediate level and a function to compute all levels
 */
export function computeLineAggregationPartial(
    domain: [number, number],
    xValues: any[],
    yValues: any[],
    options: {
        xNeedsValueOf: boolean;
        yNeedsValueOf: boolean;
        targetRange: number;
        existingFilters?: LineSeriesDataAggregationFilter[];
    }
): PartialLineAggregationResult | undefined {
    const xValuesLength = xValues.length;
    if (xValuesLength < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = domain;
    const { xNeedsValueOf, yNeedsValueOf, targetRange, existingFilters } = options;

    // Calculate the finest level bucket count (based on data density)
    const finestMaxRange = aggregationRangeFittingPoints(xValues, d0, d1, { xNeedsValueOf });

    // Calculate target bucket count: next power of 2 >= targetRange, clamped to valid range
    const targetMaxRange = Math.min(finestMaxRange, nextPowerOf2(Math.max(targetRange, AGGREGATION_MIN_RANGE)));

    // Find existing filter at matching maxRange for array reuse
    const existingFilter = existingFilters?.find((f) => f.maxRange === targetMaxRange);

    // Create aggregation at exactly the target level - single O(n) scan
    const { indexData, valueData } = createAggregationIndices(xValues, yValues, yValues, d0, d1, targetMaxRange, {
        xNeedsValueOf,
        yNeedsValueOf,
        reuseIndexData: existingFilter?.indexData,
        reuseValueData: existingFilter?.valueData,
    });

    const indices = buildIndicesFromAggregation(
        xValues,
        d0,
        d1,
        indexData,
        targetMaxRange,
        xNeedsValueOf,
        xValuesLength,
        existingFilter?.indices
    );

    const immediateLevel: LineSeriesDataAggregationFilter = {
        maxRange: targetMaxRange,
        indices,
        indexData,
        valueData,
    };

    // Defer full recomputation of all levels to idle time
    function computeRemaining(): LineSeriesDataAggregationFilter[] {
        const allLevels = computeLineAggregation([d0, d1], xValues, yValues, {
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
 * Handles data extraction from DataModel and delegates to aggregation.
 *
 * @param scale - The X-axis scale type
 * @param dataModel - Data model containing the processed data
 * @param processedData - Processed data to aggregate
 * @param yKey - The Y value key to use (e.g., 'yValue', 'yValueCumulative')
 * @param series - Series context for data model queries
 * @param existingFilters - Optional existing filters for array reuse
 * @returns Aggregation filters or undefined if aggregation not needed
 */
export function aggregateLineDataFromDataModel(
    scale: ScaleType,
    dataModel: DataModel<any, any, any>,
    processedData: ProcessedData<any>,
    yKey: string,
    series: ScopeProvider,
    existingFilters?: LineSeriesDataAggregationFilter[]
): LineSeriesDataAggregationFilter[] | undefined {
    const xValues = dataModel.resolveColumnById(series, 'xValue', processedData);
    const yValues = dataModel.resolveColumnById(series, yKey, processedData);
    const domain = dataModel.getDomain(series, 'xValue', 'value', processedData);

    const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, yKey, processedData);

    // When existingFilters provided, bypass memoization to enable array reuse
    if (existingFilters) {
        const [d0, d1] = aggregationDomain(scale, domain);
        return computeLineAggregation([d0, d1], xValues, yValues, {
            xNeedsValueOf,
            yNeedsValueOf,
            existingFilters,
        });
    }

    return memoizedAggregateLineData(scale, xValues, yValues, domain, xNeedsValueOf, yNeedsValueOf);
}

/**
 * High-level partial aggregation function for series integration.
 * Computes immediate levels for the target range and defers coarser levels.
 *
 * @param scale - The X-axis scale type
 * @param dataModel - Data model containing the processed data
 * @param processedData - Processed data to aggregate
 * @param yKey - The Y value key to use (e.g., 'yValue', 'yValueCumulative')
 * @param series - Series context for data model queries
 * @param targetRange - Current pixel range for determining which levels to compute immediately
 * @param existingFilters - Optional existing filters for array reuse
 * @returns Partial aggregation result with immediate levels and deferred computation function
 */
export function aggregateLineDataFromDataModelPartial(
    scale: ScaleType,
    dataModel: DataModel<any, any, any>,
    processedData: ProcessedData<any>,
    yKey: string,
    series: ScopeProvider,
    targetRange: number,
    existingFilters?: LineSeriesDataAggregationFilter[]
): PartialLineAggregationResult | undefined {
    const xValues = dataModel.resolveColumnById(series, 'xValue', processedData);
    const yValues = dataModel.resolveColumnById(series, yKey, processedData);
    const domain = dataModel.getDomain(series, 'xValue', 'value', processedData);

    const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, yKey, processedData);

    const [d0, d1] = aggregationDomain(scale, domain);
    return computeLineAggregationPartial([d0, d1], xValues, yValues, {
        xNeedsValueOf,
        yNeedsValueOf,
        targetRange,
        existingFilters,
    });
}
