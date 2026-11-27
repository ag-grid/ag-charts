import { nextPowerOf2 } from '../data/numberArray';
import {
    AGGREGATION_INDEX_UNSET,
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    AGGREGATION_SPAN,
    aggregationRangeFittingPoints,
    computeExtremesAggregation,
    createAggregationIndices,
    epochColumnForTimeScale,
    narrowBigIntColumn,
    narrowBigIntColumnRelative,
} from './aggregation';

// Off the power-of-2 boundary so the ULP is uniform (256): bigints within 128 narrow to the same double.
const HIGH_MAGNITUDE = 2n ** 60n + 123_456_789n;
const SUB_ULP_DELTA = 100n; // < half-ULP (128)

describe('aggregation column preprocessing', () => {
    describe('narrowBigIntColumn (absolute)', () => {
        it('preserves sign and magnitude across the safe-integer boundary', () => {
            const big = 9_007_199_254_740_993n; // MAX_SAFE_INTEGER + 2
            const result = narrowBigIntColumn([-big, 0n, big]);

            expect(result).toEqual([Number(-big), 0, Number(big)]);
            expect(result[0]).toBeLessThan(0);
            expect(result[2]).toBeGreaterThan(0);
        });

        it('coerces bigint elements and passes other element types through', () => {
            expect(narrowBigIntColumn([5, 10n, null, undefined])).toEqual([5, 10, null, undefined]);
        });

        it('collapses a high-magnitude narrow span (the reason it must not back comparison extrema)', () => {
            const result = narrowBigIntColumn([
                HIGH_MAGNITUDE - SUB_ULP_DELTA,
                HIGH_MAGNITUDE,
                HIGH_MAGNITUDE + SUB_ULP_DELTA,
            ]) as number[];

            expect(new Set(result).size).toBe(1);
        });

        it('returns the input reference unchanged when the column holds no bigint', () => {
            const values = [1, 2, 3];
            expect(narrowBigIntColumn(values)).toBe(values);
        });

        it('caches by column identity so repeated calls return the same narrowed reference', () => {
            const values = [1n, 2n, 3n];
            const first = narrowBigIntColumn(values);
            expect(narrowBigIntColumn(values)).toBe(first);
        });
    });

    describe('narrowBigIntColumnRelative (offset)', () => {
        it('preserves a high-magnitude narrow span by offsetting against the column minimum', () => {
            const result = narrowBigIntColumnRelative([
                HIGH_MAGNITUDE,
                HIGH_MAGNITUDE + SUB_ULP_DELTA,
                HIGH_MAGNITUDE - SUB_ULP_DELTA,
            ]) as number[];

            // Offsetting by the min in bigint before narrowing keeps the values distinct.
            expect(result).toEqual([100, 200, 0]);
            expect(new Set(result).size).toBe(3);
        });

        it('offsets number elements by the same real minimum and passes null/undefined through', () => {
            expect(narrowBigIntColumnRelative([10n, 25, null, undefined])).toEqual([0, 15, null, undefined]);
        });

        it('returns the input reference unchanged when the column holds no bigint', () => {
            const values = [1, 2, 3];
            expect(narrowBigIntColumnRelative(values)).toBe(values);
        });

        it('caches by column identity so repeated calls return the same narrowed reference', () => {
            const values = [3n, 1n, 2n];
            const first = narrowBigIntColumnRelative(values);
            expect(narrowBigIntColumnRelative(values)).toBe(first);
        });
    });

    describe('epochColumnForTimeScale', () => {
        it('parses ISO 8601 strings to epoch milliseconds on a time scale and clears needsValueOf', () => {
            const iso = ['2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z'];
            const result = epochColumnForTimeScale('time', iso, false);
            expect(result.values).toEqual([Date.UTC(2024, 0, 1), Date.UTC(2024, 0, 2)]);
            expect(result.needsValueOf).toBe(false);
        });

        it('returns the input reference unchanged on a non-time scale, preserving needsValueOf', () => {
            const iso = ['2024-01-01T00:00:00.000Z'];
            const result = epochColumnForTimeScale('number', iso, false);
            expect(result.values).toBe(iso);
            expect(result.needsValueOf).toBe(false);
        });

        it('returns the input reference unchanged when xNeedsValueOf (Date columns are valueOf-handled)', () => {
            const dates = [new Date('2024-01-01T00:00:00.000Z')];
            const result = epochColumnForTimeScale('time', dates, true);
            expect(result.values).toBe(dates);
            expect(result.needsValueOf).toBe(true);
        });

        it('returns a numeric epoch column unchanged rather than rescanning it', () => {
            const epochs = [Date.UTC(2024, 0, 1), Date.UTC(2024, 0, 2)];
            const result = epochColumnForTimeScale('time', epochs, false);
            expect(result.values).toBe(epochs);
            expect(result.needsValueOf).toBe(false);
        });

        it('caches by column identity so repeated calls return the same parsed reference', () => {
            const iso = ['2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z'];
            const first = epochColumnForTimeScale('time', iso, false);
            expect(epochColumnForTimeScale('time', iso, false).values).toBe(first.values);
        });
    });
});

