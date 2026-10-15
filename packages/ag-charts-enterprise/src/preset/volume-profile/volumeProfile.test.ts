import { describe, expect, it } from 'vitest';

import { _Theme } from 'ag-charts-community';
import type { AgVolumeProfileChartPreset } from 'ag-charts-types';

import { createVolumeProfileSeries } from './volumeProfile';
import { volumeProfileChart } from './volumeProfilePreset';
import { normaliseVolumeProfile } from './volumeProfileUtils';

type ChartTheme = InstanceType<typeof _Theme.ChartTheme>;

const KEYS = { priceKey: 'price', upKey: 'up', downKey: 'down' };

describe('volume profile levels', () => {
    it('should span the prices each level groups, from the lowest to the first of the level above', () => {
        const levels = normaliseVolumeProfile(
            [
                { price: 145, up: 1, down: 2 },
                { price: 149, up: 3, down: 4 },
                { price: 154.9, up: 5, down: 6 },
                { price: 160, up: 7, down: 8 },
            ],
            KEYS,
            10
        );

        expect(levels.map(({ price, priceLow, priceHigh }) => [price, priceLow, priceHigh])).toEqual([
            [160, 155, 165],
            [150, 145, 155],
        ]);
        // 145 rounds up into 150.
        expect(levels[1]).toMatchObject({ upVolume: 9, downVolume: 12, total: 21 });
    });

    it('should keep the bounds free of float noise', () => {
        const [level] = normaliseVolumeProfile([{ price: 0.3, up: 1, down: 1 }], KEYS, 0.1);
        expect([level.priceLow, level.priceHigh]).toEqual([0.25, 0.35]);
    });
});

describe('volume profile tooltips', () => {
    const getTheme = () => ({ palette: {} }) as unknown as ChartTheme;
    const [upSeries, downSeries] = createVolumeProfileSeries(getTheme, 'x');

    const [level] = normaliseVolumeProfile([{ price: 150, up: 56617298, down: 68115020 }], KEYS, 10);

    const render = (series: typeof upSeries) => {
        const { yKey, yName } = series;
        return series.tooltip.renderer({ datum: level, yKey, yName } as any).data;
    };

    it('should give the range a level covers beside its up volume', () => {
        expect(render(upSeries)).toEqual([
            { label: 'Range', value: '145-155' },
            { label: 'Up Volume', value: '56,617,298' },
        ]);
    });

    it('should give the down volume and total of a level with thousands separators, without repeating the range', () => {
        expect(render(downSeries)).toEqual([
            { label: 'Down Volume', value: '68,115,020' },
            { label: 'Total', value: '124,732,318' },
        ]);
    });
});

describe('volume profile volume axis', () => {
    const options = { data: [], upKey: 'up', downKey: 'down' } as AgVolumeProfileChartPreset;
    const { yVolumeProfile } = volumeProfileChart(options, undefined, () => ({}) as ChartTheme).axes as any;

    it('should abbreviate large volumes', () => {
        const { formatter } = yVolumeProfile.label;
        expect([0, 500, 12_500, 100_000_000, 200_000_000].map((value) => formatter({ value }))).toEqual([
            '0',
            '500',
            '12.5K',
            '100M',
            '200M',
        ]);
    });
});
