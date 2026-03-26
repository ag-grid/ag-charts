import { describe, expect, it } from '@jest/globals';

import { LARGEST_KEY_INTERVAL, SMALLEST_KEY_INTERVAL } from './processors';

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
