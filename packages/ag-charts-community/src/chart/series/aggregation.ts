import type { ScaleType } from '../../scale/scale';
import { nextPowerOf2 } from '../../util/number';

export const AGGREGATION_INDEX_X_MIN = 0;
export const AGGREGATION_INDEX_X_MAX = 1;
export const AGGREGATION_INDEX_Y_MIN = 2;
export const AGGREGATION_INDEX_Y_MAX = 3;
export const AGGREGATION_SPAN = 4;

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
            smallestKeyInterval != null
                ? smallestKeyInterval / (d1 - d0)
                : estimateSmallestPixelInterval(xValues, d0, d1, xNeedsValueOf);
        return nextPowerOf2(Math.trunc(1 / smallestPixelInterval)) >> 3;
    } else {
        let power = Math.ceil(Math.log2(xValues.length)) - 1;
        // This cap represents ~500MB for a Float64Array with 4 values per point (or half that for an Int32Array)
        // This is usually a temporary array, so actual resource usage is much lower
        power = Math.min(Math.max(power, 0), 24);
        return (2 ** power) | 0;
    }
}

export function aggregationDomain(scale: ScaleType, domain: any[]): [number, number] {
    switch (scale) {
        case 'category':
            return [NaN, NaN];
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
    return (Math.min(Math.floor(xRatio * maxRange), maxRange - 1) * AGGREGATION_SPAN) | 0;
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
        xNeedsValueOf = true,
        yNeedsValueOf = true,
    }: {
        positive?: boolean;
        xNeedsValueOf?: boolean;
        yNeedsValueOf?: boolean;
    } = {}
): {
    indexData: Int32Array;
    valueData: Float64Array;
} {
    const indexData = new Int32Array(maxRange * AGGREGATION_SPAN).fill(-1);
    const valueData = new Float64Array(maxRange * AGGREGATION_SPAN).fill(NaN);
    const continuous = Number.isFinite(d0) && Number.isFinite(d1);
    const domainCount = xValues.length;

    // Cache for current bucket to reduce array access overhead
    let lastAggIndex = -1;
    let cachedXMinIndex = -1;
    let cachedXMinValue = NaN;
    let cachedXMaxIndex = -1;
    let cachedXMaxValue = NaN;
    let cachedYMinIndex = -1;
    let cachedYMinValue = NaN;
    let cachedYMaxIndex = -1;
    let cachedYMaxValue = NaN;

    const flushCache = (aggIndex: number) => {
        // NOTE: Access order makes a performance difference here - do not change.
        indexData[aggIndex + AGGREGATION_INDEX_X_MIN] = cachedXMinIndex;
        indexData[aggIndex + AGGREGATION_INDEX_X_MAX] = cachedXMaxIndex;
        indexData[aggIndex + AGGREGATION_INDEX_Y_MIN] = cachedYMinIndex;
        indexData[aggIndex + AGGREGATION_INDEX_Y_MAX] = cachedYMaxIndex;
        valueData[aggIndex + AGGREGATION_INDEX_X_MIN] = cachedXMinValue;
        valueData[aggIndex + AGGREGATION_INDEX_X_MAX] = cachedXMaxValue;
        valueData[aggIndex + AGGREGATION_INDEX_Y_MIN] = cachedYMinValue;
        valueData[aggIndex + AGGREGATION_INDEX_Y_MAX] = cachedYMaxValue;
    };

    const xValuesLength = xValues.length;
    for (let datumIndex = 0; datumIndex < xValuesLength; datumIndex++) {
        const xValue = xValues[datumIndex];
        if (xValue == null) continue;

        // Extract numeric values once per iteration (conditionally call valueOf based on metadata)
        const yMaxValue = yMaxValues[datumIndex];
        const yMinValue = yMinValues[datumIndex];
        const yMax: number = yNeedsValueOf ? (yMaxValue != null ? yMaxValue.valueOf() : NaN) : yMaxValue ?? NaN;
        const yMin: number = yNeedsValueOf ? (yMinValue != null ? yMinValue.valueOf() : NaN) : yMinValue ?? NaN;

        if (positive != null && yMax >= 0 !== positive) continue;

        const xRatio = continuous
            ? xNeedsValueOf
                ? aggregationXRatioForXValue(xValue, d0, d1, xNeedsValueOf)
                : (xValue - d0) / (d1 - d0)
            : aggregationXRatioForDatumIndex(datumIndex, domainCount);
        const aggIndex = aggregationIndexForXRatio(xRatio, maxRange);

        // Load cache when switching buckets
        if (aggIndex !== lastAggIndex) {
            if (lastAggIndex !== -1) {
                flushCache(lastAggIndex);
            }
            lastAggIndex = aggIndex;
            // NOTE: Access order makes a performance difference here - do not change.
            cachedXMinIndex = indexData[aggIndex + AGGREGATION_INDEX_X_MIN];
            cachedXMaxIndex = indexData[aggIndex + AGGREGATION_INDEX_X_MAX];
            cachedYMinIndex = indexData[aggIndex + AGGREGATION_INDEX_Y_MIN];
            cachedYMaxIndex = indexData[aggIndex + AGGREGATION_INDEX_Y_MAX];
            cachedXMinValue = valueData[aggIndex + AGGREGATION_INDEX_X_MIN];
            cachedXMaxValue = valueData[aggIndex + AGGREGATION_INDEX_X_MAX];
            cachedYMinValue = valueData[aggIndex + AGGREGATION_INDEX_Y_MIN];
            cachedYMaxValue = valueData[aggIndex + AGGREGATION_INDEX_Y_MAX];
        }

        // Fast path: bucket is unset (first value in bucket)
        if (cachedXMinIndex === -1) {
            cachedXMinIndex = datumIndex;
            cachedXMinValue = xRatio;
            cachedXMaxIndex = datumIndex;
            cachedXMaxValue = xRatio;
            if (!Number.isNaN(yMin)) {
                cachedYMinIndex = datumIndex;
                cachedYMinValue = yMin;
            }
            if (!Number.isNaN(yMax)) {
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
            if (!Number.isNaN(yMin) && yMin < cachedYMinValue) {
                cachedYMinIndex = datumIndex;
                cachedYMinValue = yMin;
            }
            if (!Number.isNaN(yMax) && yMax > cachedYMaxValue) {
                cachedYMaxIndex = datumIndex;
                cachedYMaxValue = yMax;
            }
        }
    }

    // Flush final bucket
    if (lastAggIndex !== -1) {
        flushCache(lastAggIndex);
    }

    return { indexData, valueData };
}

export function compactAggregationIndices(
    indexData: Int32Array,
    valueData: Float64Array,
    maxRange: number,
    { inPlace = false } = {}
) {
    const nextMaxRange = (maxRange / 2) | 0;
    const nextIndexData = !inPlace ? new Int32Array(nextMaxRange * AGGREGATION_SPAN) : indexData;
    const nextValueData = !inPlace ? new Float64Array(nextMaxRange * AGGREGATION_SPAN) : valueData;

    for (let i = 0; i < nextMaxRange; i += 1) {
        const aggIndex = (i * AGGREGATION_SPAN) | 0;
        const index0 = (aggIndex * 2) | 0;
        const index1 = (index0 + AGGREGATION_SPAN) | 0;

        const index1Unset = indexData[index1 + AGGREGATION_INDEX_X_MIN] === -1;

        const xMinAggIndex =
            index1Unset || valueData[index0 + AGGREGATION_INDEX_X_MIN] < valueData[index1 + AGGREGATION_INDEX_X_MIN]
                ? index0
                : index1;
        nextIndexData[aggIndex + AGGREGATION_INDEX_X_MIN] = indexData[xMinAggIndex + AGGREGATION_INDEX_X_MIN];
        nextValueData[aggIndex + AGGREGATION_INDEX_X_MIN] = valueData[xMinAggIndex + AGGREGATION_INDEX_X_MIN];

        const xMaxAggIndex =
            index1Unset || valueData[index0 + AGGREGATION_INDEX_X_MAX] > valueData[index1 + AGGREGATION_INDEX_X_MAX]
                ? index0
                : index1;
        nextIndexData[aggIndex + AGGREGATION_INDEX_X_MAX] = indexData[xMaxAggIndex + AGGREGATION_INDEX_X_MAX];
        nextValueData[aggIndex + AGGREGATION_INDEX_X_MAX] = valueData[xMaxAggIndex + AGGREGATION_INDEX_X_MAX];

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

    return { maxRange: nextMaxRange, indexData: nextIndexData, valueData: nextValueData };
}
