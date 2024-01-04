import { describe, expect, test } from '@jest/globals';

import { easeOut, inverseEaseOut } from './easing';

describe('easing', () => {
    test('inverseEaseOut', () => {
        // Calculate [0, 0.01, 0.02, ..., 1]
        const step = 0.01;
        const expectedTimeValues = Array.from({ length: 1 / step + 1 }, (_, index) => index * step);

        for (const t of expectedTimeValues) {
            const x = easeOut(t);
            expect(inverseEaseOut(x)).toBeCloseTo(t, 14);
        }
    });
});
