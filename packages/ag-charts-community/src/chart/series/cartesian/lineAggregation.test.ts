import { describe, expect, it } from 'vitest';

import type { DataModel } from '../../data/dataModel';
import type { ProcessedData, ScopeProvider } from '../../data/dataModelTypes';
import { aggregateLineDataFromDataModel, computeLineAggregation } from './lineAggregation';

// Minimal DataModel stub driving the real aggregation entry point.
const series: ScopeProvider = { id: 'series-1' };
const stubLineDataModel = (xValues: any[], yValues: any[], domain: any[]) =>
    ({
        resolveColumnById: (_s: unknown, id: string) => (id === 'xValue' ? xValues : yValues),
        getDomain: () => ({ domain, sortMetadata: { sortOrder: 1 as const } }),
        resolveColumnNeedsValueOf: () => false,
    }) as unknown as DataModel<any, any, any>;

describe('computeLineAggregation', () => {
    describe('threshold behaviour', () => {
        it('should return undefined for datasets below threshold (< 1000 points)', () => {
            const xValues = Array.from({ length: 999 }, (_, i) => i);
            const yValues = Array.from({ length: 999 }, (_, i) => Math.sin(i / 10));
            const domain: [number, number] = [0, 998];

            const result = computeLineAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeUndefined();
        });

        it('should return aggregation filters for datasets at threshold (1000 points)', () => {
            const xValues = Array.from({ length: 1000 }, (_, i) => i);
            const yValues = Array.from({ length: 1000 }, (_, i) => Math.sin(i / 10));
            const domain: [number, number] = [0, 999];

            const result = computeLineAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result!.length).toBeGreaterThan(0);
            // At threshold, should have at least one filter level
            const coarsestLevel = result![0];
            expect(coarsestLevel.maxRange).toBeLessThanOrEqual(64);
            expect(coarsestLevel.indices.length).toBeGreaterThan(0);
        });

        it('should return aggregation filters for large datasets (> 1000 points)', () => {
            const xValues = Array.from({ length: 5000 }, (_, i) => i);
            const yValues = Array.from({ length: 5000 }, (_, i) => Math.sin(i / 10));
            const domain: [number, number] = [0, 4999];

            const result = computeLineAggregation(domain, xValues, yValues, {
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
            // Coarsest level should stop at 64 or less, or have <= 10 indices
            const coarsestLevel = result![0];
            const stopConditionMet = coarsestLevel.maxRange <= 64 || coarsestLevel.indices.length <= 10;
            expect(stopConditionMet).toBe(true);
        });
    });

    describe('multi-level filter generation', () => {
        it('should generate multiple filter levels ordered from coarse to fine', () => {
            const xValues = Array.from({ length: 10000 }, (_, i) => i);
            const yValues = Array.from({ length: 10000 }, (_, i) => Math.sin(i / 10));
            const domain: [number, number] = [0, 9999];

            const result = computeLineAggregation(domain, xValues, yValues, {
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

        it('should have fewer indices in coarser levels', () => {
            const xValues = Array.from({ length: 10000 }, (_, i) => i);
            const yValues = Array.from({ length: 10000 }, (_, i) => Math.sin(i / 10));
            const domain: [number, number] = [0, 9999];

            const result = computeLineAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            // Coarser levels should generally have fewer or equal indices
            for (let i = 1; i < result!.length; i++) {
                expect(result![i].indices.length).toBeGreaterThanOrEqual(result![i - 1].indices.length);
            }
        });

        it('should stop compacting when maxRange reaches 64 or indices <= 10', () => {
            const xValues = Array.from({ length: 10000 }, (_, i) => i);
            const yValues = Array.from({ length: 10000 }, (_, i) => Math.sin(i / 10));
            const domain: [number, number] = [0, 9999];

            const result = computeLineAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            // The coarsest level (first in array) should have maxRange <= 64 OR indices.length <= 10
            const coarsestLevel = result![0];
            const meetsStopCondition = coarsestLevel.maxRange <= 64 || coarsestLevel.indices.length <= 10;
            expect(meetsStopCondition).toBe(true);
        });
    });

    describe('extrema correctness', () => {
        it('should include points with minimum Y values', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => i);
            yValues[500] = -1000; // Clear minimum
            const domain: [number, number] = [0, 1999];

            const result = computeLineAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            // The minimum point should be included in at least one filter level
            const includesMin = result!.some((filter) => filter.indices.includes(500));
            expect(includesMin).toBe(true);
        });

        it('should include points with maximum Y values', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => i);
            yValues[1500] = 10000; // Clear maximum
            const domain: [number, number] = [0, 1999];

            const result = computeLineAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            // The maximum point should be included in at least one filter level
            const includesMax = result!.some((filter) => filter.indices.includes(1500));
            expect(includesMax).toBe(true);
        });

        it('should preserve sine wave peaks and troughs', () => {
            const xValues = Array.from({ length: 5000 }, (_, i) => i);
            const yValues = Array.from({ length: 5000 }, (_, i) => Math.sin(i / 100));
            const domain: [number, number] = [0, 4999];

            const result = computeLineAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            // For any filter level, verify that included indices are actually extrema
            const finestFilter = result![result!.length - 1];
            const includedYValues = Array.from(finestFilter.indices, (i) => yValues[i]);

            // The included points should represent the visual envelope
            // Check that we have both positive and negative extrema
            const hasPositive = includedYValues.some((y) => y > 0.9);
            const hasNegative = includedYValues.some((y) => y < -0.9);

            expect(hasPositive).toBe(true);
            expect(hasNegative).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('should handle uniform Y values', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, () => 42);
            const domain: [number, number] = [0, 1999];

            const result = computeLineAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
        });

        it('should handle null values in data', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues: any[] = Array.from({ length: 2000 }, (_, i) => i);
            yValues[100] = null;
            yValues[200] = null;
            yValues[300] = undefined;
            const domain: [number, number] = [0, 1999];

            const result = computeLineAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);

            // Null values should not be included in indices
            for (const filter of result!) {
                expect(filter.indices.includes(100)).toBe(false);
                expect(filter.indices.includes(200)).toBe(false);
                expect(filter.indices.includes(300)).toBe(false);
                // Verify that some valid indices are included (aggregation may skip some)
                expect(filter.indices.length).toBeGreaterThan(0);
                // Verify all included indices are valid (not null positions)
                for (const index of filter.indices) {
                    expect([100, 200, 300].includes(index)).toBe(false);
                }
            }
        });

        it('should handle NaN domain', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => `category-${i}`);
            const yValues = Array.from({ length: 2000 }, (_, i) => i);
            const domain: [number, number] = [Number.NaN, Number.NaN];

            const result = computeLineAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            // Should still work with categorical X axis (uses indices instead of values)
            expect(result!.length).toBeGreaterThan(0);
            // Verify indices are valid for categorical data
            for (const filter of result!) {
                for (const index of filter.indices) {
                    expect(index).toBeGreaterThanOrEqual(0);
                    expect(index).toBeLessThan(xValues.length);
                }
            }
        });

        it('should handle monotonically increasing values', () => {
            const xValues = Array.from({ length: 3000 }, (_, i) => i);
            const yValues = Array.from({ length: 3000 }, (_, i) => i);
            const domain: [number, number] = [0, 2999];

            const result = computeLineAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);

            // Should include first and last points (global min/max)
            const finestFilter = result![result!.length - 1];
            expect(finestFilter.indices.includes(0)).toBe(true);
            expect(finestFilter.indices.includes(2999)).toBe(true);
        });
    });

    describe('valueOf conversion flags', () => {
        it('should handle xNeedsValueOf = true for Date objects', () => {
            const startDate = new Date('2020-01-01').getTime();
            const xValues = Array.from({ length: 2000 }, (_, i) => new Date(startDate + i * 86400000));
            const yValues = Array.from({ length: 2000 }, (_, i) => Math.sin(i / 10));
            const domain: [number, number] = [startDate, startDate + 1999 * 86400000];

            const result = computeLineAggregation(domain, xValues, yValues, {
                xNeedsValueOf: true,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
        });

        it('should handle yNeedsValueOf = true for wrapped values', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => ({ valueOf: () => Math.sin(i / 10) }));
            const domain: [number, number] = [0, 1999];

            const result = computeLineAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: true,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
        });
    });

    describe('bigint and ISO 8601 time values (render hardening)', () => {
        it('aggregates bigint y values beyond MAX_SAFE_INTEGER (regression: high-volume bigint threw on Float64 write)', () => {
            const N = 2000;
            const base = 9_007_199_254_740_993n; // Number.MAX_SAFE_INTEGER + 2
            const xValues = Array.from({ length: N }, (_, i) => i);
            const yValues = Array.from({ length: N }, (_, i) => base + BigInt(i) * 1_000_000_000n);

            const result = aggregateLineDataFromDataModel(
                'number',
                stubLineDataModel(xValues, yValues, [0, N - 1]),
                {} as ProcessedData<any>,
                'yValue',
                series
            );

            expect(result).toBeDefined();
            expect(result![0].indices.length).toBeGreaterThan(0);
        });

        it('aggregates ISO 8601 string timestamps on a time scale (regression: high-volume ISO rendered blank)', () => {
            const N = 2000;
            const startMs = Date.UTC(2024, 0, 1);
            const xValues = Array.from({ length: N }, (_, i) => new Date(startMs + i * 60_000).toISOString());
            const yValues = Array.from({ length: N }, (_, i) => Math.sin(i / 10));
            // The column keeps raw ISO strings (as the real pipeline does); the domain is the parsed extent.
            const domain = [new Date(xValues[0]), new Date(xValues[N - 1])];

            const result = aggregateLineDataFromDataModel(
                'time',
                stubLineDataModel(xValues, yValues, domain),
                {} as ProcessedData<any>,
                'yValue',
                series
            );

            expect(result).toBeDefined();
            expect(result![0].indices.length).toBeGreaterThan(0);
        });
    });

    describe('filter structure', () => {
        it('should return filters with correct structure', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => Math.sin(i / 10));
            const domain: [number, number] = [0, 1999];

            const result = computeLineAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            for (const filter of result!) {
                expect(filter).toHaveProperty('indices');
                expect(filter).toHaveProperty('maxRange');
                expect(filter.indices instanceof Uint32Array).toBe(true);
                expect(typeof filter.maxRange).toBe('number');
                expect(filter.maxRange).toBeGreaterThan(0);
            }
        });

        it('should have indices in ascending order', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => Math.sin(i / 10));
            const domain: [number, number] = [0, 1999];

            const result = computeLineAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            for (const filter of result!) {
                for (let i = 1; i < filter.indices.length; i++) {
                    expect(filter.indices[i]).toBeGreaterThan(filter.indices[i - 1]);
                }
            }
        });

        it('should have valid indices within data range', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => Math.sin(i / 10));
            const domain: [number, number] = [0, 1999];

            const result = computeLineAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            for (const filter of result!) {
                for (const index of filter.indices) {
                    expect(index).toBeGreaterThanOrEqual(0);
                    expect(index).toBeLessThan(xValues.length);
                }
            }
        });
    });
});

