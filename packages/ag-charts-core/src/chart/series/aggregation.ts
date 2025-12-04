import type { ScaleType } from '../../interfaces/scaleTypes';
import { nextPowerOf2 } from '../../utils/numberArray';

export const AGGREGATION_INDEX_X_MIN = 0;
export const AGGREGATION_INDEX_X_MAX = 1;
export const AGGREGATION_INDEX_Y_MIN = 2;
export const AGGREGATION_INDEX_Y_MAX = 3;
export const AGGREGATION_SPAN = 4;

export const AGGREGATION_THRESHOLD = 1e3;
export const AGGREGATION_MAX_POINTS = 10;
export const AGGREGATION_MIN_RANGE = 64;
// Sentinel value for unvisited buckets in Uint32Array (cannot use -1, which becomes 0xFFFFFFFF)
export const AGGREGATION_INDEX_UNSET = 0xffffffff;

const SMALLEST_INTERVAL_MIN_RECURSE = 3;
const SMALLEST_INTERVAL_RECURSE_LIMIT = 20;
const SMALLEST_INTERVAL_MAX_INDEX_ADJUSTMENTS = 100;

function estimateSmallestPixelIntervalIter(
    xValues: any[],
    d0: number,
    d1: number,
    startDatumIndex: number,
    endDatumIndex: number,
    currentSmallestInterval: number,
    depth: number,
    xNeedsValueOf: boolean
): number {
    // Statistical-based. Can be inaccurate in extreme cases, but avoids iterating entire array
    let indexAdjustments = 0;
    while (
        indexAdjustments < SMALLEST_INTERVAL_MAX_INDEX_ADJUSTMENTS &&
        xValues[startDatumIndex] == null &&
        startDatumIndex < endDatumIndex
    ) {
        startDatumIndex += 1;
        indexAdjustments += 1;
    }
    while (
        indexAdjustments < SMALLEST_INTERVAL_MAX_INDEX_ADJUSTMENTS &&
        xValues[endDatumIndex] == null &&
        endDatumIndex > startDatumIndex
    ) {
        endDatumIndex -= 1;
        indexAdjustments += 1;
    }

    if (indexAdjustments >= SMALLEST_INTERVAL_MAX_INDEX_ADJUSTMENTS || startDatumIndex >= endDatumIndex) {
        return currentSmallestInterval;
    }

    const ratio = Number.isFinite(d0)
        ? aggregationXRatioForXValue(xValues[endDatumIndex], d0, d1, xNeedsValueOf) -
          aggregationXRatioForXValue(xValues[startDatumIndex], d0, d1, xNeedsValueOf)
        : aggregationXRatioForDatumIndex(endDatumIndex, xValues.length) -
          aggregationXRatioForDatumIndex(startDatumIndex, xValues.length);

    if (ratio === 0 || !Number.isFinite(ratio)) return currentSmallestInterval;

    const currentInterval = Math.abs(ratio) / (endDatumIndex - startDatumIndex);

    let recurse: boolean;
    if (depth < SMALLEST_INTERVAL_MIN_RECURSE) {
        recurse = true;
    } else if (depth > SMALLEST_INTERVAL_RECURSE_LIMIT) {
        recurse = false;
    } else {
        recurse = currentInterval <= currentSmallestInterval;
    }

    currentSmallestInterval = Math.min(currentSmallestInterval, currentInterval);

    if (!recurse) return currentSmallestInterval;

    const midIndex = Math.floor((startDatumIndex + endDatumIndex) / 2);
    const leadingInterval = estimateSmallestPixelIntervalIter(
        xValues,
        d0,
        d1,
        startDatumIndex,
        midIndex,
        currentSmallestInterval,
        depth + 1,
        xNeedsValueOf
    );
    const trailingInterval = estimateSmallestPixelIntervalIter(
        xValues,
        d0,
        d1,
        midIndex + 1,
        endDatumIndex,
        currentSmallestInterval,
        depth + 1,
        xNeedsValueOf
    );
    return Math.min(leadingInterval, trailingInterval, currentSmallestInterval);
}

function estimateSmallestPixelInterval(xValues: any[], d0: number, d1: number, xNeedsValueOf: boolean) {
    return estimateSmallestPixelIntervalIter(
        xValues,
        d0,
        d1,
        0,
        xValues.length - 1,
        1 / (xValues.length - 1),
        0,
        xNeedsValueOf
    );
}

