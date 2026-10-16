import { describe, expect, it } from 'vitest';

import { findBandLevel } from './findBandLevel';

describe('findBandLevel', () => {
    const levels = [
        { priceLow: 18.75, priceHigh: 21.25, total: 3 },
        { priceLow: 16.25, priceHigh: 18.75, total: 0 },
        { priceLow: 13.75, priceHigh: 16.25, total: 2 },
    ];

    it('should find the level that contains the price, and none outside or without volume', () => {
        const prices = [22, 21.25, 20, 18.75, 17.5, 16.25, 15, 13.75, 13];

        expect(Object.fromEntries(prices.map((price) => [price, findBandLevel(levels, price)?.total])))
            .toMatchInlineSnapshot(`
          {
            "13": undefined,
            "13.75": 2,
            "15": 2,
            "16.25": undefined,
            "17.5": undefined,
            "18.75": 3,
            "20": 3,
            "21.25": 3,
            "22": undefined,
          }
        `);
    });

    it('should find nothing without levels', () => {
        expect(findBandLevel([], 10)).toBeUndefined();
    });
});
