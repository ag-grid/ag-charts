import { BIG } from 'ag-charts-community-test';

import { aggregateRangeAreaDataFromDataModel } from './rangeAreaAggregation';

describe('aggregateRangeAreaDataFromDataModel - bigint and ISO 8601 time values (render hardening)', () => {
    // Exercises the real aggregation entry point (where high-volume bigint/ISO columns must be narrowed),
    // above AGGREGATION_THRESHOLD, rather than the lower-level compute function.
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
});