export function aggregationRangeFittingPoints(
    xValues: any[],
    d0: number,
    d1: number,
    opts?: { smallestKeyInterval?: number; xNeedsValueOf?: boolean }
) {
    if (Number.isFinite(d0)) {
        const smallestKeyInterval = opts?.smallestKeyInterval;
        const xNeedsValueOf = opts?.xNeedsValueOf ?? true;
        const smallestPixelInterval =
            smallestKeyInterval == null
                ? estimateSmallestPixelInterval(xValues, d0, d1, xNeedsValueOf)
                : smallestKeyInterval / (d1 - d0);
        return nextPowerOf2(Math.trunc(1 / smallestPixelInterval)) >> 3;
    } else {
        let power = Math.ceil(Math.log2(xValues.length)) - 1;
        // This cap represents ~500MB for a Float64Array with 4 values per point (or half that for an Int32Array)
        // This is usually a temporary array, so actual resource usage is much lower
        power = Math.min(Math.max(power, 0), 24);
        return Math.trunc(2 ** power);
    }
}

export function aggregationDomain(scale: ScaleType, domain: any[]): [number, number] {
    switch (scale) {
        case 'category':
            return [Number.NaN, Number.NaN];
        case 'number':
        case 'time':
        case 'ordinal-time':
        case 'unit-time': {
            let min = Infinity;
            let max = -Infinity;
            for (const d of domain) {
                const value = Number(d);
                min = Math.min(min, value);
                max = Math.max(max, value);
            }
            return [min, max];
        }
        case 'color':
        case 'log':
        case 'mercator':
            return [0, 0];
    }
}

export function aggregationXRatioForDatumIndex(datumIndex: any, domainCount: number) {
    return datumIndex / domainCount;
}

export function aggregationXRatioForXValue(xValue: any, d0: number, d1: number, xNeedsValueOf: boolean) {
    if (xNeedsValueOf) {
        return (xValue.valueOf() - d0) / (d1 - d0);
    }
    return (xValue - d0) / (d1 - d0);
}

export function aggregationIndexForXRatio(xRatio: number, maxRange: number) {
    return Math.trunc(Math.min(Math.floor(xRatio * maxRange), maxRange - 1) * AGGREGATION_SPAN);
}

export function aggregationBucketForDatum(
    xValues: any[],
    d0: number,
    d1: number,
    maxRange: number,
    datumIndex: number,
    { xNeedsValueOf = true, xValuesLength }: { xNeedsValueOf?: boolean; xValuesLength?: number } = {}
) {
    const xValue = xValues[datumIndex];
    if (xValue == null) return -1;

    const length = xValuesLength ?? xValues.length;
    const xRatio = Number.isFinite(d0)
        ? aggregationXRatioForXValue(xValue, d0, d1, xNeedsValueOf)
        : aggregationXRatioForDatumIndex(datumIndex, length);

    return aggregationIndexForXRatio(xRatio, maxRange);
}

export function aggregationDatumMatchesIndex(
    indexData: Uint32Array,
    aggIndex: number,
    datumIndex: number,
    offsets: number[]
) {
    for (const offset of offsets) {
        if (datumIndex === indexData[aggIndex + offset]) {
            return true;
        }
    }

    return false;
}

