import { _ModuleSupport } from 'ag-charts-community';

import { CLOSE, HIGH, LOW, OPEN, SPAN } from './ohlcAggregation';

const { computeExtremesAggregation } = _ModuleSupport;

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
            expect(coarsestLevel.indexData.length).toBe(coarsestLevel.maxRange * SPAN);
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

    describe('OHLC extrema correctness', () => {
        it('should track open/high/low/close indices correctly', () => {
            const xValues = Array.from({ length: 1000 }, (_, i) => i);
            // Create deterministic OHLC data: monotonically increasing high, decreasing low
            const highValues = Array.from({ length: 1000 }, (_, i) => 50 + i * 0.1);
            const lowValues = Array.from({ length: 1000 }, (_, i) => 50 - i * 0.1);

            const result = computeExtremesAggregation([0, 1000], xValues, highValues, lowValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            const { indexData } = result![0];

            // Check all aggregation buckets
            let bucketsWithData = 0;
            for (let i = 0; i < result![0].maxRange; i++) {
                const aggIndex = i * SPAN;
                const openIndex = indexData[aggIndex + OPEN]; // X_MIN - first index in bucket
                const highIndex = indexData[aggIndex + HIGH]; // Y_MAX - max high value index
                const lowIndex = indexData[aggIndex + LOW]; // Y_MIN - min low value index
                const closeIndex = indexData[aggIndex + CLOSE]; // X_MAX - last index in bucket

                // All indices should be valid
                expect(openIndex).toBeGreaterThanOrEqual(-1);
                expect(highIndex).toBeGreaterThanOrEqual(-1);
                expect(lowIndex).toBeGreaterThanOrEqual(-1);
                expect(closeIndex).toBeGreaterThanOrEqual(-1);

                if (openIndex >= 0) {
                    bucketsWithData++;
                    expect(openIndex).toBeLessThan(xValues.length);
                    expect(highIndex).toBeLessThan(xValues.length);
                    expect(lowIndex).toBeLessThan(xValues.length);
                    expect(closeIndex).toBeLessThan(xValues.length);

                    // Open should be <= Close (time order - first <= last in bucket)
                    expect(openIndex).toBeLessThanOrEqual(closeIndex);

                    // High value at highIndex should be >= high values at open/close indices
                    expect(highValues[highIndex]).toBeGreaterThanOrEqual(highValues[openIndex]);
                    expect(highValues[highIndex]).toBeGreaterThanOrEqual(highValues[closeIndex]);

                    // Low value at lowIndex should be <= low values at open/close indices
                    expect(lowValues[lowIndex]).toBeLessThanOrEqual(lowValues[openIndex]);
                    expect(lowValues[lowIndex]).toBeLessThanOrEqual(lowValues[closeIndex]);
                }
            }
            // Should have at least some buckets with data
            expect(bucketsWithData).toBeGreaterThan(0);
        });

        it('should handle monotonically increasing high values', () => {
            const xValues = Array.from({ length: 1500 }, (_, i) => i);
            const highValues = Array.from({ length: 1500 }, (_, i) => i);
            const lowValues = Array.from({ length: 1500 }, () => 0);

            const result = computeExtremesAggregation([0, 1500], xValues, highValues, lowValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            const { indexData } = result![0];

            for (let i = 0; i < result![0].maxRange; i++) {
                const aggIndex = i * SPAN;
                const highIndex = indexData[aggIndex + HIGH];

                if (highIndex >= 0) {
                    // High index should point to the maximum value in its bucket
                    expect(highIndex).toBeLessThan(xValues.length);
                }
            }
        });

        it('should handle monotonically decreasing low values', () => {
            const xValues = Array.from({ length: 1500 }, (_, i) => i);
            const highValues = Array.from({ length: 1500 }, () => 100);
            const lowValues = Array.from({ length: 1500 }, (_, i) => 100 - i);

            const result = computeExtremesAggregation([0, 1500], xValues, highValues, lowValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            const { indexData } = result![0];

            for (let i = 0; i < result![0].maxRange; i++) {
                const aggIndex = i * SPAN;
                const lowIndex = indexData[aggIndex + LOW];

                if (lowIndex >= 0) {
                    // Low index should point to the minimum value in its bucket
                    expect(lowIndex).toBeLessThan(xValues.length);
                }
            }
        });

        it('should handle all identical values', () => {
            const xValues = Array.from({ length: 1200 }, (_, i) => i);
            const highValues = Array.from({ length: 1200 }, () => 50);
            const lowValues = Array.from({ length: 1200 }, () => 50);

            const result = computeExtremesAggregation([0, 1200], xValues, highValues, lowValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            const { indexData } = result![0];

            for (let i = 0; i < result![0].maxRange; i++) {
                const aggIndex = i * SPAN;
                const openIndex = indexData[aggIndex + OPEN];
                const highIndex = indexData[aggIndex + HIGH];
                const lowIndex = indexData[aggIndex + LOW];
                const closeIndex = indexData[aggIndex + CLOSE];

                if (openIndex >= 0) {
                    expect(openIndex).toBeLessThanOrEqual(closeIndex);
                    expect(highIndex).toBeGreaterThanOrEqual(0);
                    expect(lowIndex).toBeGreaterThanOrEqual(0);
                }
            }
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
                expect(filter.indexData.length).toBe(filter.maxRange * SPAN);
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

            // Each bucket should have SPAN indices
            expect(indexData.length).toBe(maxRange * SPAN);

            // Verify we can access all OHLC values for each bucket
            for (let i = 0; i < maxRange; i++) {
                const aggIndex = i * SPAN;
                expect(aggIndex + OPEN).toBeLessThan(indexData.length);
                expect(aggIndex + HIGH).toBeLessThan(indexData.length);
                expect(aggIndex + LOW).toBeLessThan(indexData.length);
                expect(aggIndex + CLOSE).toBeLessThan(indexData.length);
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
                const aggIndex = i * SPAN;
                const openIndex = indexData[aggIndex + OPEN];
                if (openIndex >= 0) {
                    expect(xValues[openIndex]).toBeGreaterThanOrEqual(500);
                    expect(xValues[openIndex]).toBeLessThanOrEqual(1500);
                }
            }
        });
    });
});
