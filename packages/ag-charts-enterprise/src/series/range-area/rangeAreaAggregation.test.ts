import { BIG } from 'ag-charts-community-test';
import { AGGREGATION_INDEX_X_MAX, AGGREGATION_INDEX_X_MIN, AGGREGATION_SPAN } from 'ag-charts-core';

import { aggregateRangeAreaDataFromDataModel } from './rangeAreaAggregation';

describe('aggregateRangeAreaDataFromDataModel - bigint and ISO 8601 time values (render hardening)', () => {
    // Drives the real entry point (which narrows the columns) rather than the lower-level compute function.
    type Fn = typeof aggregateRangeAreaDataFromDataModel;
    const series = { id: 'series-1' };
    const stubDataModel = (xValues: any[], highValues: any[], lowValues: any[], domain: any[]) =>
        ({
            resolveKeysById: () => xValues,
            resolveColumnById: (_s: unknown, id: string) => (id === 'yHighValue' ? highValues : lowValues),
            getDomain: () => ({ domain, sortMetadata: { sortOrder: 1 as const } }),
            resolveColumnNeedsValueOf: () => false,
        }) as unknown as Parameters<Fn>[1];

    it('aggregates bigint high/low values beyond MAX_SAFE_INTEGER', () => {
        const N = 2000;
        const xValues = Array.from({ length: N }, (_, i) => i);
        const highValues = Array.from({ length: N }, (_, i) => BIG + BigInt(i) * 1_000_000_000n);
        const lowValues = highValues.map((v) => v - 1_000_000_000n);

        const result = aggregateRangeAreaDataFromDataModel(
            'number',
            stubDataModel(xValues, highValues, lowValues, [0, N - 1]),
            {} as Parameters<Fn>[2],
            series
        );

        expect(result).toBeDefined();
        expect(result![0].indexData.length).toBeGreaterThan(0);
    });

    it('aggregates bigint x (key) values beyond MAX_SAFE_INTEGER (>1000 pts)', () => {
        // GAP AG-16608 §9.1.1/9.1.2 — the X key column is never narrowed, so `xValue - d0` throws on a bigint key.
        const N = 2000;
        const xValues = Array.from({ length: N }, (_, i) => BIG + BigInt(i) * 1_000_000_000n);
        const highValues = Array.from({ length: N }, (_, i) => Math.sin(i / 10) + 2);
        const lowValues = Array.from({ length: N }, (_, i) => Math.sin(i / 10) - 2);

        const result = aggregateRangeAreaDataFromDataModel(
            'number',
            stubDataModel(xValues, highValues, lowValues, [xValues[0], xValues[N - 1]]),
            {} as Parameters<Fn>[2],
            series
        );

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

        const result = aggregateRangeAreaDataFromDataModel(
            'time',
            stubDataModel(xValues, highValues, lowValues, domain),
            {} as Parameters<Fn>[2],
            series
        );

        expect(result).toBeDefined();
        expect(result![0].indexData.length).toBeGreaterThan(0);
    });

    // High-magnitude narrow-range X downsampling fidelity: the domain min must be subtracted in bigint before
    // narrowing or distinct X values collapse onto one double and the per-bucket X extrema are lost.
    it('downsampling keeps the true min/max X when the X span is below the double ULP at that magnitude', () => {
        const EMPTY_INDEX = 0xffffffff;
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

        const result = aggregateRangeAreaDataFromDataModel(
            'number',
            stubDataModel(xValues, highValues, lowValues, domain),
            {} as Parameters<Fn>[2],
            series
        );
        expect(result).toBeDefined();

        const selectedIndices = new Set<number>();
        for (const filter of result!) {
            for (let i = 0; i < filter.maxRange; i++) {
                const aggIndex = i * AGGREGATION_SPAN;
                const xMin = filter.indexData[aggIndex + AGGREGATION_INDEX_X_MIN];
                const xMax = filter.indexData[aggIndex + AGGREGATION_INDEX_X_MAX];
                if (xMin !== EMPTY_INDEX) selectedIndices.add(xMin);
                if (xMax !== EMPTY_INDEX) selectedIndices.add(xMax);
            }
        }
        const selectedX = Array.from(selectedIndices, (idx) => xValues[idx]);
        const maxSelectedX = selectedX.reduce((a, b) => (b > a ? b : a), selectedX[0]);
        const minSelectedX = selectedX.reduce((a, b) => (b < a ? b : a), selectedX[0]);

        expect(maxSelectedX).toBe(BASE + DELTA);
        expect(minSelectedX).toBe(BASE - DELTA);
    });
});