export function createAggregationIndices(
    xValues: any[],
    yMaxValues: any[],
    yMinValues: any[],
    d0: number,
    d1: number,
    maxRange: number,
    {
        positive,
        split = false,
        xNeedsValueOf = true,
        yNeedsValueOf = true,
        // Optional pre-allocated arrays to reuse (must be correct size: maxRange * AGGREGATION_SPAN)
        reuseIndexData,
        reuseValueData,
        reuseNegativeIndexData,
        reuseNegativeValueData,
    }: {
        positive?: boolean;
        split?: boolean;
        xNeedsValueOf?: boolean;
        yNeedsValueOf?: boolean;
        reuseIndexData?: Uint32Array;
        reuseValueData?: Float64Array;
        reuseNegativeIndexData?: Uint32Array;
        reuseNegativeValueData?: Float64Array;
    } = {}
): {
    indexData: Uint32Array;
    valueData: Float64Array;
    negativeIndexData?: Uint32Array;
    negativeValueData?: Float64Array;
} {
    // NOTE: This function has been aggressively optimized for performance over readability, please
    // take care not to undo optimizations when making changes here.
    const nan = Number.NaN; // Local constant for faster access
    const requiredSize = maxRange * AGGREGATION_SPAN;

    // Reuse provided arrays if correct size, otherwise allocate new ones
    const indexData = reuseIndexData?.length === requiredSize ? reuseIndexData : new Uint32Array(requiredSize);
    const valueData = reuseValueData?.length === requiredSize ? reuseValueData : new Float64Array(requiredSize);

    // For split mode, we need a second set of arrays
    let negativeIndexData: Uint32Array | undefined;
    let negativeValueData: Float64Array | undefined;

    if (split) {
        if (reuseNegativeIndexData && reuseNegativeIndexData.length === requiredSize) {
            negativeIndexData = reuseNegativeIndexData;
        } else {
            negativeIndexData = new Uint32Array(requiredSize);
        }

        if (reuseNegativeValueData && reuseNegativeValueData.length === requiredSize) {
            negativeValueData = reuseNegativeValueData;
        } else {
            negativeValueData = new Float64Array(requiredSize);
        }
    }

    const continuous = Number.isFinite(d0) && Number.isFinite(d1);
    const domainCount = xValues.length;

    // Pre-fill with sentinel values for continuous case (potentially sparse data).
    if (continuous) {
        valueData.fill(nan);
        indexData.fill(AGGREGATION_INDEX_UNSET);
        if (split) {
            negativeValueData!.fill(nan);
            negativeIndexData!.fill(AGGREGATION_INDEX_UNSET);
        }
    }

    // Pre-compute domain range for continuous case
    const domainRange = continuous ? d1 - d0 : 0;
    const invDomainCount = 1 / domainCount;

    // Cache for current bucket to reduce array access overhead (Positive / Default)
    let lastAggIndex = -1;
    let cachedXMinIndex = -1;
    let cachedXMinValue = nan;
    let cachedXMaxIndex = -1;
    let cachedXMaxValue = nan;
    let cachedYMinIndex = -1;
    let cachedYMinValue = nan;
    let cachedYMaxIndex = -1;
    let cachedYMaxValue = nan;

    // Cache for current bucket (Negative, only used if split=true)
    let negLastAggIndex = -1;
    let negCachedXMinIndex = -1;
    let negCachedXMinValue = nan;
    let negCachedXMaxIndex = -1;
    let negCachedXMaxValue = nan;
    let negCachedYMinIndex = -1;
    let negCachedYMinValue = nan;
    let negCachedYMaxIndex = -1;
    let negCachedYMaxValue = nan;

    const xValuesLength = xValues.length;
    const yArraysSame = yMaxValues === yMinValues;
    for (let datumIndex = 0; datumIndex < xValuesLength; datumIndex++) {
        const xValue = xValues[datumIndex];
        if (xValue == null) continue;

        // Extract numeric values once per iteration
        const yMaxValue = yMaxValues[datumIndex];
        const yMinValue = yArraysSame ? yMaxValue : yMinValues[datumIndex];

        // Optimize value extraction based on yNeedsValueOf flag
        let yMax: number;
        let yMin: number;
        if (yNeedsValueOf) {
            yMax = yMaxValue == null ? nan : yMaxValue.valueOf();
            yMin = yMinValue == null ? nan : yMinValue.valueOf();
        } else {
            yMax = yMaxValue ?? nan;
            yMin = yMinValue ?? nan;
        }

        // Determine which bucket set to use
        let isPositiveDatum = true;
        if (split) {
            // In split mode, we decide based on sign
            // Positive bucket gets values >= 0
            // Negative bucket gets values < 0
            // (Using yMax as the discriminator, similar to original logic)
            isPositiveDatum = yMax >= 0;
        } else if (positive != null && yMax >= 0 !== positive) {
            // In non-split mode, filter by 'positive' arg if present
            continue;
        }

        // Optimize xRatio calculation with pre-computed values
        let xRatio: number;
        if (continuous) {
            if (xNeedsValueOf) {
                xRatio = (xValue.valueOf() - d0) / domainRange;
            } else {
                xRatio = (xValue - d0) / domainRange;
            }
        } else {
            xRatio = datumIndex * invDomainCount;
        }

        // Clamp to maxRange-1 to handle xRatio=1.0 edge case, then multiply by AGGREGATION_SPAN
        // Note: Must use Math.floor (not |0) because |0 truncates toward zero, causing negative
        // xRatio values (data below domain) to incorrectly map to bucket 0 instead of negative bucket
        const bucketIndex = Math.floor(xRatio * maxRange);
        const aggIndex = (bucketIndex < maxRange ? bucketIndex : maxRange - 1) << 2;

        if (isPositiveDatum) {
            // Reset cache when switching buckets
            if (aggIndex !== lastAggIndex) {
                if (lastAggIndex !== -1) {
                    // Inline flushCache - group writes by array for cache locality
                    indexData[lastAggIndex] = cachedXMinIndex;
                    indexData[lastAggIndex + 1] = cachedXMaxIndex;
                    indexData[lastAggIndex + 2] = cachedYMinIndex;
                    indexData[lastAggIndex + 3] = cachedYMaxIndex;
                    valueData[lastAggIndex] = cachedXMinValue;
                    valueData[lastAggIndex + 1] = cachedXMaxValue;
                    valueData[lastAggIndex + 2] = cachedYMinValue;
                    valueData[lastAggIndex + 3] = cachedYMaxValue;
                }
                lastAggIndex = aggIndex;
                // Inline resetCache
                cachedXMinIndex = -1;
                cachedXMinValue = nan;
                cachedXMaxIndex = -1;
                cachedXMaxValue = nan;
                cachedYMinIndex = -1;
                cachedYMinValue = nan;
                cachedYMaxIndex = -1;
                cachedYMaxValue = nan;
            }

            // Pre-compute NaN checks (NaN is the only value where x !== x)
            const yMinValid = yMin === yMin;
            const yMaxValid = yMax === yMax;

            // Fast path: bucket is unset (first value in bucket)
            if (cachedXMinIndex === -1) {
                cachedXMinIndex = datumIndex;
                cachedXMinValue = xRatio;
                cachedXMaxIndex = datumIndex;
                cachedXMaxValue = xRatio;
                if (yMinValid) {
                    cachedYMinIndex = datumIndex;
                    cachedYMinValue = yMin;
                }
                if (yMaxValid) {
                    cachedYMaxIndex = datumIndex;
                    cachedYMaxValue = yMax;
                }
            } else {
                // Slow path: bucket has values, need comparisons
                if (xRatio < cachedXMinValue) {
                    cachedXMinIndex = datumIndex;
                    cachedXMinValue = xRatio;
                }
                if (xRatio > cachedXMaxValue) {
                    cachedXMaxIndex = datumIndex;
                    cachedXMaxValue = xRatio;
                }
                if (yMinValid && yMin < cachedYMinValue) {
                    cachedYMinIndex = datumIndex;
                    cachedYMinValue = yMin;
                }
                if (yMaxValid && yMax > cachedYMaxValue) {
                    cachedYMaxIndex = datumIndex;
                    cachedYMaxValue = yMax;
                }
            }
        } else {
            // Negative Datum (Split mode only)
            if (aggIndex !== negLastAggIndex) {
                if (negLastAggIndex !== -1) {
                    negativeIndexData![negLastAggIndex] = negCachedXMinIndex;
                    negativeIndexData![negLastAggIndex + 1] = negCachedXMaxIndex;
                    negativeIndexData![negLastAggIndex + 2] = negCachedYMinIndex;
                    negativeIndexData![negLastAggIndex + 3] = negCachedYMaxIndex;
                    negativeValueData![negLastAggIndex] = negCachedXMinValue;
                    negativeValueData![negLastAggIndex + 1] = negCachedXMaxValue;
                    negativeValueData![negLastAggIndex + 2] = negCachedYMinValue;
                    negativeValueData![negLastAggIndex + 3] = negCachedYMaxValue;
                }
                negLastAggIndex = aggIndex;
                negCachedXMinIndex = -1;
                negCachedXMinValue = nan;
                negCachedXMaxIndex = -1;
                negCachedXMaxValue = nan;
                negCachedYMinIndex = -1;
                negCachedYMinValue = nan;
                negCachedYMaxIndex = -1;
                negCachedYMaxValue = nan;
            }

            const yMinValid = yMin === yMin;
            const yMaxValid = yMax === yMax;

            if (negCachedXMinIndex === -1) {
                negCachedXMinIndex = datumIndex;
                negCachedXMinValue = xRatio;
                negCachedXMaxIndex = datumIndex;
                negCachedXMaxValue = xRatio;
                if (yMinValid) {
                    negCachedYMinIndex = datumIndex;
                    negCachedYMinValue = yMin;
                }
                if (yMaxValid) {
                    negCachedYMaxIndex = datumIndex;
                    negCachedYMaxValue = yMax;
                }
            } else {
                if (xRatio < negCachedXMinValue) {
                    negCachedXMinIndex = datumIndex;
                    negCachedXMinValue = xRatio;
                }
                if (xRatio > negCachedXMaxValue) {
                    negCachedXMaxIndex = datumIndex;
                    negCachedXMaxValue = xRatio;
                }
                if (yMinValid && yMin < negCachedYMinValue) {
                    negCachedYMinIndex = datumIndex;
                    negCachedYMinValue = yMin;
                }
                if (yMaxValid && yMax > negCachedYMaxValue) {
                    negCachedYMaxIndex = datumIndex;
                    negCachedYMaxValue = yMax;
                }
            }
        }
    }

    // Flush final bucket
    if (lastAggIndex !== -1) {
        indexData[lastAggIndex] = cachedXMinIndex;
        indexData[lastAggIndex + 1] = cachedXMaxIndex;
        indexData[lastAggIndex + 2] = cachedYMinIndex;
        indexData[lastAggIndex + 3] = cachedYMaxIndex;
        valueData[lastAggIndex] = cachedXMinValue;
        valueData[lastAggIndex + 1] = cachedXMaxValue;
        valueData[lastAggIndex + 2] = cachedYMinValue;
        valueData[lastAggIndex + 3] = cachedYMaxValue;
    }

    if (split && negLastAggIndex !== -1) {
        negativeIndexData![negLastAggIndex] = negCachedXMinIndex;
        negativeIndexData![negLastAggIndex + 1] = negCachedXMaxIndex;
        negativeIndexData![negLastAggIndex + 2] = negCachedYMinIndex;
        negativeIndexData![negLastAggIndex + 3] = negCachedYMaxIndex;
        negativeValueData![negLastAggIndex] = negCachedXMinValue;
        negativeValueData![negLastAggIndex + 1] = negCachedXMaxValue;
        negativeValueData![negLastAggIndex + 2] = negCachedYMinValue;
        negativeValueData![negLastAggIndex + 3] = negCachedYMaxValue;
    }

    return { indexData, valueData, negativeIndexData, negativeValueData };
}