describe('aggregateLineDataFromDataModel - bigint downsampling fidelity (high magnitude, narrow range)', () => {
    // When the Y span is below the double ULP at that magnitude, the endpoints must be subtracted in bigint
    // before narrowing or distinct values collapse onto one double and the extrema are lost.
    it('captures the true min/max when the Y span is below the double ULP at that magnitude', () => {
        const N = 2000;
        const BASE = 2n ** 60n + 123_456_789n; // off the power-of-2 boundary: uniform ULP (256) around it
        const DELTA = 100n; // < half-ULP (128), so BASE, BASE ± DELTA all narrow to the same double
        const spikeIndex = 1000; // interior to its bucket, so a collapsed downsampler cannot surface it
        const dipIndex = 1500;

        const xValues = Array.from({ length: N }, (_, i) => i);
        const yValues = Array.from({ length: N }, () => BASE);
        yValues[spikeIndex] = BASE + DELTA;
        yValues[dipIndex] = BASE - DELTA;
        const domain = [0, N - 1];

        const result = aggregateLineDataFromDataModel(
            'number',
            stubLineDataModel(xValues, yValues, domain),
            {} as ProcessedData<any>,
            'yValue',
            series
        );
        expect(result).toBeDefined();

        // Coarsest level: the spike/dip share a bucket with baseline neighbours but must still surface.
        const coarsest = result!.reduce((a, b) => (b.maxRange < a.maxRange ? b : a), result![0]);
        // A naive narrow collapses the span to zero width, leaving this level empty and the series blank.
        expect(coarsest.indices.length).toBeGreaterThan(0);

        const selectedY = Array.from(coarsest.indices, (idx) => yValues[idx]);
        const maxSelected = selectedY.reduce((a, b) => (b > a ? b : a), selectedY[0]);
        const minSelected = selectedY.reduce((a, b) => (b < a ? b : a), selectedY[0]);

        expect(maxSelected).toBe(BASE + DELTA);
        expect(minSelected).toBe(BASE - DELTA);
    });
});
