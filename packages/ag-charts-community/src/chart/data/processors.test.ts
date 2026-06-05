import { describe, expect, it } from 'vitest';

import type { AgNumericValue } from 'ag-charts-types';

import type { ReducerOutputPropertyDefinition } from './dataModelTypes';
import { LARGEST_KEY_INTERVAL, SMALLEST_KEY_INTERVAL } from './processors';

function foldKeys(def: ReducerOutputPropertyDefinition<'smallestKeyInterval' | 'largestKeyInterval'>, keys: unknown[]) {
    const reduce = def.reducer();
    return keys.reduce<AgNumericValue | undefined>((acc, key) => reduce(acc, [key]), def.initialValue);
}

describe('interval reducers', () => {
    it('finds the smallest gap between number keys', () => {
        expect(foldKeys(SMALLEST_KEY_INTERVAL, [0, 10, 13, 100])).toBe(3);
    });

    it('finds the largest gap between number keys', () => {
        expect(foldKeys(LARGEST_KEY_INTERVAL, [0, 10, 13, 100])).toBe(87);
    });

    it('skips non-finite keys without disturbing the running predecessor', () => {
        expect(foldKeys(SMALLEST_KEY_INTERVAL, [0, Number.NaN, 5, Infinity, 6])).toBe(1);
    });

    it('measures Date-keyed gaps as elapsed milliseconds', () => {
        const t = Date.UTC(2024, 0, 1);
        expect(foldKeys(SMALLEST_KEY_INTERVAL, [new Date(t), new Date(t + 1000), new Date(t + 1500)])).toBe(500);
    });

    // Regression (AG-16608): ISO 8601 string keys yielded Number(key)=NaN, so finiteKey dropped every key
    // and no key interval was computed for an ISO-keyed time axis; they now parse to epoch ms like Date keys.
    it('measures ISO 8601 string-keyed gaps as elapsed milliseconds', () => {
        const isoKeys = ['2024-01-01T00:00:00.000Z', '2024-01-01T00:00:01.000Z', '2024-01-01T00:00:01.500Z'];
        expect(foldKeys(SMALLEST_KEY_INTERVAL, isoKeys)).toBe(500);
        expect(foldKeys(LARGEST_KEY_INTERVAL, isoKeys)).toBe(1000);
    });

    // Regression: coerce-then-subtract collapsed adjacent bigints whose gap is below the Number ULP at
    // their magnitude (here 2^60, ULP 256), yielding a zero interval that the > 0 guard then discarded.
    // The exact gap is now retained as a bigint and only narrowed by screen-space consumers.
    it('preserves exact gaps between large-magnitude bigint keys', () => {
        const base = 2n ** 60n;
        expect(foldKeys(SMALLEST_KEY_INTERVAL, [base, base + 8n, base + 24n])).toBe(8n);
        expect(foldKeys(LARGEST_KEY_INTERVAL, [base, base + 8n, base + 24n])).toBe(16n);
    });
});

describe('interval reducer combiners', () => {
    it('SMALLEST_KEY_INTERVAL.combineResults ignores non-finite values', () => {
        const result = SMALLEST_KEY_INTERVAL.combineResults?.([Infinity, 5, Infinity, 2]);
        expect(result).toBe(2);
    });

    it('SMALLEST_KEY_INTERVAL.combineResults returns Infinity when all bands invalid', () => {
        const result = SMALLEST_KEY_INTERVAL.combineResults?.([Infinity, Infinity]);
        expect(result).toBe(Infinity);
    });

    it('LARGEST_KEY_INTERVAL.combineResults ignores non-finite values', () => {
        const result = LARGEST_KEY_INTERVAL.combineResults?.([-Infinity, 5, 10, -Infinity]);
        expect(result).toBe(10);
    });

    it('LARGEST_KEY_INTERVAL.combineResults returns -Infinity when all bands invalid', () => {
        const result = LARGEST_KEY_INTERVAL.combineResults?.([-Infinity, -Infinity]);
        expect(result).toBe(-Infinity);
    });
});