export function compactAggregationIndices(
    indexData: Uint32Array,
    valueData: Float64Array,
    maxRange: number,
    {
        inPlace = false,
        midpointData,
        reuseIndexData,
        reuseValueData,
    }: {
        inPlace?: boolean;
        midpointData?: Uint32Array;
        reuseIndexData?: Uint32Array;
        reuseValueData?: Float64Array;
    } = {}
) {
    const nextMaxRange = Math.trunc(maxRange / 2);
    const requiredSize = nextMaxRange * AGGREGATION_SPAN;

    // Priority: inPlace > reuse > allocate new
    let nextIndexData: Uint32Array;
    if (inPlace) {
        nextIndexData = indexData;
    } else if (reuseIndexData && reuseIndexData.length === requiredSize) {
        nextIndexData = reuseIndexData;
    } else {
        nextIndexData = new Uint32Array(requiredSize);
    }

    let nextValueData: Float64Array;
    if (inPlace) {
        nextValueData = valueData;
    } else if (reuseValueData && reuseValueData.length === requiredSize) {
        nextValueData = reuseValueData;
    } else {
        nextValueData = new Float64Array(requiredSize);
    }

    const nextMidpointData = midpointData ?? new Uint32Array(nextMaxRange);

    for (let i = 0; i < nextMaxRange; i += 1) {
        const aggIndex = Math.trunc(i * AGGREGATION_SPAN);
        const index0 = Math.trunc(aggIndex * 2);
        const index1 = Math.trunc(index0 + AGGREGATION_SPAN);

        const index1Unset = indexData[index1 + AGGREGATION_INDEX_X_MIN] === AGGREGATION_INDEX_UNSET;

        const xMinAggIndex =
            index1Unset || valueData[index0 + AGGREGATION_INDEX_X_MIN] < valueData[index1 + AGGREGATION_INDEX_X_MIN]
                ? index0
                : index1;
        const xMinIndex = indexData[xMinAggIndex + AGGREGATION_INDEX_X_MIN];
        nextIndexData[aggIndex + AGGREGATION_INDEX_X_MIN] = xMinIndex;
        nextValueData[aggIndex + AGGREGATION_INDEX_X_MIN] = valueData[xMinAggIndex + AGGREGATION_INDEX_X_MIN];

        const xMaxAggIndex =
            index1Unset || valueData[index0 + AGGREGATION_INDEX_X_MAX] > valueData[index1 + AGGREGATION_INDEX_X_MAX]
                ? index0
                : index1;
        const xMaxIndex = indexData[xMaxAggIndex + AGGREGATION_INDEX_X_MAX];
        nextIndexData[aggIndex + AGGREGATION_INDEX_X_MAX] = xMaxIndex;
        nextValueData[aggIndex + AGGREGATION_INDEX_X_MAX] = valueData[xMaxAggIndex + AGGREGATION_INDEX_X_MAX];
        nextMidpointData[i] = (xMinIndex + xMaxIndex) >> 1;

        const yMinAggIndex =
            index1Unset || valueData[index0 + AGGREGATION_INDEX_Y_MIN] < valueData[index1 + AGGREGATION_INDEX_Y_MIN]
                ? index0
                : index1;
        nextIndexData[aggIndex + AGGREGATION_INDEX_Y_MIN] = indexData[yMinAggIndex + AGGREGATION_INDEX_Y_MIN];
        nextValueData[aggIndex + AGGREGATION_INDEX_Y_MIN] = valueData[yMinAggIndex + AGGREGATION_INDEX_Y_MIN];

        const yMaxAggIndex =
            index1Unset || valueData[index0 + AGGREGATION_INDEX_Y_MAX] > valueData[index1 + AGGREGATION_INDEX_Y_MAX]
                ? index0
                : index1;
        nextIndexData[aggIndex + AGGREGATION_INDEX_Y_MAX] = indexData[yMaxAggIndex + AGGREGATION_INDEX_Y_MAX];
        nextValueData[aggIndex + AGGREGATION_INDEX_Y_MAX] = valueData[yMaxAggIndex + AGGREGATION_INDEX_Y_MAX];
    }

    return {
        maxRange: nextMaxRange,
        indexData: nextIndexData,
        valueData: nextValueData,
        midpointData: nextMidpointData,
    };
}

