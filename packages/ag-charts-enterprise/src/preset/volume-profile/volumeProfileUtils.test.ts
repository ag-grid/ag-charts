import { describe, expect, it } from 'vitest';

import { normaliseVolumeProfile } from './volumeProfileUtils';

describe('volumeProfileUtils', () => {
    describe('normaliseVolumeProfile', () => {
        const keys = { priceKey: 'price', upKey: 'up', downKey: 'down' };
        const levelsFor = (prices: number[], tickSize: number) =>
            normaliseVolumeProfile(
                prices.map((price) => ({ price, up: 1, down: 2 })),
                keys,
                tickSize
            );

        it('should give each level a price range of half the tick size either side', () => {
            expect({
                tick2_5: levelsFor([135, 137.5, 140], 2.5),
                tick0_1: levelsFor([1.1, 1.2, 1.3], 0.1),
                tick0_01: levelsFor([0.07, 0.08], 0.01),
            }).toMatchInlineSnapshot(`
              {
                "tick0_01": [
                  {
                    "downVolume": 2,
                    "price": 0.08,
                    "priceHigh": 0.085,
                    "priceLow": 0.075,
                    "total": 3,
                    "upVolume": 1,
                  },
                  {
                    "downVolume": 2,
                    "price": 0.07,
                    "priceHigh": 0.075,
                    "priceLow": 0.065,
                    "total": 3,
                    "upVolume": 1,
                  },
                ],
                "tick0_1": [
                  {
                    "downVolume": 2,
                    "price": 1.3,
                    "priceHigh": 1.35,
                    "priceLow": 1.25,
                    "total": 3,
                    "upVolume": 1,
                  },
                  {
                    "downVolume": 2,
                    "price": 1.2,
                    "priceHigh": 1.25,
                    "priceLow": 1.15,
                    "total": 3,
                    "upVolume": 1,
                  },
                  {
                    "downVolume": 2,
                    "price": 1.1,
                    "priceHigh": 1.15,
                    "priceLow": 1.05,
                    "total": 3,
                    "upVolume": 1,
                  },
                ],
                "tick2_5": [
                  {
                    "downVolume": 2,
                    "price": 140,
                    "priceHigh": 141.25,
                    "priceLow": 138.75,
                    "total": 3,
                    "upVolume": 1,
                  },
                  {
                    "downVolume": 2,
                    "price": 137.5,
                    "priceHigh": 138.75,
                    "priceLow": 136.25,
                    "total": 3,
                    "upVolume": 1,
                  },
                  {
                    "downVolume": 2,
                    "price": 135,
                    "priceHigh": 136.25,
                    "priceLow": 133.75,
                    "total": 3,
                    "upVolume": 1,
                  },
                ],
              }
            `);
        });

        it('should span the full tick for a level between the extremes that has no data, and for a single level', () => {
            expect({
                gap: levelsFor([10, 15], 2.5),
                single: levelsFor([10], 2.5),
            }).toMatchInlineSnapshot(`
              {
                "gap": [
                  {
                    "downVolume": 2,
                    "price": 15,
                    "priceHigh": 16.25,
                    "priceLow": 13.75,
                    "total": 3,
                    "upVolume": 1,
                  },
                  {
                    "downVolume": 0,
                    "price": 12.5,
                    "priceHigh": 13.75,
                    "priceLow": 11.25,
                    "total": 0,
                    "upVolume": 0,
                  },
                  {
                    "downVolume": 2,
                    "price": 10,
                    "priceHigh": 11.25,
                    "priceLow": 8.75,
                    "total": 3,
                    "upVolume": 1,
                  },
                ],
                "single": [
                  {
                    "downVolume": 0,
                    "price": 12.5,
                    "priceHigh": 13.75,
                    "priceLow": 11.25,
                    "total": 0,
                    "upVolume": 0,
                  },
                  {
                    "downVolume": 2,
                    "price": 10,
                    "priceHigh": 11.25,
                    "priceLow": 8.75,
                    "total": 3,
                    "upVolume": 1,
                  },
                ],
              }
            `);
        });
    });
});
