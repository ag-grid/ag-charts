import {
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    AGGREGATION_SPAN,
    computeExtremesAggregation,
} from 'ag-charts-core';

import { describeExtremesAggregationEntryPoint } from '../../test/aggregationSharedTests';
import { aggregateRangeBarDataFromDataModel } from './rangeBarAggregation';

// Semantic constants for Range Bar data access
const START = AGGREGATION_INDEX_X_MIN;
const HIGH = AGGREGATION_INDEX_Y_MAX;
const LOW = AGGREGATION_INDEX_Y_MIN;
const END = AGGREGATION_INDEX_X_MAX;
const SPAN = AGGREGATION_SPAN;

describe('computeExtremesAggregation', () => {
    describe('range bar extrema correctness', () => {
        it('should track start/high/low/end indices correctly', () => {
            const xValues = Array.from({ length: 1000 }, (_, i) => i);
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
            for (let i = 0; i < result![0].maxRange; i++) {
                const aggIndex = i * SPAN;
                const startIndex = indexData[aggIndex + START];
                const highIndex = indexData[aggIndex + HIGH];
                const lowIndex = indexData[aggIndex + LOW];
                const endIndex = indexData[aggIndex + END];

                // All indices should be valid
                expect(startIndex).toBeGreaterThanOrEqual(-1);
                expect(highIndex).toBeGreaterThanOrEqual(-1);
                expect(lowIndex).toBeGreaterThanOrEqual(-1);
                expect(endIndex).toBeGreaterThanOrEqual(-1);

                if (startIndex >= 0) {
                    expect(startIndex).toBeLessThan(xValues.length);
                    expect(highIndex).toBeLessThan(xValues.length);
                    expect(lowIndex).toBeLessThan(xValues.length);
                    expect(endIndex).toBeLessThan(xValues.length);

                    // Start should be <= End (time order)
                    expect(startIndex).toBeLessThanOrEqual(endIndex);

                    // High value at highIndex should be >= values at start/end indices
                    expect(highValues[highIndex]).toBeGreaterThanOrEqual(highValues[startIndex]);
                    expect(highValues[highIndex]).toBeGreaterThanOrEqual(highValues[endIndex]);

                    // Low value at lowIndex should be <= values at start/end indices
                    expect(lowValues[lowIndex]).toBeLessThanOrEqual(lowValues[startIndex]);
                    expect(lowValues[lowIndex]).toBeLessThanOrEqual(lowValues[endIndex]);
                }
            }
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
                const startIndex = indexData[aggIndex + START];
                const highIndex = indexData[aggIndex + HIGH];
                const lowIndex = indexData[aggIndex + LOW];
                const endIndex = indexData[aggIndex + END];

                if (startIndex >= 0) {
                    expect(startIndex).toBeLessThanOrEqual(endIndex);
                    expect(highIndex).toBeGreaterThanOrEqual(0);
                    expect(lowIndex).toBeGreaterThanOrEqual(0);
                }
            }
        });
    });
});

describeExtremesAggregationEntryPoint('aggregateRangeBarDataFromDataModel', {
    aggregate: aggregateRangeBarDataFromDataModel,
    highColumnId: 'yHighValue',
    lowColumnId: 'yLowValue',
});
