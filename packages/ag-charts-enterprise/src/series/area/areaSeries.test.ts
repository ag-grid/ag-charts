import { describe, expect, it } from '@jest/globals';

import { type AgChartInstance, type AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    extractImageData,
    scrollAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('BarSeries', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async (customSnapshotIdentifier?: string) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({
            failureThreshold: 0,
            failureThresholdType: 'percent',
            customSnapshotIdentifier,
        });
    };

    describe('Interpolation', () => {
        it('Keeps interpolation consistent when zooming', async () => {
            const options: AgChartOptions = {
                data: [
                    { category: 'cat 1', value: 181 },
                    { category: 'cat 2', value: 67 },
                    { category: 'cat 3', value: 192 },
                    { category: 'cat 4', value: 14 },
                    { category: 'cat 5', value: 108 },
                    { category: 'cat 6', value: 149 },
                    { category: 'cat 7', value: 121 },
                    { category: 'cat 8', value: 184 },
                    { category: 'cat 9', value: 185 },
                    { category: 'cat 10', value: 176 },
                    { category: 'cat 11', value: 43 },
                    { category: 'cat 12', value: 92 },
                ],
                series: [
                    {
                        type: 'area',
                        xKey: 'category',
                        yKey: 'value',
                        strokeWidth: 3,
                        interpolation: { type: 'smooth' },
                    },
                ],
                zoom: {
                    enabled: true,
                    autoScaling: { enabled: false },
                },
            };

            chart = AgCharts.create(prepareEnterpriseTestOptions(options));
            const cx = options.width! / 2;
            const cy = options.height! / 2;

            await waitForChartStability(chart);
            await scrollAction(cx, cy, -1.25)(chart);
            await waitForChartStability(chart);

            await compare();
        });
    });
});
