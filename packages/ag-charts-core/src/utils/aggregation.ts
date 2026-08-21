import type { AgNumericValue } from 'ag-charts-types';

import type { DomainWithMetadata, ScaleType } from '../types/scales';
import { ensureEpochColumn } from './data/epochColumns';
import { nextPowerOf2 } from './data/numberArray';

export const AGGREGATION_INDEX_X_MIN = 0;
export const AGGREGATION_INDEX_X_MAX = 1;
export const AGGREGATION_INDEX_Y_MIN = 2;
export const AGGREGATION_INDEX_Y_MAX = 3;
export const AGGREGATION_INDEX_SELECTED = 4;
export const AGGREGATION_SPAN = 5;

export const AGGREGATION_THRESHOLD = 1e3;
export const AGGREGATION_MAX_POINTS = 10;
export const AGGREGATION_MIN_RANGE = 64;
// Sentinel value for unvisited buckets in Uint32Array (cannot use -1, which becomes 0xFFFFFFFF)
export const AGGREGATION_INDEX_UNSET = 0xffffffff;

const SMALLEST_INTERVAL_MIN_RECURSE = 3;
const SMALLEST_INTERVAL_RECURSE_LIMIT = 20;
const SMALLEST_INTERVAL_MAX_INDEX_ADJUSTMENTS = 100;

// The aggregation hot path stores into Float64Arrays, so columns are narrowed/parsed once upfront, keyed
// by source-column identity for stable memoization.

const TIME_SCALE_TYPES: ReadonlySet<ScaleType> = new Set<ScaleType>(['time', 'unit-time', 'ordinal-time']);

/**
 * Parse an ISO-string time column to epoch ms (the bucketing maths cannot interpret a string).
 * @returns the input `xValues` unchanged when no parsing is required; `needsValueOf` is `false` once converted.
 */
export function epochColumnForTimeScale(
    scale: ScaleType,
    xValues: any[],
    xNeedsValueOf: boolean
): { values: any[]; needsValueOf: boolean } {
    const values = xNeedsValueOf || !TIME_SCALE_TYPES.has(scale) ? xValues : ensureEpochColumn(xValues);
    return { values, needsValueOf: values === xValues ? xNeedsValueOf : false };
}

const numericColumnCache = new WeakMap<readonly unknown[], unknown[]>();

/**
 * Narrow a bigint column to Number absolutely, preserving sign and magnitude (bar's sign buckets and the
 * bubble quadtree's domain ratios depend on it).
 * @returns the input `values` unchanged when the column holds no bigint.
 */
export function narrowBigIntColumn(values: any[]): any[] {
    const cached = numericColumnCache.get(values);
    if (cached !== undefined) return cached;

    let hasBigInt = false;
    for (let i = 0; i < values.length; i++) {
        if (typeof values[i] === 'bigint') {
            hasBigInt = true;
            break;
        }
    }
    const converted = hasBigInt ? values.map((v) => (typeof v === 'bigint' ? Number(v) : v)) : values;
    numericColumnCache.set(values, converted);
    return converted;
}

const relativeNumericColumnCache = new WeakMap<readonly unknown[], unknown[]>();

/**
 * Narrow a bigint column to Number after subtracting its bigint minimum, so a high-magnitude narrow-range
 * column keeps full resolution instead of collapsing onto one double. The offset destroys sign and absolute
 * magnitude, so use ONLY for the comparison-based extrema envelope (line/area/ohlc/range); bar and bubble
 * must use {@link narrowBigIntColumn}.
 * @returns the input `values` unchanged when the column holds no bigint.
 */
export function narrowBigIntColumnRelative(values: any[]): any[] {
    const cached = relativeNumericColumnCache.get(values);
    if (cached !== undefined) return cached;

    let minBig: bigint | undefined;
    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        if (typeof v === 'bigint' && (minBig === undefined || v < minBig)) {
            minBig = v;
        }
    }

    let converted: any[];
    if (minBig === undefined) {
        converted = values;
    } else {
        const offsetBig = minBig;
        const offsetNum = Number(offsetBig);
        converted = values.map((v) => {
            if (typeof v === 'bigint') return Number(v - offsetBig);
            if (typeof v === 'number') return v - offsetNum;
            return v;
        });
    }
    relativeNumericColumnCache.set(values, converted);
    return converted;
}

