import {
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    AGGREGATION_SPAN,
    computeExtremesAggregation,
} from 'ag-charts-core';

import { describeExtremesAggregationEntryPoint } from '../../test/aggregationSharedTests';
import { aggregateOhlcDataFromDataModel } from './ohlcAggregation';

// Semantic constants for OHLC data access
const OPEN = AGGREGATION_INDEX_X_MIN;
const HIGH = AGGREGATION_INDEX_Y_MAX;
const LOW = AGGREGATION_INDEX_Y_MIN;
const CLOSE = AGGREGATION_INDEX_X_MAX;
const SPAN = AGGREGATION_SPAN;

describe('computeExtremesAggregation', () => {
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
});

describeExtremesAggregationEntryPoint('aggregateOhlcDataFromDataModel', {
    aggregate: aggregateOhlcDataFromDataModel,
    highColumnId: 'highValue',
    lowColumnId: 'lowValue',
});