describe('aggregationRangeFittingPoints', () => {
    it('bounds the bucket count to the dataset size on a wide continuous domain', () => {
        // A 1-unit smallest interval over a 2^28 domain span yields an unbounded maxRange of
        // nextPowerOf2(2^28) >> 3 = 2^25, which createAggregationIndices cannot allocate.
        const xValues = Array.from({ length: 2200 }, (_, i) => i);
        const maxRange = aggregationRangeFittingPoints(xValues, 0, 2 ** 28, { smallestKeyInterval: 1 });

        expect(maxRange).toBeLessThanOrEqual(nextPowerOf2(xValues.length));
    });
});

describe('createAggregationIndices', () => {
    it('leaves empty split-mode buckets unset on a category domain', () => {
        const count = 64;
        const xValues = Array.from({ length: count }, (_, i) => `c${i}`);
        const yValues = Array.from({ length: count }, (_, i) => i + 1);

        const { indexData, negativeIndexData } = createAggregationIndices(
            xValues,
            yValues,
            yValues,
            Number.NaN,
            Number.NaN,
            16,
            { split: true, xNeedsValueOf: false, yNeedsValueOf: false }
        );

        for (let i = 0; i < 16; i++) {
            expect(indexData[i * AGGREGATION_SPAN + AGGREGATION_INDEX_X_MIN]).not.toBe(AGGREGATION_INDEX_UNSET);
            expect(negativeIndexData![i * AGGREGATION_SPAN + AGGREGATION_INDEX_X_MIN]).toBe(AGGREGATION_INDEX_UNSET);
        }
    });
});

