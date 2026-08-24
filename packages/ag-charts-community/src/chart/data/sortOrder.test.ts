import { describe, expect, it } from 'vitest';

import { valuesSortOrder } from './sortOrder';

describe('valuesSortOrder', () => {
    it('detects ascending number columns', () => {
        expect(valuesSortOrder([1, 2, 3], false)).toBe(1);
    });

    it('detects descending number columns', () => {
        expect(valuesSortOrder([3, 2, 1], false)).toBe(-1);
    });

    it('returns undefined for unsorted number columns', () => {
        expect(valuesSortOrder([1, 3, 2], false)).toBeUndefined();
    });

    it('treats single-value and empty columns as ascending', () => {
        expect(valuesSortOrder([], false)).toBe(1);
        expect(valuesSortOrder([42], false)).toBe(1);
    });

    it('skips null values when determining order', () => {
        expect(valuesSortOrder([1, null, 2, null, 3], false)).toBe(1);
    });

    // Bigint columns must be treated like number columns; bailing on `typeof primitive !== 'number'`
    // would report every bigint column as unsorted and disable the sorted fast-paths.
    it('detects ascending bigint columns', () => {
        expect(valuesSortOrder([10n ** 22n, 10n ** 22n + 1n, 10n ** 22n + 2n], false)).toBe(1);
    });

    it('detects descending bigint columns', () => {
        expect(valuesSortOrder([3n, 2n, 1n], false)).toBe(-1);
    });

    it('returns undefined for unsorted bigint columns', () => {
        expect(valuesSortOrder([1n, 3n, 2n], false)).toBeUndefined();
    });

    it('stays exact for adjacent bigints beyond MAX_SAFE_INTEGER', () => {
        expect(valuesSortOrder([9_007_199_254_740_993n, 9_007_199_254_740_994n], false)).toBe(1);
    });

    it('detects ascending ISO 8601 datetime string columns', () => {
        const values = ['2024-01-01T00:00:00Z', '2024-01-01T00:00:01Z', '2024-01-01T00:00:02Z'];
        expect(valuesSortOrder(values, true)).toBe(1);
    });

    it('detects descending ISO 8601 datetime string columns', () => {
        const values = ['2024-01-03', '2024-01-02', '2024-01-01'];
        expect(valuesSortOrder(values, true)).toBe(-1);
    });

    it('returns undefined for unsorted ISO 8601 datetime string columns', () => {
        const values = ['2024-01-01T00:00:00Z', '2024-01-03T00:00:00Z', '2024-01-02T00:00:00Z'];
        expect(valuesSortOrder(values, true)).toBeUndefined();
    });

    it('returns undefined for non-ISO string columns', () => {
        expect(valuesSortOrder(['a', 'b', 'c'], true)).toBeUndefined();
    });

    it('returns undefined when a column contains an unparseable ISO-like string', () => {
        expect(valuesSortOrder(['2024-01-01', '2024-02-30', '2024-03-01'], true)).toBeUndefined();
    });

    it('returns undefined when a numeric column contains NaN', () => {
        expect(valuesSortOrder([1, Number.NaN, 3], false)).toBeUndefined();
    });

    it('detects ascending Date columns via valueOf', () => {
        const values = [new Date(0), new Date(1000), new Date(2000)];
        expect(valuesSortOrder(values, true)).toBe(1);
    });
});
