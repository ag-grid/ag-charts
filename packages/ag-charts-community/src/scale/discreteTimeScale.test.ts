import { describe, expect, test } from '@jest/globals';

import { checkUniformityBySampling } from './discreteTimeScale';

describe('checkUniformityBySampling', () => {
    const uniformBands = [
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        new Date('2024-01-03'),
        new Date('2024-01-04'),
        new Date('2024-01-05'),
    ] as const;

    test('returns uniform for evenly spaced dates', () => {
        const result = checkUniformityBySampling(uniformBands);
        expect(result.isUniform).toBe(true);
        expect(result.interval).toBeCloseTo(86400000); // 1 day in ms
    });

    test('returns non-uniform for unevenly spaced dates', () => {
        const bands = [
            new Date('2024-01-01'),
            new Date('2024-01-02'),
            new Date('2024-01-05'),
            new Date('2024-01-06'),
            new Date('2024-01-07'),
        ] as const;
        const result = checkUniformityBySampling(bands);
        expect(result.isUniform).toBe(false);
    });

    test('returns non-uniform for fewer than 2 elements', () => {
        expect(checkUniformityBySampling([new Date('2024-01-01')] as const)).toEqual({ isUniform: false });
        expect(checkUniformityBySampling([] as unknown as readonly Date[])).toEqual({ isUniform: false });
    });

    test('AG-16912: returns non-uniform for out-of-bounds startIdx', () => {
        expect(checkUniformityBySampling(uniformBands, -1, 3)).toEqual({ isUniform: false });
    });

    test('AG-16912: returns non-uniform for out-of-bounds endIdx', () => {
        expect(checkUniformityBySampling(uniformBands, 0, 5)).toEqual({ isUniform: false });
    });

    test('AG-16912: returns non-uniform for both indices out-of-bounds', () => {
        expect(checkUniformityBySampling(uniformBands, -2, 10)).toEqual({ isUniform: false });
    });

    test('works with valid sub-range', () => {
        const result = checkUniformityBySampling(uniformBands, 1, 3);
        expect(result.isUniform).toBe(true);
    });
});
