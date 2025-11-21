import { AGGREGATION_INDEX_X_MAX, AGGREGATION_INDEX_X_MIN, AGGREGATION_SPAN } from '../aggregation';
import { computeBarAggregation } from './barAggregation';

describe('computeBarAggregation', () => {
    describe('threshold behavior', () => {
        it('should return undefined for datasets below threshold (< 1000 points)', () => {
            const xValues = Array.from({ length: 999 }, (_, i) => i);
            const yValues = Array.from({ length: 999 }, (_, i) => i * 10);
            const domain: [number, number] = [0, 998];

            const result = computeBarAggregation(domain, xValues, undefined, yValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeUndefined();
        });

        it('should return aggregation filters for datasets at threshold (1000 points)', () => {
            const xValues = Array.from({ length: 1000 }, (_, i) => i);
            const yValues = Array.from({ length: 1000 }, (_, i) => i * 10);
            const domain: [number, number] = [0, 999];

            const result = computeBarAggregation(domain, xValues, undefined, yValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result!.length).toBeGreaterThan(0);
            // At threshold, should have at least one filter level
            const coarsestLevel = result![0];
            expect(coarsestLevel.maxRange).toBeLessThanOrEqual(64);
            expect(coarsestLevel.positiveIndices.length).toBe(coarsestLevel.maxRange);
            expect(coarsestLevel.negativeIndices.length).toBe(coarsestLevel.maxRange);
        });

        it('should return aggregation filters for large datasets (> 1000 points)', () => {
            const xValues = Array.from({ length: 5000 }, (_, i) => i);
            const yValues = Array.from({ length: 5000 }, (_, i) => i * 10);
            const domain: [number, number] = [0, 4999];

            const result = computeBarAggregation(domain, xValues, undefined, yValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
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
        it('should generate multiple filter levels ordered from coarse to fine', () => {
            const xValues = Array.from({ length: 10000 }, (_, i) => i);
            const yValues = Array.from({ length: 10000 }, (_, i) => i * 10);
            const domain: [number, number] = [0, 9999];

            const result = computeBarAggregation(domain, xValues, undefined, yValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(1);

            // Verify filters are ordered from coarse (low maxRange) to fine (high maxRange)
            for (let i = 1; i < result!.length; i++) {
                expect(result![i].maxRange).toBeGreaterThan(result![i - 1].maxRange);
            }
        });

        it('should stop compacting when maxRange reaches 64', () => {
            const xValues = Array.from({ length: 10000 }, (_, i) => i);
            const yValues = Array.from({ length: 10000 }, (_, i) => i * 10);
            const domain: [number, number] = [0, 9999];

            const result = computeBarAggregation(domain, xValues, undefined, yValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            // The coarsest level should have maxRange <= 64
            const coarsestLevel = result![0];
            expect(coarsestLevel.maxRange).toBeLessThanOrEqual(64);
        });
    });

    describe('positive and negative value separation', () => {
        it('should separate positive and negative values into different indices', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => (i % 2 === 0 ? 100 : -100));
            const domain: [number, number] = [0, 1999];

            const result = computeBarAggregation(domain, xValues, undefined, yValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            for (const filter of result!) {
                expect(filter.positiveIndices).toBeDefined();
                expect(filter.negativeIndices).toBeDefined();
                expect(filter.positiveIndexData).toBeDefined();
                expect(filter.negativeIndexData).toBeDefined();
            }
        });

        it('should handle all positive values', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => i + 1);
            const domain: [number, number] = [0, 1999];

            const result = computeBarAggregation(domain, xValues, undefined, yValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            for (const filter of result!) {
                expect(filter.positiveIndices.length).toBeGreaterThan(0);
                expect(Array.isArray(filter.negativeIndices)).toBe(true);
                // All negative indices should be sentinel values (-1) when no negative data exists
                expect(filter.negativeIndices.every((idx) => idx === -1)).toBe(true);
                // Verify corresponding typed array also uses sentinels
                for (let i = 0; i < filter.maxRange; i++) {
                    const aggIndex = i * AGGREGATION_SPAN;
                    // X_MIN and X_MAX indices should be -1 for empty negative buckets
                    expect(filter.negativeIndexData[aggIndex + AGGREGATION_INDEX_X_MIN]).toBe(-1);
                    expect(filter.negativeIndexData[aggIndex + AGGREGATION_INDEX_X_MAX]).toBe(-1);
                }
            }
        });

        it('should handle all negative values', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => -(i + 1));
            const domain: [number, number] = [0, 1999];

            const result = computeBarAggregation(domain, xValues, undefined, yValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            for (const filter of result!) {
                expect(Array.isArray(filter.positiveIndices)).toBe(true);
                expect(filter.negativeIndices.length).toBeGreaterThan(0);
                // All positive indices should be sentinel values (-1) when no positive data exists
                expect(filter.positiveIndices.every((idx) => idx === -1)).toBe(true);
                // Verify corresponding typed array also uses sentinels
                for (let i = 0; i < filter.maxRange; i++) {
                    const aggIndex = i * AGGREGATION_SPAN;
                    // X_MIN and X_MAX indices should be -1 for empty positive buckets
                    expect(filter.positiveIndexData[aggIndex + AGGREGATION_INDEX_X_MIN]).toBe(-1);
                    expect(filter.positiveIndexData[aggIndex + AGGREGATION_INDEX_X_MAX]).toBe(-1);
                }
            }
        });

        it('should handle mixed positive and negative values', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => Math.sin(i / 10) * 100);
            const domain: [number, number] = [0, 1999];

            const result = computeBarAggregation(domain, xValues, undefined, yValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            for (const filter of result!) {
                // Both should have some representation
                expect(filter.positiveIndices.length + filter.negativeIndices.length).toBeGreaterThan(0);
            }
        });
    });

    describe('stacked bars', () => {
        it('should handle stacked bars with yStartValues', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yStartValues = Array.from({ length: 2000 }, (_, i) => i);
            const yEndValues = Array.from({ length: 2000 }, (_, i) => i + 100);
            const domain: [number, number] = [0, 1999];

            const result = computeBarAggregation(domain, xValues, yStartValues, yEndValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
            // Verify stacked bars aggregate correctly: all values are positive (yEnd > yStart)
            const filter = result![0];
            expect(filter.positiveIndices.length).toBe(filter.maxRange);
            // Should have some non-sentinel positive indices
            const hasPositiveData = filter.positiveIndices.some((idx) => idx >= 0);
            expect(hasPositiveData).toBe(true);
            // Negative indices should all be sentinels since all bars are positive
            expect(filter.negativeIndices.every((idx) => idx === -1)).toBe(true);
        });

        it('should handle non-stacked bars (yStartValues undefined)', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yEndValues = Array.from({ length: 2000 }, (_, i) => i);
            const domain: [number, number] = [0, 1999];

            const result = computeBarAggregation(domain, xValues, undefined, yEndValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
        });
    });

    describe('edge cases', () => {
        it('should handle uniform Y values', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, () => 42);
            const domain: [number, number] = [0, 1999];

            const result = computeBarAggregation(domain, xValues, undefined, yValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
        });

        it('should handle zero values', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, () => 0);
            const domain: [number, number] = [0, 1999];

            const result = computeBarAggregation(domain, xValues, undefined, yValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
        });

        it('should handle NaN domain', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => `category-${i}`);
            const yValues = Array.from({ length: 2000 }, (_, i) => i);
            const domain: [number, number] = [Number.NaN, Number.NaN];

            const result = computeBarAggregation(domain, xValues, undefined, yValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            // Should still work with categorical X axis (uses indices)
        });
    });

    describe('smallestKeyInterval parameter', () => {
        it('should accept smallestKeyInterval for category axes', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => i * 10);
            const domain: [number, number] = [0, 1999];

            const result = computeBarAggregation(domain, xValues, undefined, yValues, {
                smallestKeyInterval: 1,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
        });
    });

    describe('valueOf conversion flags', () => {
        it('should handle xNeedsValueOf = true for Date objects', () => {
            const startDate = new Date('2020-01-01').getTime();
            const xValues = Array.from({ length: 2000 }, (_, i) => new Date(startDate + i * 86400000));
            const yValues = Array.from({ length: 2000 }, (_, i) => i * 10);
            const domain: [number, number] = [startDate, startDate + 1999 * 86400000];

            const result = computeBarAggregation(domain, xValues, undefined, yValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: true,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
        });

        it('should handle yNeedsValueOf = true for wrapped values', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => ({ valueOf: () => i * 10 }));
            const domain: [number, number] = [0, 1999];

            const result = computeBarAggregation(domain, xValues, undefined, yValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: true,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
        });
    });

    describe('filter structure', () => {
        it('should return filters with correct structure', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => i * 10);
            const domain: [number, number] = [0, 1999];

            const result = computeBarAggregation(domain, xValues, undefined, yValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            for (const filter of result!) {
                expect(filter).toHaveProperty('maxRange');
                expect(filter).toHaveProperty('positiveIndices');
                expect(filter).toHaveProperty('positiveIndexData');
                expect(filter).toHaveProperty('negativeIndices');
                expect(filter).toHaveProperty('negativeIndexData');

                expect(typeof filter.maxRange).toBe('number');
                expect(filter.maxRange).toBeGreaterThan(0);

                expect(Array.isArray(filter.positiveIndices)).toBe(true);
                expect(Array.isArray(filter.negativeIndices)).toBe(true);
                expect(filter.positiveIndexData).toBeInstanceOf(Int32Array);
                expect(filter.negativeIndexData).toBeInstanceOf(Int32Array);
            }
        });

        it('should have indices within data range or -1 for empty buckets', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => Math.sin(i / 10) * 100);
            const domain: [number, number] = [0, 1999];

            const result = computeBarAggregation(domain, xValues, undefined, yValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            for (const filter of result!) {
                for (const index of filter.positiveIndices) {
                    // Can be -1 for empty buckets, or a valid index
                    expect(index).toBeGreaterThanOrEqual(-1);
                    if (index >= 0) {
                        expect(index).toBeLessThan(xValues.length);
                    }
                }
                for (const index of filter.negativeIndices) {
                    // Can be -1 for empty buckets, or a valid index
                    expect(index).toBeGreaterThanOrEqual(-1);
                    if (index >= 0) {
                        expect(index).toBeLessThan(xValues.length);
                    }
                }
            }
        });

        it('should have maxRange values that match index array lengths', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => i * 10);
            const domain: [number, number] = [0, 1999];

            const result = computeBarAggregation(domain, xValues, undefined, yValues, {
                smallestKeyInterval: undefined,
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            for (const filter of result!) {
                // Each filter should have maxRange number of indices
                expect(filter.positiveIndices.length).toBe(filter.maxRange);
                expect(filter.negativeIndices.length).toBe(filter.maxRange);
            }
        });
    });
});
