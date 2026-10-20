import { afterEach, describe, expect, expectTypeOf, it } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';

import { createEnterpriseChart } from './utils';

describe('createEnterpriseChart', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;

    const waterfallOptions = (): AgChartOptions => ({
        data: [
            { c: 'A', v: 4 },
            { c: 'B', v: -2 },
            { c: 'C', v: 3 },
        ],
        series: [{ type: 'waterfall', xKey: 'c', yKey: 'v' }],
    });

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    it('is typed as returning the public chart instance', () => {
        expectTypeOf(createEnterpriseChart).returns.resolves.toEqualTypeOf<AgChartInstance>();
    });

    it('returns the public instance rather than the internal chart', async () => {
        chart = await createEnterpriseChart(waterfallOptions());

        const internal = deproxy(chart);

        expect(internal).not.toBe(chart);
        expect(internal.publicApi).toBe(chart);
        expect(chart).not.toHaveProperty('series');
        expect(chart).not.toHaveProperty('axes');
        expect(chart).not.toHaveProperty('ctx');
    });

    it('creates enterprise-only series and lets a test opt in to internals with deproxy()', async () => {
        chart = await createEnterpriseChart(waterfallOptions());

        const { series } = deproxy(chart);

        expect(series).toHaveLength(1);
        expect(series[0].type).toBe('waterfall');
        expect(series[0].visible).toBe(true);
    });

    it('applies the enterprise test options: animation disabled by default', async () => {
        chart = await createEnterpriseChart(waterfallOptions());

        expect(chart.getOptions().animation?.enabled).toBe(false);
    });

    it('leaves the caller options object untouched', async () => {
        const options = waterfallOptions();

        chart = await createEnterpriseChart(options);

        expect(options).toEqual(waterfallOptions());
        expect(options).not.toHaveProperty('animation');
        expect(options).not.toHaveProperty('container');
    });
});
