import { expect, test } from '@jest/globals';

import { calculateNiceSecondaryAxis } from './secondaryAxisTicks';

describe('secondaryAxisTicks', () => {
    test.each([
        {
            domain: [49.9, 216.4],
            count: 6,
            actual: [0, 50, 100, 150, 200, 250],
        },
        {
            domain: [0, 216.4],
            count: 6,
            actual: [0, 50, 100, 150, 200, 250],
        },
        {
            domain: [100491, 135198],
            count: 10,
            actual: [100000, 105000, 110000, 115000, 120000, 125000, 130000, 135000, 140000, 145000],
        },
        {
            domain: [1009.6, 1018.2],
            count: 6,
            actual: [1009, 1011, 1013, 1015, 1017, 1019],
        },
        {
            domain: [7, 26.5],
            count: 6,
            actual: [5, 10, 15, 20, 25, 30],
        },
        {
            domain: [-7, 26.5],
            count: 10,
            actual: [-10, -5, 0, 5, 10, 15, 20, 25, 30, 35],
        },
        {
            domain: [1000, 1002],
            count: 10,
            actual: [1000, 1000.5, 1001, 1001.5, 1002, 1002.5, 1003, 1003.5, 1004, 1004.5],
        },
        {
            domain: [-26.5, -7],
            count: 6,
            actual: [-30, -25, -20, -15, -10, -5],
        },
        {
            domain: [0.002, 0.004],
            count: 6,
            actual: [0, 0.001, 0.002, 0.003, 0.004, 0.005],
        },
        {
            domain: [11, 20],
            count: 9,
            actual: [10, 12, 14, 16, 18, 20, 22, 24, 26],
        },
        {
            domain: [0, 101],
            count: 10,
            actual: [0, 20, 40, 60, 80, 100, 120, 140, 160, 180],
        },
    ])('Ticks for $domain (count $count)', ({ domain, count, actual }) => {
        const scale = {
            toDomain: (d: any) => d,
        };
        const { ticks } = calculateNiceSecondaryAxis(scale, domain, { unzoomed: count, zoomed: count }, false);
        expect(ticks).toHaveLength(actual.length);
        expect(ticks).toMatchObject(actual.map((t) => expect.closeTo(t, 10)));
    });
});
