import { expect, test } from '@jest/globals';

import { countFractionDigits } from './number';

describe('number module', () => {
    test('countFractionDigits', () => {
        expect(countFractionDigits(0)).toBe(0);
        expect(countFractionDigits(0.5)).toBe(1);
        expect(countFractionDigits(0.25)).toBe(2);
        expect(countFractionDigits(1)).toBe(0);
        expect(countFractionDigits(1.5)).toBe(1);
        expect(countFractionDigits(1.25)).toBe(2);
        // AG-10143
        expect(countFractionDigits(400 - 0.6)).toBe(1);
        // AG-12700
        expect(countFractionDigits(1e-8)).toBe(8);
        expect(countFractionDigits(1.23e-8)).toBe(10);
    });
});