export interface AggregationLevelState {
    maxRange: number;
    indexData: Uint32Array;
    valueData: Float64Array;
    midpointData?: Uint32Array;
}

/**
 * Computes midpoint indices from aggregation index data.
 * For each bucket, calculates the midpoint between min and max X indices.
 *
 * This generic helper consolidates the `getMidpoints()` functions from
 * rangeBarAggregation and ohlcAggregation, and `getIndices()` from barAggregation.
 *
 * @param maxRange - Number of aggregation buckets
 * @param indexData - Aggregation index data (TypedArray)
 * @param reuseMidpointData - Optional pre-allocated array to reuse (must be correct size)
 * @param xMinOffset - Offset for the X min index within each bucket
 * @param xMaxOffset - Offset for the X max index within each bucket
 * @param invalidSentinel - Sentinel value indicating invalid/empty buckets (-1 or AGGREGATION_INDEX_UNSET)
 * @returns Array of midpoint indices representing each bucket
 */
export function getMidpointsForIndices(
    maxRange: number,
    indexData: Uint32Array,
    reuseMidpointData?: Uint32Array,
    xMinOffset: number = AGGREGATION_INDEX_X_MIN,
    xMaxOffset: number = AGGREGATION_INDEX_X_MAX,
    invalidSentinel: number = -1
): Uint32Array {
    const midpoints =
        reuseMidpointData && reuseMidpointData.length === maxRange ? reuseMidpointData : new Uint32Array(maxRange);
    for (let i = 0, offset = 0; i < maxRange; i += 1, offset += AGGREGATION_SPAN) {
        const xMin = indexData[offset + xMinOffset];
        const xMax = indexData[offset + xMaxOffset];
        midpoints[i] = xMin === invalidSentinel ? invalidSentinel : (xMin + xMax) >> 1;
    }
    return midpoints;
}

