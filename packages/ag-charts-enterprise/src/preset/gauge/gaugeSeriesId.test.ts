import { afterEach, describe, expect, it } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import {
    deproxy,
    expectWarningsCalls,
    getSeriesOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { AgChartInstance, AgLinearGaugeOptions, AgRadialGaugeOptions } from 'ag-charts-types';

import { prepareEnterpriseTestOptions } from '../../test/utils';

const GAUGES: { name: string; options: AgRadialGaugeOptions | AgLinearGaugeOptions }[] = [
    { name: 'radial', options: { type: 'radial-gauge', value: 50, scale: { min: 0, max: 100 } } },
    { name: 'linear', options: { type: 'linear-gauge', value: 50, scale: { min: 0, max: 100 } } },
];

describe('gauge preset', () => {
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

    const createSeriesOptions = async (options: AgRadialGaugeOptions | AgLinearGaugeOptions) => {
        await create(options);
        return getSeriesOptions<any>(chart);
    };

    const operator = { $ref: 'foregroundColor' };

    it.each(GAUGES)('resolves theme operators in user theme overrides of a $name gauge', async ({ options }) => {
        const theme = {
            params: { foregroundColor: '#123456' },
            overrides: {
                [options.type]: { bar: { fill: operator }, scale: { fill: operator }, targets: { fill: operator } },
            },
        };

        const seriesOptions = await createSeriesOptions({ ...options, targets: [{ value: 30 }], theme } as any);
        expect(seriesOptions.bar.fill).toBe('#123456');
        expect(seriesOptions.scale.fill).toBe('#123456');
        expect(seriesOptions.targets[0].fill).toBe('#123456');
        expectWarningsCalls().toHaveLength(0);
    });

    it.each(GAUGES)('rejects theme operators in the options of a $name gauge', async ({ options }) => {
        const defaultFill = (await createSeriesOptions(options)).bar.fill;
        chart.destroy();

        expect((await createSeriesOptions({ ...options, bar: { fill: operator } } as any)).bar.fill).toEqual(
            defaultFill
        );
        expectWarningsCalls().not.toHaveLength(0);
    });
});
