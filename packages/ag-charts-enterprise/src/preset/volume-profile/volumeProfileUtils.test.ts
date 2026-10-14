import { describe, expect, it } from 'vitest';

import { normaliseVolumeProfile } from './volumeProfileUtils';

describe('volumeProfileUtils', () => {
    describe('normaliseVolumeProfile', () => {
        const keys = { priceKey: 'price', upKey: 'up', downKey: 'down' };

        it.each([
            {
                tickSize: 2.5,
                prices: [135, 137.5, 140],
                expected: [
                    [140, 138.75, 141.25],
                    [137.5, 136.25, 138.75],
                    [135, 133.75, 136.25],
                ],
            },
            {
                tickSize: 0.1,
                prices: [1.1, 1.2, 1.3],
                expected: [
                    [1.3, 1.25, 1.35],
                    [1.2, 1.15, 1.25],
                    [1.1, 1.05, 1.15],
                ],
            },
            {
                tickSize: 0.01,
                prices: [0.07, 0.08],
                expected: [
                    [0.08, 0.075, 0.085],
                    [0.07, 0.065, 0.075],
                ],
            },
        ])(
            'should give each level a price range of half the tick size either side with tick $tickSize',
            ({ tickSize, prices, expected }) => {
                const data = prices.map((price) => ({ price, up: 1, down: 2 }));

                const levels = normaliseVolumeProfile(data, keys, tickSize);

                expect(levels.map(({ price, priceLow, priceHigh }) => [price, priceLow, priceHigh])).toEqual(expected);
            }
        );

        it('should span the full tick for a level between the extremes that has no data', () => {
            const data = [
                { price: 10, up: 1, down: 1 },
                { price: 15, up: 1, down: 1 },
            ];

            const levels = normaliseVolumeProfile(data, keys, 2.5);

            expect(levels.map(({ priceLow, priceHigh, total }) => [priceLow, priceHigh, total])).toEqual([
                [13.75, 16.25, 2],
                [11.25, 13.75, 0],
                [8.75, 11.25, 2],
            ]);
        });

        it('should keep the range of a single level one tick wide', () => {
            const levels = normaliseVolumeProfile([{ price: 10, up: 1, down: 1 }], keys, 2.5);

            expect(levels.map(({ priceLow, priceHigh }) => priceHigh - priceLow)).toEqual([2.5, 2.5]);
        });
    });
});
