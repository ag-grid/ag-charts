import { type ScaleType, nextPowerOf2, simpleMemorize2 } from 'ag-charts-core';

import type { DataModel } from '../../data/dataModel';
import type { ProcessedData, ScopeProvider } from '../../data/dataModelTypes';
import {
    AGGREGATION_MIN_RANGE,
    AGGREGATION_THRESHOLD,
    aggregationDomain,
    aggregationIndexType,
    aggregationRangeFittingPoints,
    buildIndicesFromAggregation,
    compactAggregationIndices,
    createAggregationIndices,
} from '../aggregation';

const MAX_POINTS = 10;

export interface AreaSeriesDataAggregationFilter {
    metaIndices: Uint32Array;
    indices: Uint32Array;
    maxRange: number;
    indexData: Uint32Array;
    valueData: Float64Array;
    stale?: boolean;
}

export interface PartialAreaAggregationResult {
    /** Levels computed immediately (includes the target level) */
    immediate: AreaSeriesDataAggregationFilter[];
    /** Function to compute remaining coarser levels, or undefined if all levels computed */
    computeRemaining?: () => AreaSeriesDataAggregationFilter[];
}

// ============================================================================
// CORE LAYER: Pure aggregation functions (shared from ../aggregation.ts)
// ============================================================================

