import { expect, test } from '@jest/globals';

import { calculateNiceSecondaryAxis } from './secondaryAxisTicks';

describe('secondaryAxisTicks', () => {
    const scale = {
        toDomain: (d: any) => d,
    };

    test.each([
        {
            domain: [49.9, 216.4],
            count: 6,
            expected: [0, 50, 100, 150, 200, 250],
        },
        {
            domain: [0, 216.4],
            count: 6,
            expected: [0, 50, 100, 150, 200, 250],
        },
        {
            domain: [100491, 135198],
            count: 10,
            expected: [100000, 105000, 110000, 115000, 120000, 125000, 130000, 135000, 140000, 145000],
        },
        {
            domain: [1009.6, 1018.2],
            count: 6,
            expected: [1009, 1011, 1013, 1015, 1017, 1019],
        },
        {
            domain: [7, 26.5],
            count: 6,
            expected: [5, 10, 15, 20, 25, 30],
        },
        {
            domain: [-7, 26.5],
            count: 10,
            expected: [-10, -5, 0, 5, 10, 15, 20, 25, 30, 35],
        },
        {
            domain: [1000, 1002],
            count: 10,
            expected: [1000, 1000.5, 1001, 1001.5, 1002, 1002.5, 1003, 1003.5, 1004, 1004.5],
        },
        {
            domain: [-26.5, -7],
            count: 6,
            expected: [-30, -25, -20, -15, -10, -5],
        },
        {
            domain: [0.002, 0.004],
            count: 6,
            expected: [0, 0.001, 0.002, 0.003, 0.004, 0.005],
        },
        {
            domain: [11, 20],
            count: 9,
            expected: [10, 12, 14, 16, 18, 20, 22, 24, 26],
        },
        {
            domain: [0, 101],
            count: 10,
            expected: [0, 20, 40, 60, 80, 100, 120, 140, 160, 180],
        },
    ])('Ticks for $domain (count $count)', ({ domain, count, expected }) => {
        const { ticks } = calculateNiceSecondaryAxis(scale, domain, { unzoomed: count, zoomed: count }, false, [0, 1]);
        expect(ticks).toHaveLength(expected.length);
        expect(ticks).toMatchObject(expected.map((t) => expect.closeTo(t, 10)));
    });

    test('Generates ticks for a single primary axis tick', () => {
        const { ticks } = calculateNiceSecondaryAxis(scale, [5, 10], { unzoomed: 1, zoomed: 1 }, false, [0, 1]);
        expect(ticks).toEqual([4, 6, 8, 10, 12]);
    });

    test('Generates ticks for a single primary axis tick when zoomed', () => {
        const { ticks } = calculateNiceSecondaryAxis(scale, [5, 10], { unzoomed: 1, zoomed: 1 }, false, [0.4, 0.6]);
        expect(ticks).toEqual([7, 7.5, 8]);
    });

    test.each([
        // Ensure magnitude is reflected
        { domain: 0.005, expected: [0, 0.002, 0.004, 0.006, 0.008] },
        { domain: 0.05, expected: [0, 0.02, 0.04, 0.06, 0.08] },
        { domain: 0.5, expected: [0, 0.2, 0.4, 0.6, 0.8] },
        // Increments in 1
        { domain: 5, expected: [3, 4, 5, 6, 7] },
        { domain: 50, expected: [48, 49, 50, 51, 52] },
        { domain: 500, expected: [498, 499, 500, 501, 502] },
    ])('Generate ticks for single secondary axis tick at $domain', ({ domain, expected }) => {
        const { ticks } = calculateNiceSecondaryAxis(
            scale,
            [domain, domain],
            { unzoomed: 5, zoomed: 5 },
            false,
            [0, 1]
        );
        expect(ticks).toEqual(expected);
    });
});