export function collectAggregationLevels<T>(
    state: AggregationLevelState,
    {
        collectLevel,
        shouldContinue,
        minRange = AGGREGATION_MIN_RANGE,
        compactInPlace = false,
    }: {
        collectLevel: (state: AggregationLevelState) => T;
        shouldContinue: (level: T, state: AggregationLevelState) => boolean;
        minRange?: number;
        compactInPlace?: boolean;
    }
): T[] {
    let aggregationState = state;
    let level = collectLevel(aggregationState);
    const levels: T[] = [level];

    while (aggregationState.maxRange > minRange && shouldContinue(level, aggregationState)) {
        const compacted = compactAggregationIndices(
            aggregationState.indexData,
            aggregationState.valueData,
            aggregationState.maxRange,
            { inPlace: compactInPlace }
        );
        aggregationState = {
            maxRange: compacted.maxRange,
            indexData: compacted.indexData,
            valueData: compacted.valueData,
            midpointData: compacted.midpointData,
        };
        level = collectLevel(aggregationState);
        levels.push(level);
    }

    levels.reverse();

    return levels;
}

// EXTREMES AGGREGATION: Shared implementation for OHLC and RangeBar

/**
 * Filter interface for extremes-based aggregation (OHLC, RangeBar).
 * Tracks indices that represent extrema values within each aggregation bucket.
 */