// AreaSeries uses IndicesAggregation pattern with metaIndices for path grouping.
// The metaIndices track bucket boundaries enabling proper fill path closure.
// See buildIndicesFromAggregation() and aggregationIndexType() in aggregation.ts.

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
 * @param options.existingFilters - Optional existing filters for TypedArray reuse
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
        existingFilters?: AreaSeriesDataAggregationFilter[];
    }
): AreaSeriesDataAggregationFilter[] | undefined {
    const xValuesLength = xValues.length;
    if (xValuesLength < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = domain;
    const { xNeedsValueOf, yNeedsValueOf, existingFilters } = options;

    let maxRange = aggregationRangeFittingPoints(xValues, d0, d1, { xNeedsValueOf });

    // Find existing filter at finest level for TypedArray reuse
    const existingFilter = existingFilters?.find((f) => f.maxRange === maxRange);

    let { indexData, valueData } = createAggregationIndices(xValues, yValues, yValues, d0, d1, maxRange, {
        xNeedsValueOf,
        yNeedsValueOf,
        reuseIndexData: existingFilter?.indexData,
        reuseValueData: existingFilter?.valueData,
    });

    let { indices, metaIndices } = buildIndicesFromAggregation(
        xValues,
        d0,
        d1,
        indexData,
        maxRange,
        xNeedsValueOf,
        xValuesLength,
        existingFilter?.indices,
        existingFilter?.metaIndices
    );

    const filters: AreaSeriesDataAggregationFilter[] = [{ maxRange, metaIndices, indices, indexData, valueData }];

    while (indices.length > MAX_POINTS && maxRange > AGGREGATION_MIN_RANGE) {
        const currentMaxRange = maxRange;
        const nextMaxRange = Math.trunc(currentMaxRange / 2);

        // Find existing filter at target level for TypedArray reuse
        const nextExistingFilter = existingFilters?.find((f) => f.maxRange === nextMaxRange);

        const compacted = compactAggregationIndices(indexData, valueData, currentMaxRange, {
            reuseIndexData: nextExistingFilter?.indexData,
            reuseValueData: nextExistingFilter?.valueData,
        });

        maxRange = compacted.maxRange;
        indexData = compacted.indexData;
        valueData = compacted.valueData;

        // Rebuild indices from the previous level's indices using two-pass approach
        const previousIndices = indices;

        // First pass: count how many indices will be retained
        let indicesCount = 0;
        let metaIndicesCount = 0;
        let currentGroup = -1;

        for (let i = 0; i < previousIndices.length; i++) {
            const datumIndex = previousIndices[i];
            const group = aggregationIndexType(xValues, d0, d1, indexData, maxRange, datumIndex, xNeedsValueOf);
            if (group === -1) continue;

            indicesCount++;
            if (group !== currentGroup) {
                metaIndicesCount++;
                currentGroup = group;
            }
        }
        metaIndicesCount++; // For final closing index

        // Allocate or reuse TypedArrays
        const newIndices =
            nextExistingFilter?.indices?.length === indicesCount
                ? nextExistingFilter.indices
                : new Uint32Array(indicesCount);
        const newMetaIndices =
            nextExistingFilter?.metaIndices?.length === metaIndicesCount
                ? nextExistingFilter.metaIndices
                : new Uint32Array(metaIndicesCount);

        // Second pass: populate arrays
        let indicesIdx = 0;
        let metaIndicesIdx = 0;
        currentGroup = -1;

        for (let i = 0; i < previousIndices.length; i++) {
            const datumIndex = previousIndices[i];
            const group = aggregationIndexType(xValues, d0, d1, indexData, maxRange, datumIndex, xNeedsValueOf);
            if (group === -1) continue;

            if (group !== currentGroup) {
                newMetaIndices[metaIndicesIdx++] = indicesIdx;
                currentGroup = group;
            }
            newIndices[indicesIdx++] = datumIndex;
        }
        newMetaIndices[metaIndicesIdx] = indicesCount - 1; // Final closing index

        indices = newIndices;
        metaIndices = newMetaIndices;
        filters.push({ maxRange, metaIndices, indices, indexData, valueData });
    }

    filters.reverse();

    return filters;
}

/**
 * Computes area aggregation with deferred full recomputation.
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
export function computeAreaAggregationPartial(
    domain: [number, number],
    xValues: any[],
    yValues: any[],
    options: {
        xNeedsValueOf: boolean;
        yNeedsValueOf: boolean;
        targetRange: number;
        existingFilters?: AreaSeriesDataAggregationFilter[];
    }
): PartialAreaAggregationResult | undefined {
    const xValuesLength = xValues.length;
    if (xValuesLength < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = domain;
    const { xNeedsValueOf, yNeedsValueOf, targetRange, existingFilters } = options;

    // Calculate the finest level bucket count (based on data density)
    const finestMaxRange = aggregationRangeFittingPoints(xValues, d0, d1, { xNeedsValueOf });

    // Calculate target bucket count: next power of 2 >= targetRange, clamped to valid range
    const targetMaxRange = Math.min(finestMaxRange, nextPowerOf2(Math.max(targetRange, AGGREGATION_MIN_RANGE)));

    // Find existing filter at matching maxRange for TypedArray reuse
    const existingFilter = existingFilters?.find((f) => f.maxRange === targetMaxRange);

    // Create aggregation at exactly the target level - single O(n) scan
    const { indexData, valueData } = createAggregationIndices(xValues, yValues, yValues, d0, d1, targetMaxRange, {
        xNeedsValueOf,
        yNeedsValueOf,
        reuseIndexData: existingFilter?.indexData,
        reuseValueData: existingFilter?.valueData,
    });

    const { indices, metaIndices } = buildIndicesFromAggregation(
        xValues,
        d0,
        d1,
        indexData,
        targetMaxRange,
        xNeedsValueOf,
        xValuesLength,
        existingFilter?.indices,
        existingFilter?.metaIndices
    );

    const immediateLevel: AreaSeriesDataAggregationFilter = {
        maxRange: targetMaxRange,
        indices,
        metaIndices,
        indexData,
        valueData,
    };

    // Defer full recomputation of all levels to idle time
    function computeRemaining(): AreaSeriesDataAggregationFilter[] {
        const allLevels = computeAreaAggregation([d0, d1], xValues, yValues, {
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
 * @param existingFilters - Optional existing filters for TypedArray reuse
 * @returns Aggregation filters or undefined if aggregation not needed
 */
export function aggregateAreaDataFromDataModel(
    scale: ScaleType,
    dataModel: DataModel<any, any, any>,
    processedData: ProcessedData<any>,
    yKey: string,
    series: ScopeProvider,
    existingFilters?: AreaSeriesDataAggregationFilter[]
): AreaSeriesDataAggregationFilter[] | undefined {
    const xValues = dataModel.resolveKeysById(series, 'xValue', processedData);
    const yValues = dataModel.resolveColumnById(series, yKey, processedData);
    const domain = dataModel.getDomain(series, 'xValue', 'key', processedData);

    const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, yKey, processedData);

    // When existingFilters provided, bypass memoization to enable TypedArray reuse
    if (existingFilters) {
        const [d0, d1] = aggregationDomain(scale, domain);
        return computeAreaAggregation([d0, d1], xValues, yValues, {
            xNeedsValueOf,
            yNeedsValueOf,
            existingFilters,
        });
    }

    return memoizedAggregateAreaData(scale, xValues, yValues, domain, xNeedsValueOf, yNeedsValueOf);
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
 * @param existingFilters - Optional existing filters for TypedArray reuse
 * @returns Partial aggregation result with immediate levels and deferred computation function
 */
export function aggregateAreaDataFromDataModelPartial(
    scale: ScaleType,
    dataModel: DataModel<any, any, any>,
    processedData: ProcessedData<any>,
    yKey: string,
    series: ScopeProvider,
    targetRange: number,
    existingFilters?: AreaSeriesDataAggregationFilter[]
): PartialAreaAggregationResult | undefined {
    const xValues = dataModel.resolveKeysById(series, 'xValue', processedData);
    const yValues = dataModel.resolveColumnById(series, yKey, processedData);
    const domain = dataModel.getDomain(series, 'xValue', 'key', processedData);

    const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, yKey, processedData);

    const [d0, d1] = aggregationDomain(scale, domain);
    return computeAreaAggregationPartial([d0, d1], xValues, yValues, {
        xNeedsValueOf,
        yNeedsValueOf,
        targetRange,
        existingFilters,
    });
}