describe('computeExtremesAggregation', () => {
    describe('threshold behavior', () => {
        it('should return undefined when data points below threshold', () => {
            const xValues = Array.from({ length: 500 }, (_, i) => i);
            const highValues = Array.from({ length: 500 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 500 }, () => Math.random() * 100);

            const result = computeExtremesAggregation([0, 500], xValues, highValues, lowValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeUndefined();
        });

        it('should return filters when data points at threshold', () => {
            const xValues = Array.from({ length: 1000 }, (_, i) => i);
            const highValues = Array.from({ length: 1000 }, (_, i) => 50 + i * 0.1);
            const lowValues = Array.from({ length: 1000 }, (_, i) => 50 - i * 0.1);

            const result = computeExtremesAggregation([0, 1000], xValues, highValues, lowValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
            // At threshold, should have at least one filter level
            const coarsestLevel = result![0];
            expect(coarsestLevel.maxRange).toBeLessThanOrEqual(64);
            expect(coarsestLevel.indexData.length).toBe(coarsestLevel.maxRange * AGGREGATION_SPAN);
        });

        it('should return filters when data points above threshold', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const highValues = Array.from({ length: 2000 }, (_, i) => 50 + i * 0.1);
            const lowValues = Array.from({ length: 2000 }, (_, i) => 50 - i * 0.1);

            const result = computeExtremesAggregation([0, 2000], xValues, highValues, lowValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
            // Large dataset should generate multiple compaction levels
            // Verify compaction progression: each level should have double the maxRange of previous
            for (let i = 1; i < result!.length; i++) {
                expect(result![i].maxRange).toBe(result![i - 1].maxRange * 2);
            }
            // Coarsest level should stop at 64 or less
            expect(result![0].maxRange).toBeLessThanOrEqual(64);
        });
    });

    describe('multi-level filter generation', () => {
        it('should generate multiple aggregation levels', () => {
            const xValues = Array.from({ length: 5000 }, (_, i) => i);
            const highValues = Array.from({ length: 5000 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 5000 }, () => Math.random() * 100);

            const result = computeExtremesAggregation([0, 5000], xValues, highValues, lowValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThanOrEqual(2);
            for (const filter of result!) {
                expect(filter.midpointIndices).toBeInstanceOf(Uint32Array);
                expect(filter.midpointIndices.length).toBe(filter.maxRange);
            }
        });

        it('should have coarser levels first', () => {
            const xValues = Array.from({ length: 3000 }, (_, i) => i);
            const highValues = Array.from({ length: 3000 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 3000 }, () => Math.random() * 100);

            const result = computeExtremesAggregation([0, 3000], xValues, highValues, lowValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            for (let i = 1; i < result!.length; i++) {
                expect(result![i].maxRange).toBeGreaterThan(result![i - 1].maxRange);
            }
        });

        it('should stop when maxRange <= 64', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const highValues = Array.from({ length: 2000 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 2000 }, () => Math.random() * 100);

            const result = computeExtremesAggregation([0, 2000], xValues, highValues, lowValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            const finestLevel = result![result!.length - 1];
            expect(finestLevel.maxRange).toBeGreaterThan(64);
        });

        it('should respect domain boundaries', () => {
            const xValues = Array.from({ length: 3000 }, (_, i) => i);
            const highValues = Array.from({ length: 3000 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 3000 }, () => Math.random() * 100);

            const result = computeExtremesAggregation([500, 2500], xValues, highValues, lowValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
        });
    });

    describe('edge cases', () => {
        it('should handle empty data', () => {
            const result = computeExtremesAggregation([0, 0], [], [], [], {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeUndefined();
        });

        it('should handle single data point', () => {
            const result = computeExtremesAggregation([0, 1], [0], [50], [25], {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeUndefined();
        });

        it('should handle sparse data within domain', () => {
            const xValues = Array.from({ length: 1000 }, (_, i) => i * 10);
            const highValues = Array.from({ length: 1000 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 1000 }, () => Math.random() * 100);

            const result = computeExtremesAggregation([0, 10000], xValues, highValues, lowValues, {
                smallestKeyInterval: 10,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
        });

        it('should handle data with gaps', () => {
            const xValues: number[] = [];
            const highValues: number[] = [];
            const lowValues: number[] = [];

            // Create data with gaps: 0-499, 1000-1499, 2000-2499
            for (let i = 0; i < 500; i++) {
                xValues.push(i);
                highValues.push(Math.random() * 100);
                lowValues.push(Math.random() * 100);
            }
            for (let i = 1000; i < 1500; i++) {
                xValues.push(i);
                highValues.push(Math.random() * 100);
                lowValues.push(Math.random() * 100);
            }
            for (let i = 2000; i < 2500; i++) {
                xValues.push(i);
                highValues.push(Math.random() * 100);
                lowValues.push(Math.random() * 100);
            }

            const result = computeExtremesAggregation([0, 2500], xValues, highValues, lowValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
        });

        it('should handle extreme high/low spread', () => {
            const xValues = Array.from({ length: 1000 }, (_, i) => i);
            const highValues = Array.from({ length: 1000 }, () => 1e6);
            const lowValues = Array.from({ length: 1000 }, () => -1e6);

            const result = computeExtremesAggregation([0, 1000], xValues, highValues, lowValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
        });

        it('should handle negative ranges', () => {
            const xValues = Array.from({ length: 1200 }, (_, i) => i);
            const highValues = Array.from({ length: 1200 }, () => -10);
            const lowValues = Array.from({ length: 1200 }, () => -50);

            const result = computeExtremesAggregation([0, 1200], xValues, highValues, lowValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            const { indexData } = result![0];

            for (let i = 0; i < result![0].maxRange; i++) {
                const aggIndex = i * AGGREGATION_SPAN;
                const highIndex = indexData[aggIndex + AGGREGATION_INDEX_Y_MAX];
                const lowIndex = indexData[aggIndex + AGGREGATION_INDEX_Y_MIN];

                if (highIndex >= 0) {
                    // High should still be >= Low even with negative values
                    expect(highValues[highIndex]).toBeGreaterThanOrEqual(lowValues[lowIndex]);
                }
            }
        });
    });

    describe('smallestKeyInterval handling', () => {
        it('should work with undefined smallestKeyInterval', () => {
            const xValues = Array.from({ length: 1200 }, (_, i) => i);
            const highValues = Array.from({ length: 1200 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 1200 }, () => Math.random() * 100);

            const result = computeExtremesAggregation([0, 1200], xValues, highValues, lowValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
        });

        it('should work with defined smallestKeyInterval', () => {
            const xValues = Array.from({ length: 1200 }, (_, i) => i * 2);
            const highValues = Array.from({ length: 1200 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 1200 }, () => Math.random() * 100);

            const result = computeExtremesAggregation([0, 2400], xValues, highValues, lowValues, {
                smallestKeyInterval: 2,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
        });

        it('should handle irregular intervals', () => {
            const xValues: number[] = [];
            for (let i = 0; i < 1200; i++) {
                xValues.push(i + Math.random() * 0.5);
            }
            const highValues = Array.from({ length: 1200 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 1200 }, () => Math.random() * 100);

            const result = computeExtremesAggregation([0, 1200], xValues, highValues, lowValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
        });
    });

    describe('filter structure', () => {
        it('should return filters with correct structure', () => {
            const xValues = Array.from({ length: 1500 }, (_, i) => i);
            const highValues = Array.from({ length: 1500 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 1500 }, () => Math.random() * 100);

            const result = computeExtremesAggregation([0, 1500], xValues, highValues, lowValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            for (const filter of result!) {
                expect(filter).toHaveProperty('maxRange');
                expect(filter).toHaveProperty('indexData');
                expect(filter.maxRange).toBeGreaterThan(0);
                expect(filter.indexData).toBeInstanceOf(Uint32Array);
                expect(filter.indexData.length).toBe(filter.maxRange * AGGREGATION_SPAN);
            }
        });

        it('should use Uint32Array for index storage', () => {
            const xValues = Array.from({ length: 1000 }, (_, i) => i);
            const highValues = Array.from({ length: 1000 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 1000 }, () => Math.random() * 100);

            const result = computeExtremesAggregation([0, 1000], xValues, highValues, lowValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result![0].indexData).toBeInstanceOf(Uint32Array);
        });

        it('should have valid SPAN-based indexing', () => {
            const xValues = Array.from({ length: 1200 }, (_, i) => i);
            const highValues = Array.from({ length: 1200 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 1200 }, () => Math.random() * 100);

            const result = computeExtremesAggregation([0, 1200], xValues, highValues, lowValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            const { indexData, maxRange } = result![0];

            // Each bucket should have AGGREGATION_SPAN indices
            expect(indexData.length).toBe(maxRange * AGGREGATION_SPAN);

            // Verify we can access all four indices for each bucket
            for (let i = 0; i < maxRange; i++) {
                const aggIndex = i * AGGREGATION_SPAN;
                expect(aggIndex + AGGREGATION_INDEX_X_MIN).toBeLessThan(indexData.length);
                expect(aggIndex + AGGREGATION_INDEX_Y_MAX).toBeLessThan(indexData.length);
                expect(aggIndex + AGGREGATION_INDEX_Y_MIN).toBeLessThan(indexData.length);
                expect(aggIndex + AGGREGATION_INDEX_X_MAX).toBeLessThan(indexData.length);
            }
        });
    });

    describe('domain boundaries', () => {
        it('should respect scale domain boundaries', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const highValues = Array.from({ length: 2000 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 2000 }, () => Math.random() * 100);

            // Use a subset of the data
            const result = computeExtremesAggregation([500, 1500], xValues, highValues, lowValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            // Verify the aggregation respects the domain
            const { indexData } = result![0];
            for (let i = 0; i < result![0].maxRange; i++) {
                const aggIndex = i * AGGREGATION_SPAN;
                const startIndex = indexData[aggIndex + AGGREGATION_INDEX_X_MIN];
                if (startIndex >= 0) {
                    expect(xValues[startIndex]).toBeGreaterThanOrEqual(500);
                    expect(xValues[startIndex]).toBeLessThanOrEqual(1500);
                }
            }
        });
    });
});