/**
 * Register a column known to hold no bigint as its own narrowed representation, so a later
 * {@link narrowBigIntColumn} or {@link narrowBigIntColumnRelative} returns on the cache hit instead
 * of repeating the O(n) bigint scan. Extraction's type-tracking pass already knows when a column is
 * pure (non-bigint) numeric, whose absolute and relative narrowings are both the column itself.
 * Mirrors the epoch-column identity seeding in {@link seedEpochColumnIdentity}.
 *
 * The offset-narrowing cache is intentionally not seeded: it subtracts a caller-supplied offset, so
 * its result is not the identity even for a bigint-free column.
 */
export function seedNumericColumnIdentity(values: unknown[]): void {
    if (!numericColumnCache.has(values)) {
        numericColumnCache.set(values, values);
    }
    if (!relativeNumericColumnCache.has(values)) {
        relativeNumericColumnCache.set(values, values);
    }
}

const offsetNumericColumnCache = new WeakMap<readonly unknown[], { offset: bigint; result: any[] }>();

/**
 * Narrow a bigint column to Number after subtracting an explicit bigint `offset`. Unlike
 * {@link narrowBigIntColumnRelative} (which subtracts the column's own minimum), the caller supplies the
 * offset so a column and its domain can be narrowed against the SAME origin — required when the narrowed
 * values are bucketed against a narrowed domain (see {@link narrowAggregationX}).
 * @returns a new array with bigint entries narrowed to Number (offset subtracted); cached per input array,
 * so a repeat call with the same offset reuses the prior result.
 */
export function narrowBigIntColumnByOffset(values: any[], offset: bigint): any[] {
    const cached = offsetNumericColumnCache.get(values);
    if (cached?.offset === offset) return cached.result;

    const offsetNum = Number(offset);
    const result = values.map((v) => {
        if (typeof v === 'bigint') return Number(v - offset);
        if (typeof v === 'number') return v - offsetNum;
        return v;
    });
    offsetNumericColumnCache.set(values, { offset, result });
    return result;
}

/**
 * Bigint [min, max] of a number-scale aggregation X domain, or `undefined` when the domain is empty, holds a
 * non-bigint endpoint, or the scale isn't `number` (time epochs are always within the Number-exact range).
 * Used to subtract a common offset from the X column and its [d0, d1] so a high-magnitude narrow-range bigint
 * domain keeps full bucketing precision instead of collapsing onto one double.
 */
export function bigIntAggregationExtent(
    scale: ScaleType,
    domainInput: DomainWithMetadata<any>
): { min: bigint; max: bigint } | undefined {
    if (scale !== 'number') return undefined;

    const { domain, sortMetadata } = domainInput;
    if (domain.length === 0) return undefined;

    const first = domain[0];
    const last = domain.at(-1);
    if (sortMetadata?.sortOrder === 1) {
        return typeof first === 'bigint' && typeof last === 'bigint' ? { min: first, max: last } : undefined;
    }
    if (sortMetadata?.sortOrder === -1) {
        return typeof first === 'bigint' && typeof last === 'bigint' ? { min: last, max: first } : undefined;
    }

    // Unsorted: bigint-safe relational scan; bail to the absolute path if any endpoint isn't bigint.
    let min: bigint | undefined;
    let max: bigint | undefined;
    for (const d of domain) {
        if (typeof d !== 'bigint') return undefined;
        if (min === undefined || d < min) min = d;
        if (max === undefined || d > max) max = d;
    }
    if (min === undefined || max === undefined) return undefined;
    return { min, max };
}

/**
 * Narrow an aggregation X column to Number together with its [d0, d1] domain. For a bigint number-scale
 * domain the bigint domain-min is subtracted from BOTH before crossing to Number, so a high-magnitude
 * narrow-range column keeps full bucketing precision (mirrors the bigint scale.convert() path) rather than collapsing
 * every value onto one double. Otherwise the column is narrowed absolutely and the domain comes from
 * {@link aggregationDomain}.
 */
