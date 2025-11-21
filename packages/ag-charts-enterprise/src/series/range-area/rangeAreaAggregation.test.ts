import { computeRangeAreaAggregation } from './rangeAreaAggregation';

describe('computeRangeAreaAggregation', () => {
    describe('threshold behavior', () => {
        it('should return undefined when data points below threshold', () => {
            const xValues = Array.from({ length: 500 }, (_, i) => i);
            const highValues = Array.from({ length: 500 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 500 }, () => Math.random() * 100);

            const result = computeRangeAreaAggregation([0, 500], xValues, highValues, lowValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeUndefined();
        });

        it('should return filters when data points at threshold', () => {
            const xValues = Array.from({ length: 1000 }, (_, i) => i);
            const highValues = Array.from({ length: 1000 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 1000 }, () => Math.random() * 100);

            const result = computeRangeAreaAggregation([0, 1000], xValues, highValues, lowValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
        });

        it('should return filters when data points above threshold', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const highValues = Array.from({ length: 2000 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 2000 }, () => Math.random() * 100);

            const result = computeRangeAreaAggregation([0, 2000], xValues, highValues, lowValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
        });
    });

    describe('multi-level filter generation', () => {
        it('should generate multiple aggregation levels', () => {
            const xValues = Array.from({ length: 5000 }, (_, i) => i);
            const highValues = Array.from({ length: 5000 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 5000 }, () => Math.random() * 100);

            const result = computeRangeAreaAggregation([0, 5000], xValues, highValues, lowValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThanOrEqual(2);
        });

        it('should have coarser levels first', () => {
            const xValues = Array.from({ length: 3000 }, (_, i) => i);
            const highValues = Array.from({ length: 3000 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 3000 }, () => Math.random() * 100);

            const result = computeRangeAreaAggregation([0, 3000], xValues, highValues, lowValues, {
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

            const result = computeRangeAreaAggregation([0, 2000], xValues, highValues, lowValues, {
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

            const result = computeRangeAreaAggregation([500, 2500], xValues, highValues, lowValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
        });
    });

    describe('top/bottom indices tracking', () => {
        it('should track top and bottom indices correctly', () => {
            const xValues = Array.from({ length: 1000 }, (_, i) => i);
            const highValues = Array.from({ length: 1000 }, (_, i) => 50 + i * 0.1);
            const lowValues = Array.from({ length: 1000 }, (_, i) => 50 - i * 0.1);

            const result = computeRangeAreaAggregation([0, 1000], xValues, highValues, lowValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            const { topIndices, bottomIndices } = result![0];

            expect(topIndices.length).toBeGreaterThan(0);
            expect(bottomIndices.length).toBeGreaterThan(0);

            // All indices should be valid
            for (const index of topIndices) {
                expect(index).toBeGreaterThanOrEqual(0);
                expect(index).toBeLessThan(xValues.length);
            }

            for (const index of bottomIndices) {
                expect(index).toBeGreaterThanOrEqual(0);
                expect(index).toBeLessThan(xValues.length);
            }
        });

        it('should have non-empty top indices for monotonically increasing high values', () => {
            const xValues = Array.from({ length: 1500 }, (_, i) => i);
            const highValues = Array.from({ length: 1500 }, (_, i) => i);
            const lowValues = Array.from({ length: 1500 }, () => 0);

            const result = computeRangeAreaAggregation([0, 1500], xValues, highValues, lowValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            const { topIndices } = result![0];

            expect(topIndices.length).toBeGreaterThan(0);
            for (const index of topIndices) {
                expect(index).toBeGreaterThanOrEqual(0);
                expect(index).toBeLessThan(xValues.length);
            }
        });

        it('should have non-empty bottom indices for monotonically decreasing low values', () => {
            const xValues = Array.from({ length: 1500 }, (_, i) => i);
            const highValues = Array.from({ length: 1500 }, () => 100);
            const lowValues = Array.from({ length: 1500 }, (_, i) => 100 - i);

            const result = computeRangeAreaAggregation([0, 1500], xValues, highValues, lowValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            const { bottomIndices } = result![0];

            expect(bottomIndices.length).toBeGreaterThan(0);
            for (const index of bottomIndices) {
                expect(index).toBeGreaterThanOrEqual(0);
                expect(index).toBeLessThan(xValues.length);
            }
        });

        it('should track indices for constant values', () => {
            const xValues = Array.from({ length: 1200 }, (_, i) => i);
            const highValues = Array.from({ length: 1200 }, () => 75);
            const lowValues = Array.from({ length: 1200 }, () => 25);

            const result = computeRangeAreaAggregation([0, 1200], xValues, highValues, lowValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            const { topIndices, bottomIndices } = result![0];

            expect(topIndices.length).toBeGreaterThan(0);
            expect(bottomIndices.length).toBeGreaterThan(0);
        });

        it('should filter indices correctly across aggregation levels', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const highValues = Array.from({ length: 2000 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 2000 }, () => Math.random() * 100);

            const result = computeRangeAreaAggregation([0, 2000], xValues, highValues, lowValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            // Coarser levels should have fewer or equal indices than finer levels
            for (let i = 1; i < result!.length; i++) {
                const coarser = result![i - 1];
                const finer = result![i];

                expect(coarser.topIndices.length).toBeLessThanOrEqual(finer.topIndices.length);
                expect(coarser.bottomIndices.length).toBeLessThanOrEqual(finer.bottomIndices.length);
            }
        });
    });

    describe('edge cases', () => {
        it('should handle empty data', () => {
            const result = computeRangeAreaAggregation([0, 0], [], [], [], {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeUndefined();
        });

        it('should handle single data point', () => {
            const result = computeRangeAreaAggregation([0, 1], [0], [50], [25], {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeUndefined();
        });

        it('should handle sparse data within domain', () => {
            const xValues = Array.from({ length: 1000 }, (_, i) => i * 10);
            const highValues = Array.from({ length: 1000 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 1000 }, () => Math.random() * 100);

            const result = computeRangeAreaAggregation([0, 10000], xValues, highValues, lowValues, {
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

            const result = computeRangeAreaAggregation([0, 2500], xValues, highValues, lowValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
        });

        it('should handle extreme high/low spread', () => {
            const xValues = Array.from({ length: 1000 }, (_, i) => i);
            const highValues = Array.from({ length: 1000 }, () => 1e6);
            const lowValues = Array.from({ length: 1000 }, () => -1e6);

            const result = computeRangeAreaAggregation([0, 1000], xValues, highValues, lowValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
        });

        it('should handle negative ranges', () => {
            const xValues = Array.from({ length: 1200 }, (_, i) => i);
            const highValues = Array.from({ length: 1200 }, () => -10);
            const lowValues = Array.from({ length: 1200 }, () => -50);

            const result = computeRangeAreaAggregation([0, 1200], xValues, highValues, lowValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
        });
    });

    describe('valueOf flags', () => {
        it('should work with xNeedsValueOf=true', () => {
            const xValues = Array.from({ length: 1200 }, (_, i) => i);
            const highValues = Array.from({ length: 1200 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 1200 }, () => Math.random() * 100);

            const result = computeRangeAreaAggregation([0, 1200], xValues, highValues, lowValues, {
                xNeedsValueOf: true,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
        });

        it('should work with yNeedsValueOf=true', () => {
            const xValues = Array.from({ length: 1200 }, (_, i) => i);
            const highValues = Array.from({ length: 1200 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 1200 }, () => Math.random() * 100);

            const result = computeRangeAreaAggregation([0, 1200], xValues, highValues, lowValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: true,
            });

            expect(result).toBeDefined();
        });

        it('should work with both valueOf flags true', () => {
            const xValues = Array.from({ length: 1200 }, (_, i) => i);
            const highValues = Array.from({ length: 1200 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 1200 }, () => Math.random() * 100);

            const result = computeRangeAreaAggregation([0, 1200], xValues, highValues, lowValues, {
                xNeedsValueOf: true,
                yNeedsValueOf: true,
            });

            expect(result).toBeDefined();
        });

        it('should work with both valueOf flags false', () => {
            const xValues = Array.from({ length: 1200 }, (_, i) => i);
            const highValues = Array.from({ length: 1200 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 1200 }, () => Math.random() * 100);

            const result = computeRangeAreaAggregation([0, 1200], xValues, highValues, lowValues, {
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

            const result = computeRangeAreaAggregation([0, 1500], xValues, highValues, lowValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            for (const filter of result!) {
                expect(filter).toHaveProperty('maxRange');
                expect(filter).toHaveProperty('topIndices');
                expect(filter).toHaveProperty('bottomIndices');
                expect(filter.maxRange).toBeGreaterThan(0);
                expect(Array.isArray(filter.topIndices)).toBe(true);
                expect(Array.isArray(filter.bottomIndices)).toBe(true);
            }
        });

        it('should use arrays for top/bottom indices storage', () => {
            const xValues = Array.from({ length: 1000 }, (_, i) => i);
            const highValues = Array.from({ length: 1000 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 1000 }, () => Math.random() * 100);

            const result = computeRangeAreaAggregation([0, 1000], xValues, highValues, lowValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(Array.isArray(result![0].topIndices)).toBe(true);
            expect(Array.isArray(result![0].bottomIndices)).toBe(true);
        });

        it('should have distinct indices in top and bottom arrays', () => {
            const xValues = Array.from({ length: 1200 }, (_, i) => i);
            const highValues = Array.from({ length: 1200 }, (_, i) => 50 + Math.sin(i * 0.1) * 25);
            const lowValues = Array.from({ length: 1200 }, (_, i) => 50 - Math.sin(i * 0.1) * 25);

            const result = computeRangeAreaAggregation([0, 1200], xValues, highValues, lowValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            const { topIndices, bottomIndices } = result![0];

            // Verify indices are sorted
            for (let i = 1; i < topIndices.length; i++) {
                expect(topIndices[i]).toBeGreaterThan(topIndices[i - 1]);
            }
            for (let i = 1; i < bottomIndices.length; i++) {
                expect(bottomIndices[i]).toBeGreaterThan(bottomIndices[i - 1]);
            }
        });
    });

    describe('performance', () => {
        it('should handle large datasets efficiently', () => {
            const xValues = Array.from({ length: 10000 }, (_, i) => i);
            const highValues = Array.from({ length: 10000 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 10000 }, () => Math.random() * 100);

            const start = performance.now();
            const result = computeRangeAreaAggregation([0, 10000], xValues, highValues, lowValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });
            const duration = performance.now() - start;

            expect(result).toBeDefined();
            expect(duration).toBeLessThan(1000); // Should complete in < 1 second
        });

        it('should produce compact aggregation for large datasets', () => {
            const xValues = Array.from({ length: 50000 }, (_, i) => i);
            const highValues = Array.from({ length: 50000 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 50000 }, () => Math.random() * 100);

            const result = computeRangeAreaAggregation([0, 50000], xValues, highValues, lowValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            const coarsestLevel = result![0];
            // Should have significantly fewer tracked indices than data points
            expect(coarsestLevel.topIndices.length + coarsestLevel.bottomIndices.length).toBeLessThan(
                xValues.length / 5
            );
        });
    });

    describe('domain boundaries', () => {
        it('should produce indices primarily within domain boundaries', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const highValues = Array.from({ length: 2000 }, () => Math.random() * 100);
            const lowValues = Array.from({ length: 2000 }, () => Math.random() * 100);

            // Use a subset of the data
            const result = computeRangeAreaAggregation([500, 1500], xValues, highValues, lowValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            // Verify most indices respect the domain (allowing for edge bucket spillover)
            const { topIndices, bottomIndices } = result![0];
            const allIndices = [...topIndices, ...bottomIndices];
            const indicesWithinDomain = allIndices.filter((index) => xValues[index] >= 500 && xValues[index] <= 1500);

            // At least 90% of indices should be within the domain
            expect(indicesWithinDomain.length).toBeGreaterThanOrEqual(allIndices.length * 0.9);
        });
    });
});
