import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { memoryUsage } from 'process';

import { AgCharts } from './agChartV2';
import type { Chart } from './chart';
import type { AgChartProxy } from './chartProxy';
import { deproxy, prepareTestOptions, setupMockCanvas, setupMockConsole, waitForChartStability } from './test/utils';

// Heap size comparisons can be flaky - let's be sure any failure is consistent.
jest.retryTimes(5);

describe('Chart Heap Memory', () => {
    setupMockConsole();

    let chart: Chart;

    function genData(dMax = 30, sMax = 80) {
        const result = [];
        for (let d = 0; d < dMax; d++) {
            const datum: any = {};
            const group = Math.floor(d / 5);
            datum.key = {
                labels: [`Group-${group}`, `Datum-${d}`],
                toString() {
                    return `Group-${group} - Datum-${d}`;
                },
            };
            for (let s = 0; s < sMax; s++) {
                datum[`value-${s}`] = Math.random();
            }
            result.push(datum);
        }
        return result;
    }

    function genSeries(type: string, sMax = 80) {
        const result = [];
        for (let s = 0; s < sMax; s++) {
            const series = {
                type,
                xKey: 'key',
                yKey: `value-${s}`,
                yName: `Series-${s}`,
                stacked: false,
            };
            result.push(series);
        }
        return result;
    }

    const options1 = {
        mode: 'integrated',
        data: genData(),
        axes: [
            {
                type: 'grouped-category',
                position: 'bottom',
            },
            {
                type: 'number',
                position: 'left',
            },
        ],
        series: genSeries('bar'),
    };
    const options2 = {
        mode: 'integrated',
        data: genData(),
        axes: [
            {
                type: 'grouped-category',
                position: 'bottom',
            },
            {
                type: 'number',
                position: 'left',
            },
        ],
        series: genSeries('area'),
    };

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    setupMockCanvas();

    describe('Check for leaks', () => {
        async function createChart(options: object) {
            const chartOptions = prepareTestOptions(options);
            const chartProxy = AgCharts.create(chartOptions) as AgChartProxy;
            const chartInstance = deproxy(chartProxy);
            await waitForChartStability(chartInstance);
            return { chart: chartInstance, chartProxy, chartOptions };
        }

        async function updateChart(chartProxy: AgChartProxy, options: object) {
            const chartOptions = prepareTestOptions(options);
            AgCharts.update(chartProxy, chartOptions);
            await waitForChartStability(deproxy(chartProxy));
        }

        it('should not leak memory after many updates', async () => {
            const startingHeap = memoryUsage().heapUsed;

            const options = [options1, options2, options1, options2];
            const { chartProxy } = await createChart({});

            for (let i = 0; i < 3; i++) {
                for (const nextOpts of options) {
                    await updateChart(chartProxy, nextOpts);
                }
            }

            chartProxy.destroy();
            const endingHeap = memoryUsage().heapUsed;
            const heapProportionChange = Math.abs(endingHeap - startingHeap) / startingHeap;

            // console.log({ startingHeap, endingHeap, heapProportionChange });
            expect(heapProportionChange).toBeLessThan(0.15);
        }, 20_000);
    });
});