export function narrowAggregationX(
    scale: ScaleType,
    epochXValues: any[],
    domainInput: DomainWithMetadata<any>
): { xValues: any[]; domain: [number, number] } {
    const extent = bigIntAggregationExtent(scale, domainInput);
    if (extent !== undefined) {
        return {
            xValues: narrowBigIntColumnByOffset(epochXValues, extent.min),
            domain: [0, Number(extent.max - extent.min)],
        };
    }
    return { xValues: narrowBigIntColumn(epochXValues), domain: aggregationDomain(scale, domainInput) };
}

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
    opts?: { smallestKeyInterval?: AgNumericValue; xNeedsValueOf?: boolean }
) {
    if (Number.isFinite(d0)) {
        const smallestKeyInterval = opts?.smallestKeyInterval;
        const xNeedsValueOf = opts?.xNeedsValueOf ?? true;
        const smallestPixelInterval =
            smallestKeyInterval == null
                ? estimateSmallestPixelInterval(xValues, d0, d1, xNeedsValueOf)
                : Number(smallestKeyInterval) / (d1 - d0);
        // Cap at one bucket per data point: this branch is otherwise unbounded, and a tiny smallest
        // interval over a wide domain overflows the createAggregationIndices allocation.
        return Math.min(nextPowerOf2(Math.trunc(1 / smallestPixelInterval)) >> 3, nextPowerOf2(xValues.length));
    } else {
        let power = Math.ceil(Math.log2(xValues.length)) - 1;
        // This cap represents ~500MB for a Float64Array with 4 values per point (or half that for an Int32Array)
        // This is usually a temporary array, so actual resource usage is much lower
        power = Math.min(Math.max(power, 0), 24);
        return Math.trunc(2 ** power);
    }
}

