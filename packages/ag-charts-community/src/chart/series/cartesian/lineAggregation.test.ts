import { describe, expect, it } from 'vitest';

import type { ProcessedData, ScopeProvider } from '../../data/dataModelTypes';
import { stubAggregationDataModel } from '../../test/aggregationStubs';
import { aggregateLineDataFromDataModel, computeLineAggregation } from './lineAggregation';

const series: ScopeProvider = { id: 'series-1' };
// Line aggregation resolves both x and y through `resolveColumnById`.
const stubLineDataModel = (xValues: any[], yValues: any[], domain: any[]) =>
    stubAggregationDataModel([], { xValue: xValues, yValue: yValues }, domain);

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
            for (let i = 1; i < result!.length; i++) {
                expect(result![i].maxRange).toBe(result![i - 1].maxRange * 2);
            }
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

            const finestFilter = result![result!.length - 1];
            const includedYValues = Array.from(finestFilter.indices, (i) => yValues[i]);

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

            for (const filter of result!) {
                expect(filter.indices.includes(100)).toBe(false);
                expect(filter.indices.includes(200)).toBe(false);
                expect(filter.indices.includes(300)).toBe(false);
                expect(filter.indices.length).toBeGreaterThan(0);
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
            expect(result!.length).toBeGreaterThan(0);
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

        it('aggregates bigint x values beyond MAX_SAFE_INTEGER on a number axis (>1000 pts)', () => {
            // The X column is not narrowed (only Y is), so a bigint x reaches createAggregationIndices
            // and `xValue - d0` must not throw "Cannot convert a BigInt value to a number".
            const N = 2000;
            const base = 9_007_199_254_740_993n; // Number.MAX_SAFE_INTEGER + 2
            const xValues = Array.from({ length: N }, (_, i) => base + BigInt(i) * 1_000_000_000n);
            const yValues = Array.from({ length: N }, (_, i) => Math.sin(i / 10));

            const result = aggregateLineDataFromDataModel(
                'number',
                stubLineDataModel(xValues, yValues, [xValues[0], xValues[N - 1]]),
                {} as ProcessedData<any>,
                'yValue',
                series
            );

            expect(result).toBeDefined();
            expect(result![0].indices.length).toBeGreaterThan(0);
        });

        it('aggregates bigint timestamp x values on a time scale (>1000 pts)', () => {
            // Bigint epoch timestamps on a time axis hit the same un-narrowed X path.
            const N = 2000;
            const baseMs = 1_700_000_000_000n;
            const xValues = Array.from({ length: N }, (_, i) => baseMs + BigInt(i) * 60_000n);
            const yValues = Array.from({ length: N }, (_, i) => Math.sin(i / 10));

            const result = aggregateLineDataFromDataModel(
                'time',
                stubLineDataModel(xValues, yValues, [xValues[0], xValues[N - 1]]),
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

describe('aggregateLineDataFromDataModel - bigint X downsampling fidelity (high magnitude, narrow range)', () => {
    // The bucket assignment subtracts the domain min from the X column; when the X span is below the double
    // ULP at that magnitude, that subtraction must happen in bigint before narrowing or every distinct X collapses onto one double.
    it('captures the true min/max X when the X span is below the double ULP at that magnitude', () => {
        const N = 2000;
        const BASE = 2n ** 60n + 123_456_789n; // off the power-of-2 boundary: uniform ULP (256) around it
        const DELTA = 100n; // < half-ULP (128), so BASE, BASE ± DELTA all narrow to the same double
        const spikeIndex = 1000; // the max X, interior to the data so a collapsed downsampler cannot surface it
        const dipIndex = 1500; // the min X

        const xValues = Array.from({ length: N }, () => BASE);
        xValues[spikeIndex] = BASE + DELTA;
        xValues[dipIndex] = BASE - DELTA;
        const yValues = Array.from({ length: N }, () => 0); // constant Y, so only X extrema drive selection
        const domain = [BASE - DELTA, BASE + DELTA]; // the bigint X extent

        const result = aggregateLineDataFromDataModel(
            'number',
            stubLineDataModel(xValues, yValues, domain),
            {} as ProcessedData<any>,
            'yValue',
            series
        );
        expect(result).toBeDefined();

        // A naive absolute narrow collapses the X span to zero width, leaving a single representative.
        const selectedIndices = new Set<number>();
        for (const filter of result!) for (const idx of filter.indices) selectedIndices.add(idx);
        const selectedX = Array.from(selectedIndices, (idx) => xValues[idx]);
        const maxSelectedX = selectedX.reduce((a, b) => (b > a ? b : a), selectedX[0]);
        const minSelectedX = selectedX.reduce((a, b) => (b < a ? b : a), selectedX[0]);

        expect(maxSelectedX).toBe(BASE + DELTA);
        expect(minSelectedX).toBe(BASE - DELTA);
    });
});
