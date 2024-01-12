import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { memoryUsage } from 'process';

import { AgCharts } from './agChartV2';
import type { Chart } from './chart';
import type { AgChartProxy } from './chartProxy';
import { EXAMPLES } from './test/examples-integrated-charts';
import { deproxy, prepareTestOptions, setupMockCanvas, waitForChartStability } from './test/utils';

expect.extend({ toMatchImageSnapshot });

// Heap size comparisons can be flaky - let's be sure any failure is consistent.
jest.retryTimes(5);

describe('Chart Heap Memory', () => {
    let chart: Chart;

    beforeEach(() => {
        console.warn = jest.fn();
    });

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        expect(console.warn).not.toBeCalled();
    });

    setupMockCanvas();

    describe('Check for leaks', () => {
        async function createChart(options: object) {
            const chartOptions = prepareTestOptions(options);
            const chartProxy = AgCharts.create(chartOptions) as AgChartProxy;
            const chart = deproxy(chartProxy);
            await waitForChartStability(chart);
            return { chart, chartProxy, chartOptions };
        }

        async function updateChart(chartProxy: AgChartProxy, options: object) {
            const chartOptions = prepareTestOptions(options);
            AgCharts.update(chartProxy, chartOptions);
            const chart = deproxy(chartProxy);
            await waitForChartStability(chart);
        }

        it('should not leak memory after many updates', async () => {
            const startingHeap = memoryUsage().heapUsed;

            const options = Object.values(EXAMPLES);
            const { chartProxy } = await createChart({});

            for (let i = 0; i < 3; i++) {
                for (const nextOpts of options) {
                    await updateChart(chartProxy, nextOpts.options);
                }
            }

            chartProxy.destroy();
            const endingHeap = memoryUsage().heapUsed;
            const heapProportionChange = Math.abs(endingHeap - startingHeap) / startingHeap;

            expect(heapProportionChange).toBeLessThan(0.15);
        });
    });
});