export interface ExtremesAggregationFilter {
    indexData: Uint32Array;
    valueData: Float64Array;
    maxRange: number;
    midpointIndices: Uint32Array;
}

/**
 * Result type for partial extremes aggregation with deferred computation.
 */
export interface ExtremesPartialAggregationResult {
    /** Levels computed immediately (includes the target level) */
    immediate: ExtremesAggregationFilter[];
    /** Function to compute remaining coarser levels, or undefined if all levels computed */
    computeRemaining?: () => ExtremesAggregationFilter[];
}

/**
 * Computes multi-level aggregation filters for extremes-based chart data (OHLC, RangeBar).
 *
 * Creates progressively coarser aggregation levels for efficient rendering
 * of large datasets. Tracks extrema values (min/max for both X and Y) as indices
 * within each aggregation bucket.
 *
 * @param domain - Numeric domain bounds [min, max] for X values
 * @param xValues - X coordinate values (typically time/date)
 * @param highValues - High/max Y values for each data point
 * @param lowValues - Low/min Y values for each data point
 * @param options - Configuration options
 * @returns Array of aggregation filters from coarse to fine resolution, or undefined if below threshold
 */
export function computeExtremesAggregation(
    domain: [number, number],
    xValues: any[],
    highValues: any[],
    lowValues: any[],
    options: {
        smallestKeyInterval: number | undefined;
        xNeedsValueOf: boolean;
        yNeedsValueOf: boolean;
        existingFilters?: ExtremesAggregationFilter[];
    }
): ExtremesAggregationFilter[] | undefined {
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
    let midpointIndices = getMidpointsForIndices(maxRange, indexData, existingFilter?.midpointIndices);

    const filters: ExtremesAggregationFilter[] = [
        {
            maxRange,
            indexData,
            valueData,
            midpointIndices,
        },
    ];

    // Build coarser aggregation levels with array reuse
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
            compacted.midpointData ?? getMidpointsForIndices(maxRange, indexData, nextExistingFilter?.midpointIndices);

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
 * Computes extremes aggregation with deferred full recomputation.
 *
 * For real-time data updates, this computes only the single aggregation level
 * needed for the current zoom, deferring a full recomputation of all levels
 * to idle time.
 *
 * @param domain - Numeric domain bounds [min, max] for X values
 * @param xValues - X coordinate values
 * @param highValues - High/max Y values
 * @param lowValues - Low/min Y values
 * @param options - Configuration options including targetRange
 * @returns Partial result with the immediate level and a function to compute all levels
 */
export function computeExtremesAggregationPartial(
    domain: [number, number],
    xValues: any[],
    highValues: any[],
    lowValues: any[],
    options: {
        smallestKeyInterval: number | undefined;
        targetRange: number;
        xNeedsValueOf: boolean;
        yNeedsValueOf: boolean;
        existingFilters?: ExtremesAggregationFilter[];
    }
): ExtremesPartialAggregationResult | undefined {
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
    const midpointIndices = getMidpointsForIndices(targetMaxRange, indexData, existingFilter?.midpointIndices);

    const immediateLevel: ExtremesAggregationFilter = {
        maxRange: targetMaxRange,
        indexData,
        valueData,
        midpointIndices,
    };

    // Defer full recomputation of all levels to idle time
    function computeRemaining(): ExtremesAggregationFilter[] {
        const allLevels = computeExtremesAggregation([d0, d1], xValues, highValues, lowValues, {
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
