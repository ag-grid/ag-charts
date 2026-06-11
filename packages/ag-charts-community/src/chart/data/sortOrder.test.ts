import { describe, expect, it } from 'vitest';

import { valuesSortOrder } from './sortOrder';

describe('valuesSortOrder - bigint columns (render hardening)', () => {
    // Sort-order detection must treat bigint columns like number columns; bailing on
    // `typeof primitive !== 'number'` would report every bigint column as unsorted, disabling
    // the sorted fast-paths (extent / clipped-range) for bigint data.

    it('reports an ascending bigint column as sorted ascending', () => {
        expect(valuesSortOrder([1n, 2n, 3n], false)).toBe(1);
    });

    it('reports a descending bigint column as sorted descending', () => {
        expect(valuesSortOrder([3n, 2n, 1n], false)).toBe(-1);
    });

    it('reports an unsorted bigint column as unsorted', () => {
        expect(valuesSortOrder([1n, 3n, 2n], false)).toBeUndefined();
    });

    it('does not throw and stays exact for bigints beyond MAX_SAFE_INTEGER', () => {
        const a = 9_007_199_254_740_993n;
        const b = 9_007_199_254_740_994n;
        expect(valuesSortOrder([a, b], false)).toBe(1);
    });
});
