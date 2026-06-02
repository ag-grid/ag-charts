import { describe, expect, it } from 'vitest';

import { accumulatedValue, addAccumulated, sumValues, trailingAccumulatedValue } from './aggregateFunctions';

describe('aggregateFunctions bigint support (AG-16608)', () => {
    describe('sumValues', () => {
        it('splits numbers into negative and positive sums', () => {
            expect(sumValues([1, -2, 3, -4])).toEqual([-6, 4]);
        });

        it('sums bigint values in bigint so a large-magnitude total stays exact', () => {
            // The negative side keeps its untouched Number seed; the positive side promotes to bigint.
            expect(sumValues([2n, -3n, 5n])).toEqual([-3n, 7n]);
        });

        it('preserves precision beyond Number.MAX_SAFE_INTEGER', () => {
            const big = 9_007_199_254_740_993n; // 2^53 + 1, not representable as a Number
            expect(sumValues([big, big])).toEqual([0, 18_014_398_509_481_986n]);
        });
    });

    describe('addAccumulated', () => {
        it('adds two numbers', () => {
            expect(addAccumulated(2, 3)).toBe(5);
        });

        it('promotes a number seed to bigint on the first bigint operand', () => {
            expect(addAccumulated(0, 5n)).toBe(5n);
            expect(addAccumulated(5n, 3n)).toBe(8n);
        });

        it('sums an integral Number with a bigint exactly', () => {
            expect(addAccumulated(5n, 3)).toBe(8n);
            expect(addAccumulated(3, 5n)).toBe(8n);
        });

        it('does not throw on a fractional Number stacked with a bigint (falls back to a Number sum)', () => {
            // BigInt(1.5) would throw RangeError; the mixed stack must degrade rather than crash.
            expect(() => addAccumulated(5n, 1.5)).not.toThrow();
            expect(addAccumulated(5n, 1.5)).toBeCloseTo(6.5);
            expect(() => addAccumulated(1.5, 5n)).not.toThrow();
        });
    });

    describe('accumulatedValue', () => {
        it('produces bigint running totals', () => {
            const acc = accumulatedValue()!();
            expect(acc(5n, 0)).toBe(5n);
            expect(acc(3n, 1)).toBe(8n);
            expect(acc(2n, 2)).toBe(10n);
        });

        it('clamps negative bigints with onlyPositive', () => {
            const acc = accumulatedValue(true)!();
            expect(acc(5n, 0)).toBe(5n);
            expect(acc(-4n, 1)).toBe(5n);
            expect(acc(2n, 2)).toBe(7n);
        });
    });

    describe('trailingAccumulatedValue', () => {
        it('emits a 0n first trailing value so the column stays uniformly bigint', () => {
            const trailing = trailingAccumulatedValue()!();
            expect(trailing(5n, 0)).toBe(0n);
            expect(trailing(3n, 1)).toBe(5n);
            expect(trailing(2n, 2)).toBe(8n);
        });
    });
});
