// Uses vitest globals (enabled in vitest.config.ts) so this dev-only helper adds no
// npm-dev dependency edge from src/ (see the not-to-dev-dep dependency-cruiser rule).
import type { _ModuleSupport } from 'ag-charts-community';
import { BIG, stubAggregationDataModel } from 'ag-charts-community-test';
import {
    AGGREGATION_INDEX_UNSET,
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_SPAN,
    type ExtremesAggregationFilter,
    type ScaleType,
} from 'ag-charts-core';

type ExtremesAggregateFromDataModel = (
    scale: ScaleType,
    dataModel: _ModuleSupport.DataModel<any, any, any>,
    processedData: _ModuleSupport.ProcessedData<any>,
    series: { id: string }
) => ExtremesAggregationFilter[] | undefined;

interface ExtremesAggregationSuiteConfig {
    /** The `aggregate*DataFromDataModel` entry point under test (which narrows the columns). */
    aggregate: ExtremesAggregateFromDataModel;
    /** DataModel column id for the high values. */
    highColumnId: string;
    /** DataModel column id for the low values. */
    lowColumnId: string;
}

/**
 * Registers the shared bigint / ISO 8601 coverage for an extremes-aggregation entry point
 * (OHLC, range-area, range-bar). Drives the real entry point rather than the lower-level
 * compute function, so the column-narrowing behaviour is exercised.
 */
export function describeExtremesAggregationEntryPoint(
    name: string,
    { aggregate, highColumnId, lowColumnId }: ExtremesAggregationSuiteConfig
) {
    const series = { id: 'series-1' };
    const processedData = {} as _ModuleSupport.ProcessedData<any>;
    const runAggregate = (
        scale: ScaleType,
        xValues: unknown[],
        highValues: unknown[],
        lowValues: unknown[],
        domain: unknown[]
    ) =>
        aggregate(
            scale,
            stubAggregationDataModel(xValues, { [highColumnId]: highValues, [lowColumnId]: lowValues }, domain),
            processedData,
            series
        );

    describe(`${name} - bigint and ISO 8601 time values (render hardening)`, () => {
        it('aggregates bigint high/low values beyond MAX_SAFE_INTEGER', () => {
            const N = 2000;
            const xValues = Array.from({ length: N }, (_, i) => i);
            const highValues = Array.from({ length: N }, (_, i) => BIG + BigInt(i) * 1_000_000_000n);
            const lowValues = highValues.map((v) => v - 1_000_000_000n);

            const result = runAggregate('number', xValues, highValues, lowValues, [0, N - 1]);

            expect(result).toBeDefined();
            expect(result![0].indexData.length).toBeGreaterThan(0);
        });

        it('aggregates bigint x (key) values beyond MAX_SAFE_INTEGER (>1000 pts)', () => {
            // The X key column is never narrowed by the data model, so the aggregation itself must
            // handle bigint keys when bucketing (`xValue - d0` throws on mixed bigint/number).
            const N = 2000;
            const xValues = Array.from({ length: N }, (_, i) => BIG + BigInt(i) * 1_000_000_000n);
            const highValues = Array.from({ length: N }, (_, i) => Math.sin(i / 10) + 2);
            const lowValues = Array.from({ length: N }, (_, i) => Math.sin(i / 10) - 2);

            const result = runAggregate('number', xValues, highValues, lowValues, [xValues[0], xValues[N - 1]]);

            expect(result).toBeDefined();
            expect(result![0].indexData.length).toBeGreaterThan(0);
        });

        it('aggregates ISO 8601 string timestamps on a time scale', () => {
            const N = 2000;
            const startMs = Date.UTC(2024, 0, 1);
            const xValues = Array.from({ length: N }, (_, i) => new Date(startMs + i * 60_000).toISOString());
            const highValues = Array.from({ length: N }, (_, i) => Math.sin(i / 10) + 2);
            const lowValues = Array.from({ length: N }, (_, i) => Math.sin(i / 10) - 2);
            const domain = [new Date(xValues[0]), new Date(xValues[N - 1])];

            const result = runAggregate('time', xValues, highValues, lowValues, domain);

            expect(result).toBeDefined();
            expect(result![0].indexData.length).toBeGreaterThan(0);
        });

        // High-magnitude narrow-range X downsampling fidelity: the domain min must be subtracted in bigint
        // before narrowing or distinct X values collapse onto one double and the per-bucket X extrema are lost.
        it('downsampling keeps the true min/max X when the X span is below the double ULP at that magnitude', () => {
            const N = 2000;
            const BASE = 2n ** 60n + 123_456_789n;
            const DELTA = 100n;
            const spikeIndex = 1000;
            const dipIndex = 1500;

            const xValues = Array.from({ length: N }, () => BASE);
            xValues[spikeIndex] = BASE + DELTA;
            xValues[dipIndex] = BASE - DELTA;
            const highValues = Array.from({ length: N }, () => 1);
            const lowValues = Array.from({ length: N }, () => -1);
            const domain = [BASE - DELTA, BASE + DELTA];

            const result = runAggregate('number', xValues, highValues, lowValues, domain);
            expect(result).toBeDefined();

            const selectedIndices = new Set<number>();
            for (const filter of result!) {
                for (let i = 0; i < filter.maxRange; i++) {
                    const aggIndex = i * AGGREGATION_SPAN;
                    const xMin = filter.indexData[aggIndex + AGGREGATION_INDEX_X_MIN];
                    const xMax = filter.indexData[aggIndex + AGGREGATION_INDEX_X_MAX];
                    if (xMin !== AGGREGATION_INDEX_UNSET) selectedIndices.add(xMin);
                    if (xMax !== AGGREGATION_INDEX_UNSET) selectedIndices.add(xMax);
                }
            }
            const selectedX = Array.from(selectedIndices, (idx) => xValues[idx]);
            const maxSelectedX = selectedX.reduce((a, b) => (b > a ? b : a), selectedX[0]);
            const minSelectedX = selectedX.reduce((a, b) => (b < a ? b : a), selectedX[0]);

            expect(maxSelectedX).toBe(BASE + DELTA);
            expect(minSelectedX).toBe(BASE - DELTA);
        });
    });
}
