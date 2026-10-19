import { describe, it } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-community';
import {
    compareImageSnapshot,
    scrollAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from 'ag-charts-test';

import { createEnterpriseChart } from '../../test/utils';

describe('BarSeries', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart != null) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async (customSnapshotIdentifier?: string) => {
        await compareImageSnapshot(chart, ctx, {
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

            chart = await createEnterpriseChart(options);
            const cx = CANVAS_WIDTH / 2;
            const cy = CANVAS_HEIGHT / 2;

            await scrollAction(cx, cy, -1.25)(chart);
            await waitForChartStability(chart);

            await compare();
        });
    });
});
