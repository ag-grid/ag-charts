import { afterEach, describe, expect, it } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import type { AgChartInstance, AgLinearGaugeOptions, AgRadialGaugeOptions } from 'ag-charts-types';

import { prepareEnterpriseTestOptions } from '../../test/utils';

const GAUGES: { name: string; options: AgRadialGaugeOptions | AgLinearGaugeOptions }[] = [
    { name: 'radial', options: { type: 'radial-gauge', value: 50, scale: { min: 0, max: 100 } } },
    { name: 'linear', options: { type: 'linear-gauge', value: 50, scale: { min: 0, max: 100 } } },
];

describe('gauge preset series id', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
    });

    const create = async (options: AgRadialGaugeOptions | AgLinearGaugeOptions) => {
        const prepared = { ...options } as AgRadialGaugeOptions;
        prepareEnterpriseTestOptions(prepared);
        chart = AgCharts.createGauge(prepared);
        await waitForChartStability(chart);
        return deproxy(chart).series[0].id;
    };

    it.each(GAUGES)('defaults the series id of a $name gauge to "gauge"', async ({ options }) => {
        expect(await create(options)).toBe('gauge');
    });

    it.each(GAUGES)('uses the id given to a $name gauge', async ({ options }) => {
        expect(await create({ ...options, id: 'my-gauge' })).toBe('my-gauge');
    });

    it.each(GAUGES)('provides the series id to label callbacks of a $name gauge', async ({ options }) => {
        const seriesIds = new Set<string>();
        const label = {
            formatter: ({ seriesId }: { seriesId: string }) => {
                seriesIds.add(seriesId);
                return undefined;
            },
        };

        await create({ ...options, label } as AgRadialGaugeOptions);
        expect(Array.from(seriesIds)).toEqual(['gauge']);

        seriesIds.clear();
        chart.destroy();
        await create({ ...options, id: 'my-gauge', label } as AgRadialGaugeOptions);
        expect(Array.from(seriesIds)).toEqual(['my-gauge']);
    });
});