export function aggregationDomain(scale: ScaleType, domainInput: DomainWithMetadata<any>): [number, number] {
    const { domain, sortMetadata } = domainInput;

    switch (scale) {
        case 'category':
            return [Number.NaN, Number.NaN];
        case 'number':
        case 'time':
        case 'ordinal-time':
        case 'unit-time': {
            if (domain.length === 0) return [Infinity, -Infinity];

            // Fast path: sorted data - O(1)
            if (sortMetadata?.sortOrder === 1) {
                return [Number(domain[0]), Number(domain.at(-1))];
            }
            if (sortMetadata?.sortOrder === -1) {
                return [Number(domain.at(-1)), Number(domain[0])];
            }

            // Fallback: unsorted - O(n)
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
        if (reuseNegativeIndexData?.length === requiredSize) {
            negativeIndexData = reuseNegativeIndexData;
        } else {
            negativeIndexData = new Uint32Array(requiredSize);
        }

        if (reuseNegativeValueData?.length === requiredSize) {
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

    // Pre-compute scale factors (multiplication is faster than division)
    const scaleFactor = continuous ? maxRange / (d1 - d0) : maxRange * (1 / domainCount);

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

        let isPositiveDatum = true;
        if (split) {
            isPositiveDatum = yMax >= 0;
        } else if (positive != null && yMax >= 0 !== positive) {
            continue;
        }

        // Compute scaled x position in one multiplication (combines xRatio and bucket scaling)
        let scaledX: number;
        if (continuous) {
            if (xNeedsValueOf) {
                scaledX = (xValue.valueOf() - d0) * scaleFactor;
            } else {
                scaledX = (xValue - d0) * scaleFactor;
            }
        } else {
            scaledX = datumIndex * scaleFactor;
        }

        // Clamped to maxRange-1 for scaledX === maxRange. Math.floor, not |0: truncation toward zero
        // would map out-of-domain negative scaledX into bucket 0.
        const bucketIndex = Math.floor(scaledX);
        const aggIndex = (bucketIndex < maxRange ? bucketIndex : maxRange - 1) * AGGREGATION_SPAN;

        if (isPositiveDatum) {
            // Reset cache when switching buckets
            if (aggIndex !== lastAggIndex) {
                if (lastAggIndex !== -1) {
                    // Inline flushCache - group writes by array for cache locality
                    indexData[lastAggIndex + AGGREGATION_INDEX_X_MIN] = cachedXMinIndex;
                    indexData[lastAggIndex + AGGREGATION_INDEX_X_MAX] = cachedXMaxIndex;
                    indexData[lastAggIndex + AGGREGATION_INDEX_Y_MIN] = cachedYMinIndex;
                    indexData[lastAggIndex + AGGREGATION_INDEX_Y_MAX] = cachedYMaxIndex;
                    indexData[lastAggIndex + AGGREGATION_INDEX_SELECTED] = 0;
                    valueData[lastAggIndex + AGGREGATION_INDEX_X_MIN] = cachedXMinValue;
                    valueData[lastAggIndex + AGGREGATION_INDEX_X_MAX] = cachedXMaxValue;
                    valueData[lastAggIndex + AGGREGATION_INDEX_Y_MIN] = cachedYMinValue;
                    valueData[lastAggIndex + AGGREGATION_INDEX_Y_MAX] = cachedYMaxValue;
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
                cachedXMinValue = scaledX;
                cachedXMaxIndex = datumIndex;
                cachedXMaxValue = scaledX;
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
                if (scaledX < cachedXMinValue) {
                    cachedXMinIndex = datumIndex;
                    cachedXMinValue = scaledX;
                }
                if (scaledX > cachedXMaxValue) {
                    cachedXMaxIndex = datumIndex;
                    cachedXMaxValue = scaledX;
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
                    negativeIndexData![negLastAggIndex + AGGREGATION_INDEX_X_MIN] = negCachedXMinIndex;
                    negativeIndexData![negLastAggIndex + AGGREGATION_INDEX_X_MAX] = negCachedXMaxIndex;
                    negativeIndexData![negLastAggIndex + AGGREGATION_INDEX_Y_MIN] = negCachedYMinIndex;
                    negativeIndexData![negLastAggIndex + AGGREGATION_INDEX_Y_MAX] = negCachedYMaxIndex;
                    negativeIndexData![negLastAggIndex + AGGREGATION_INDEX_SELECTED] = 0;
                    negativeValueData![negLastAggIndex + AGGREGATION_INDEX_X_MIN] = negCachedXMinValue;
                    negativeValueData![negLastAggIndex + AGGREGATION_INDEX_X_MAX] = negCachedXMaxValue;
                    negativeValueData![negLastAggIndex + AGGREGATION_INDEX_Y_MIN] = negCachedYMinValue;
                    negativeValueData![negLastAggIndex + AGGREGATION_INDEX_Y_MAX] = negCachedYMaxValue;
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
                negCachedXMinValue = scaledX;
                negCachedXMaxIndex = datumIndex;
                negCachedXMaxValue = scaledX;
                if (yMinValid) {
                    negCachedYMinIndex = datumIndex;
                    negCachedYMinValue = yMin;
                }
                if (yMaxValid) {
                    negCachedYMaxIndex = datumIndex;
                    negCachedYMaxValue = yMax;
                }
            } else {
                if (scaledX < negCachedXMinValue) {
                    negCachedXMinIndex = datumIndex;
                    negCachedXMinValue = scaledX;
                }
                if (scaledX > negCachedXMaxValue) {
                    negCachedXMaxIndex = datumIndex;
                    negCachedXMaxValue = scaledX;
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
        indexData[lastAggIndex + AGGREGATION_INDEX_X_MIN] = cachedXMinIndex;
        indexData[lastAggIndex + AGGREGATION_INDEX_X_MAX] = cachedXMaxIndex;
        indexData[lastAggIndex + AGGREGATION_INDEX_Y_MIN] = cachedYMinIndex;
        indexData[lastAggIndex + AGGREGATION_INDEX_Y_MAX] = cachedYMaxIndex;
        indexData[lastAggIndex + AGGREGATION_INDEX_SELECTED] = 0;
        valueData[lastAggIndex + AGGREGATION_INDEX_X_MIN] = cachedXMinValue;
        valueData[lastAggIndex + AGGREGATION_INDEX_X_MAX] = cachedXMaxValue;
        valueData[lastAggIndex + AGGREGATION_INDEX_Y_MIN] = cachedYMinValue;
        valueData[lastAggIndex + AGGREGATION_INDEX_Y_MAX] = cachedYMaxValue;
    }

    if (split && negLastAggIndex !== -1) {
        negativeIndexData![negLastAggIndex + AGGREGATION_INDEX_X_MIN] = negCachedXMinIndex;
        negativeIndexData![negLastAggIndex + AGGREGATION_INDEX_X_MAX] = negCachedXMaxIndex;
        negativeIndexData![negLastAggIndex + AGGREGATION_INDEX_Y_MIN] = negCachedYMinIndex;
        negativeIndexData![negLastAggIndex + AGGREGATION_INDEX_Y_MAX] = negCachedYMaxIndex;
        negativeIndexData![negLastAggIndex + AGGREGATION_INDEX_SELECTED] = 0;
        negativeValueData![negLastAggIndex + AGGREGATION_INDEX_X_MIN] = negCachedXMinValue;
        negativeValueData![negLastAggIndex + AGGREGATION_INDEX_X_MAX] = negCachedXMaxValue;
        negativeValueData![negLastAggIndex + AGGREGATION_INDEX_Y_MIN] = negCachedYMinValue;
        negativeValueData![negLastAggIndex + AGGREGATION_INDEX_Y_MAX] = negCachedYMaxValue;
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
    } else if (reuseIndexData?.length === requiredSize) {
        nextIndexData = reuseIndexData;
    } else {
        nextIndexData = new Uint32Array(requiredSize);
    }

    let nextValueData: Float64Array;
    if (inPlace) {
        nextValueData = valueData;
    } else if (reuseValueData?.length === requiredSize) {
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

        // Propagate selection: a coarser bucket is selected if either child is selected
        nextIndexData[aggIndex + AGGREGATION_INDEX_SELECTED] =
            indexData[index0 + AGGREGATION_INDEX_SELECTED] | indexData[index1 + AGGREGATION_INDEX_SELECTED];
    }

    return {
        maxRange: nextMaxRange,
        indexData: nextIndexData,
        valueData: nextValueData,
        midpointData: nextMidpointData,
    };
}

/**
 * Build a sparse list of selected datum indices from a Uint8Array selection
 * bitset. Used by {@link populateBucketSelectedFromSparse} (and its split
 * variant) to amortise selection-driven roll-up across multiple aggregation
 * levels — typical user selections have Hamming weight ≪ N, so the sparse
 * representation lets per-level population be `O(|selection|)` instead of
 * `O(N)`.
 */
export function collectSparseSelection(selection: Uint8Array): Uint32Array {
    let count = 0;
    for (let i = 0; i < selection.length; i++) {
        if (selection[i] === 1) count++;
    }
    const indices = new Uint32Array(count);
    let pos = 0;
    for (let i = 0; i < selection.length; i++) {
        if (selection[i] === 1) indices[pos++] = i;
    }
    return indices;
}

/**
 * Populate per-bucket SELECTED flags at the given aggregation level by mapping
 * each pre-collected selected datum index to its bucket and setting that
 * bucket's SELECTED slot to `1`. Buckets with no selected datums are cleared
 * to `0` first.
 *
 * Bucket-assignment math mirrors the aggregation builder (see
 * {@link aggregateData}) so that a datum lands in the same bucket here as
 * it did during aggregation.
 *
 * Cost is `O(bucketCount + |sparseSelection|)`, dominated by the clear pass
 * for buckets and a single bucket-index computation per selected datum. No
 * propagation between levels is needed — each level is populated directly.
 */
export function populateBucketSelectedFromSparse(
    sparseSelection: Uint32Array,
    indexData: Uint32Array,
    bucketCount: number,
    xValues: any[],
    d0: number,
    d1: number,
    xNeedsValueOf: boolean
): void {
    for (let i = 0; i < bucketCount; i++) {
        indexData[i * AGGREGATION_SPAN + AGGREGATION_INDEX_SELECTED] = 0;
    }

    if (sparseSelection.length === 0) return;

    // Bucket assignment mirrors aggregationXRatioForXValue / aggregationXRatioForDatumIndex
    // / aggregationIndexForXRatio (inlined here to avoid per-datum function-call overhead
    // in the sparse loop). Keep in sync if the canonical formula changes.
    const continuous = Number.isFinite(d0) && Number.isFinite(d1);
    const xValuesLength = xValues.length;
    const scaleFactor = continuous ? bucketCount / (d1 - d0) : bucketCount * (1 / xValuesLength);

    for (let i = 0; i < sparseSelection.length; i++) {
        const datumIndex = sparseSelection[i];
        if (datumIndex >= xValuesLength) continue;

        const xValue = xValues[datumIndex];
        if (xValue == null) continue;

        let scaledX: number;
        if (continuous) {
            scaledX = xNeedsValueOf ? (xValue.valueOf() - d0) * scaleFactor : ((xValue as number) - d0) * scaleFactor;
        } else {
            scaledX = datumIndex * scaleFactor;
        }

        const bucketIndex = Math.floor(scaledX);
        const aggIndex = (bucketIndex < bucketCount ? bucketIndex : bucketCount - 1) * AGGREGATION_SPAN;
        indexData[aggIndex + AGGREGATION_INDEX_SELECTED] = 1;
    }
}

/**
 * Split-arm variant of {@link populateBucketSelectedFromSparse}. Each selected
 * datum is routed to one arm based on the sign of its y-end value, mirroring
 * the bucket-assignment math used by the split-mode aggregation builder.
 */
export function populateBucketSelectedFromSparseSplit(
    sparseSelection: Uint32Array,
    positiveIndexData: Uint32Array,
    negativeIndexData: Uint32Array,
    bucketCount: number,
    xValues: any[],
    yEndValues: any[],
    d0: number,
    d1: number,
    xNeedsValueOf: boolean,
    yNeedsValueOf: boolean
): void {
    for (let i = 0; i < bucketCount; i++) {
        const aggIndex = i * AGGREGATION_SPAN;
        positiveIndexData[aggIndex + AGGREGATION_INDEX_SELECTED] = 0;
        negativeIndexData[aggIndex + AGGREGATION_INDEX_SELECTED] = 0;
    }

    if (sparseSelection.length === 0) return;

    // Bucket assignment mirrors aggregationXRatioForXValue / aggregationXRatioForDatumIndex
    // / aggregationIndexForXRatio (inlined here to avoid per-datum function-call overhead
    // in the sparse loop). Keep in sync if the canonical formula changes.
    const continuous = Number.isFinite(d0) && Number.isFinite(d1);
    const xValuesLength = xValues.length;
    const scaleFactor = continuous ? bucketCount / (d1 - d0) : bucketCount * (1 / xValuesLength);

    for (let i = 0; i < sparseSelection.length; i++) {
        const datumIndex = sparseSelection[i];
        if (datumIndex >= xValuesLength) continue;

        const xValue = xValues[datumIndex];
        if (xValue == null) continue;

        const yEnd = yEndValues[datumIndex];
        if (yEnd == null) continue;
        const yMax = yNeedsValueOf ? yEnd.valueOf() : yEnd;
        if (yMax !== yMax) continue; // NaN

        let scaledX: number;
        if (continuous) {
            scaledX = xNeedsValueOf ? (xValue.valueOf() - d0) * scaleFactor : ((xValue as number) - d0) * scaleFactor;
        } else {
            scaledX = datumIndex * scaleFactor;
        }

        const bucketIndex = Math.floor(scaledX);
        const aggIndex = (bucketIndex < bucketCount ? bucketIndex : bucketCount - 1) * AGGREGATION_SPAN;
        if (yMax >= 0) {
            positiveIndexData[aggIndex + AGGREGATION_INDEX_SELECTED] = 1;
        } else {
            negativeIndexData[aggIndex + AGGREGATION_INDEX_SELECTED] = 1;
        }
    }
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
    const midpoints = reuseMidpointData?.length === maxRange ? reuseMidpointData : new Uint32Array(maxRange);
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
        smallestKeyInterval: AgNumericValue | undefined;
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
        smallestKeyInterval: AgNumericValue | undefined;
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
