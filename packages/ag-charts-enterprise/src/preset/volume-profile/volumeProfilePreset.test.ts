import { afterEach, describe, expect, it, vi } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    compareImageSnapshot,
    prepareFinancialTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { AgChartInstance, AgVolumeProfileChartOptions } from 'ag-charts-types';

import { setupEnterpriseModules } from '../../setup';
import { getRegularVolumeProfile } from '../test/volumeProfileData';

setupEnterpriseModules();

describe('volumeProfilePreset', () => {
    setupMockConsole();

    let chart: AgChartInstance<AgVolumeProfileChartOptions>;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        vi.restoreAllMocks();
    });

    const ctx = setupMockCanvas();

    const render = async (options: AgVolumeProfileChartOptions) => {
        chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions(options));
        await waitForChartStability(chart);
        return ctx.snapshot();
    };

    it('should render to canvas as expected', async () => {
        chart = AgCharts.createVolumeProfileChart(
            prepareFinancialTestOptions({
                data: getRegularVolumeProfile(),
                upKey: 'upVolume',
                downKey: 'downVolume',
                title: { text: 'Volume Profile' },
            })
        );
        await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
    });

    it('should read the price, up and down values from the given keys', async () => {
        const reference = await render({ data: getRegularVolumeProfile(), upKey: 'upVolume', downKey: 'downVolume' });
        chart.destroy();

        const data = getRegularVolumeProfile().map(({ price, upVolume, downVolume }) => ({
            level: price,
            buys: upVolume,
            sells: downVolume,
        }));
        const actual = await render({ data, priceKey: 'level', upKey: 'buys', downKey: 'sells' });
        expect(actual).toMatchImage(reference);
    });
});
