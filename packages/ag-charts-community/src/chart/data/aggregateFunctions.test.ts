import { describe, expect, it } from 'vitest';

import { accumulatedValue, addAccumulated, trailingAccumulatedValue } from './aggregateFunctions';

describe('aggregateFunctions bigint support (AG-16608)', () => {
    describe('addAccumulated', () => {
        it('adds two numbers', () => {
            expect(addAccumulated(2, 3)).toBe(5);
        });

        it('promotes a number seed to bigint on the first bigint operand', () => {
            expect(addAccumulated(0, 5n)).toBe(5n);
            expect(addAccumulated(5n, 3n)).toBe(8n);
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
