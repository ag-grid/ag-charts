import type { ScaleType } from 'ag-charts-core';

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
    // NOTE: This function has been aggressively optimized for performance over readability, please
    // take care not to undo optimizations when making changes here.
    const indexData = new Int32Array(maxRange * AGGREGATION_SPAN).fill(-1);
    const valueData = new Float64Array(maxRange * AGGREGATION_SPAN).fill(Number.NaN);
    const continuous = Number.isFinite(d0) && Number.isFinite(d1);
    const domainCount = xValues.length;

    // Pre-compute domain range for continuous case
    const domainRange = continuous ? d1 - d0 : 0;
    const invDomainCount = 1 / domainCount;

    // Cache for current bucket to reduce array access overhead
    let lastAggIndex = -1;
    let cachedXMinIndex = -1;
    let cachedXMinValue = Number.NaN;
    let cachedXMaxIndex = -1;
    let cachedXMaxValue = Number.NaN;
    let cachedYMinIndex = -1;
    let cachedYMinValue = Number.NaN;
    let cachedYMaxIndex = -1;
    let cachedYMaxValue = Number.NaN;

    const flushCache = (aggIndex: number) => {
        // NOTE: Access order makes a performance difference here - do not change.
        // Group writes to the same array together for better cache locality
        const baseIdx = aggIndex;
        indexData[baseIdx + AGGREGATION_INDEX_X_MIN] = cachedXMinIndex;
        indexData[baseIdx + AGGREGATION_INDEX_X_MAX] = cachedXMaxIndex;
        indexData[baseIdx + AGGREGATION_INDEX_Y_MIN] = cachedYMinIndex;
        indexData[baseIdx + AGGREGATION_INDEX_Y_MAX] = cachedYMaxIndex;
        valueData[baseIdx + AGGREGATION_INDEX_X_MIN] = cachedXMinValue;
        valueData[baseIdx + AGGREGATION_INDEX_X_MAX] = cachedXMaxValue;
        valueData[baseIdx + AGGREGATION_INDEX_Y_MIN] = cachedYMinValue;
        valueData[baseIdx + AGGREGATION_INDEX_Y_MAX] = cachedYMaxValue;
    };

    const readCache = (aggIndex: number) => {
        // NOTE: Access order makes a performance difference here - do not change.
        // Group reads from the same array together for better cache locality
        const baseIdx = aggIndex;
        cachedXMinIndex = indexData[baseIdx + AGGREGATION_INDEX_X_MIN];
        cachedXMaxIndex = indexData[baseIdx + AGGREGATION_INDEX_X_MAX];
        cachedYMinIndex = indexData[baseIdx + AGGREGATION_INDEX_Y_MIN];
        cachedYMaxIndex = indexData[baseIdx + AGGREGATION_INDEX_Y_MAX];
        cachedXMinValue = valueData[baseIdx + AGGREGATION_INDEX_X_MIN];
        cachedXMaxValue = valueData[baseIdx + AGGREGATION_INDEX_X_MAX];
        cachedYMinValue = valueData[baseIdx + AGGREGATION_INDEX_Y_MIN];
        cachedYMaxValue = valueData[baseIdx + AGGREGATION_INDEX_Y_MAX];
    };

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
            yMax = yMaxValue == null ? Number.NaN : yMaxValue.valueOf();
            yMin = yMinValue == null ? Number.NaN : yMinValue.valueOf();
        } else {
            yMax = yMaxValue ?? Number.NaN;
            yMin = yMinValue ?? Number.NaN;
        }

        // Early continue for positive check
        if (positive != null && yMax >= 0 !== positive) continue;

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

        const aggIndex = Math.trunc(Math.min(Math.floor(xRatio * maxRange), maxRange - 1) * AGGREGATION_SPAN);

        // Load cache when switching buckets
        if (aggIndex !== lastAggIndex) {
            if (lastAggIndex !== -1) {
                flushCache(lastAggIndex);
            }
            lastAggIndex = aggIndex;
            readCache(aggIndex);
        }

        // Pre-compute NaN checks
        const yMinValid = !Number.isNaN(yMin);
        const yMaxValid = !Number.isNaN(yMax);

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
    const nextMaxRange = Math.trunc(maxRange / 2);
    const nextIndexData = inPlace ? indexData : new Int32Array(nextMaxRange * AGGREGATION_SPAN);
    const nextValueData = inPlace ? valueData : new Float64Array(nextMaxRange * AGGREGATION_SPAN);

    for (let i = 0; i < nextMaxRange; i += 1) {
        const aggIndex = Math.trunc(i * AGGREGATION_SPAN);
        const index0 = Math.trunc(aggIndex * 2);
        const index1 = Math.trunc(index0 + AGGREGATION_SPAN);

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
