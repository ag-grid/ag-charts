import { _ModuleSupport } from 'ag-charts-community';
import type { ScaleType } from 'ag-charts-core';
import { simpleMemorize2 } from 'ag-charts-core';

const {
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    AGGREGATION_MIN_RANGE,
    AGGREGATION_THRESHOLD,
    aggregationBucketForDatum,
    aggregationDatumMatchesIndex,
    aggregationDomain,
    aggregationRangeFittingPoints,
    collectAggregationLevels,
    createAggregationIndices,
} = _ModuleSupport;

export interface RangeAreaSeriesDataAggregationFilter {
    maxRange: number;
    topIndices: number[];
    bottomIndices: number[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function aggregationContainsTopIndex(
    xValues: any[],
    d0: number,
    d1: number,
    indexData: Uint32Array,
    maxRange: number,
    datumIndex: number,
    xNeedsValueOf: boolean
) {
    const aggIndex = aggregationBucketForDatum(xValues, d0, d1, maxRange, datumIndex, { xNeedsValueOf });
    if (aggIndex === -1) return false;

    return aggregationDatumMatchesIndex(indexData, aggIndex, datumIndex, [AGGREGATION_INDEX_Y_MAX]);
}

function aggregationContainsBottomIndex(
    xValues: any[],
    d0: number,
    d1: number,
    indexData: Uint32Array,
    maxRange: number,
    datumIndex: number,
    xNeedsValueOf: boolean
) {
    const aggIndex = aggregationBucketForDatum(xValues, d0, d1, maxRange, datumIndex, { xNeedsValueOf });
    if (aggIndex === -1) return false;

    return aggregationDatumMatchesIndex(indexData, aggIndex, datumIndex, [AGGREGATION_INDEX_Y_MIN]);
}

// ============================================================================
// CORE LAYER: Pure, testable aggregation functions
// ============================================================================

/**
 * Computes multi-level aggregation filters for Range Area chart data.
 *
 * Creates progressively coarser aggregation levels for efficient rendering
 * of large datasets. Tracks top and bottom boundary indices for proper area fill.
 *
 * @param domain - Numeric domain bounds [min, max] for X values
 * @param xValues - X coordinate values
 * @param highValues - High values for each range area point
 * @param lowValues - Low values for each range area point
 * @param options - Configuration options
 * @param options.xNeedsValueOf - Whether X values need valueOf() conversion
 * @param options.yNeedsValueOf - Whether Y values need valueOf() conversion
 * @returns Array of aggregation filters from coarse to fine resolution, or undefined if below threshold
 *
 * @complexity O(n * log(levels)) where n is data points and levels ≈ log2(maxRange/64)
 * @memory Creates arrays for top/bottom indices tracking
 *
 * @example
 * const filters = computeRangeAreaAggregation(
 *   [0, 1000],
 *   timestamps,
 *   highs,
 *   lows,
 *   { xNeedsValueOf: false, yNeedsValueOf: false }
 * );
 * // Returns filters with top/bottom indices for efficient area rendering
 */
export function computeRangeAreaAggregation(
    domain: [number, number],
    xValues: any[],
    highValues: any[],
    lowValues: any[],
    options: {
        xNeedsValueOf: boolean;
        yNeedsValueOf: boolean;
    }
): RangeAreaSeriesDataAggregationFilter[] | undefined {
    if (xValues.length < AGGREGATION_THRESHOLD) return;

    const [d0, d1] = domain;
    const { xNeedsValueOf, yNeedsValueOf } = options;

    const maxRange = aggregationRangeFittingPoints(xValues, d0, d1, { xNeedsValueOf });
    const { indexData, valueData } = createAggregationIndices(xValues, highValues, lowValues, d0, d1, maxRange, {
        xNeedsValueOf,
        yNeedsValueOf,
    });

    const filters = collectAggregationLevels<RangeAreaSeriesDataAggregationFilter>(
        { maxRange, indexData, valueData },
        {
            compactInPlace: true,
            minRange: AGGREGATION_MIN_RANGE,
            collectLevel: ({ maxRange: range, indexData: levelIndexData }) => {
                const topIndices: number[] = [];
                const bottomIndices: number[] = [];
                for (let datumIndex = 0; datumIndex < xValues.length; datumIndex += 1) {
                    if (
                        aggregationContainsTopIndex(xValues, d0, d1, levelIndexData, range, datumIndex, xNeedsValueOf)
                    ) {
                        topIndices.push(datumIndex);
                    }
                    if (
                        aggregationContainsBottomIndex(
                            xValues,
                            d0,
                            d1,
                            levelIndexData,
                            range,
                            datumIndex,
                            xNeedsValueOf
                        )
                    ) {
                        bottomIndices.push(datumIndex);
                    }
                }

                return { maxRange: range, topIndices, bottomIndices };
            },
            shouldContinue: () => true,
        }
    );

    return filters;
}

// ============================================================================
// ADAPTER LAYER: Scale integration
// ============================================================================

/**
 * Aggregates Range Area data for rendering optimization (low-level adapter).
 * Extracts domain from scale and delegates to core aggregation function.
 *
 * @internal
 */
function aggregateRangeAreaData(
    scale: ScaleType,
    xValues: any[],
    highValues: any[],
    lowValues: any[],
    domain: number[],
    xNeedsValueOf: boolean,
    yNeedsValueOf: boolean
): RangeAreaSeriesDataAggregationFilter[] | undefined {
    const [d0, d1] = aggregationDomain(scale, domain);
    return computeRangeAreaAggregation([d0, d1], xValues, highValues, lowValues, { xNeedsValueOf, yNeedsValueOf });
}

// ============================================================================
// INTEGRATION LAYER: Memoization
// ============================================================================

/**
 * Memoized version of aggregateRangeAreaData for internal use.
 * @internal
 */
const memoizedAggregateRangeAreaData = simpleMemorize2(aggregateRangeAreaData);

/**
 * High-level aggregation function for series integration.
 * Handles data extraction from DataModel and delegates to memoized aggregation.
 *
 * @param scale - The X-axis scale type
 * @param dataModel - Data model containing the processed data
 * @param processedData - Processed data to aggregate
 * @param yHighKey - Key for high Y values
 * @param yLowKey - Key for low Y values
 * @param series - Series context for data model queries
 * @returns Aggregation filters or undefined if aggregation not needed
 */
export function aggregateRangeAreaDataFromDataModel(
    scale: ScaleType,
    dataModel: any,
    processedData: any,
    yHighKey: string,
    yLowKey: string,
    series: any
): RangeAreaSeriesDataAggregationFilter[] | undefined {
    const xValues = dataModel.resolveKeysById(series, 'xValue', processedData);
    const highValues = dataModel.resolveColumnById(series, yHighKey, processedData);
    const lowValues = dataModel.resolveColumnById(series, yLowKey, processedData);

    const { index } = dataModel.resolveProcessedDataDefById(series, 'xValue');
    const domain = processedData.domain.keys[index];

    const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf =
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        (dataModel.resolveColumnNeedsValueOf(series, yHighKey, processedData) ?? false) ||
        (dataModel.resolveColumnNeedsValueOf(series, yLowKey, processedData) ?? false);

    return memoizedAggregateRangeAreaData(scale, xValues, highValues, lowValues, domain, xNeedsValueOf, yNeedsValueOf);
}
