import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { AgCartesianChartOptions, AgChartOptions } from '../options/agChartOptions';
import { AgCharts } from './agChartV2';
import type { CartesianChart } from './cartesianChart';
import type { Chart } from './chart';
import * as examples from './test/examples';
import { seedRandom } from './test/random';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    createChart,
    deproxy,
    doubleClickAction,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    waitForChartStability,
} from './test/utils';

function buildSeries(data: { x: number; y: number }) {
    return {
        data: [data],
        xKey: 'x',
        yKey: 'y',
        yName: String(data.x),
    };
}

const SERIES: { data: { x: number; y: number }[]; xKey: string; yKey: string; yName: string }[] = [];
const seriesDataRandom = seedRandom(10763960837);

for (let i = 0; i < 200; i++) {
    SERIES.push(buildSeries({ x: i, y: Math.floor(seriesDataRandom() * 100) }));
}

const OPTIONS: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Browser Usage Statistics',
    },
    subtitle: {
        text: '2009-2019',
    },
    series: SERIES,
};

describe('Legend', () => {
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

    const ctx = setupMockCanvas();

    const compare = async (chart: Chart) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('Large series count chart', () => {
        it.each([800, 600, 400, 200])('should render legend correctly at width [%s]', async (width) => {
            const options = {
                ...examples.LINE_GRAPH_WITH_GAPS_EXAMPLE,
            };

            prepareTestOptions(options);
            options.width = width ?? options.width;

            chart = deproxy(AgCharts.create(options));
            await compare(chart);
        });
    });

    describe('Large series count chart legend pagination', () => {
        const positions = ['right' as const, 'bottom' as const];

        it.each(positions)('should render legend correctly at position [%s]', async (position) => {
            const options = {
                ...OPTIONS,
                legend: {
                    position,
                },
            };
            prepareTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare(chart);
        });
    });

    describe('Clicking a legend', () => {
        it('should hide the related series', async () => {
            const options = {
                ...examples.GROUPED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            };

            prepareTestOptions(options);

            chart = deproxy(AgCharts.create(options)) as CartesianChart;

            await waitForChartStability(chart);

            const { x = 0, y = 0 } = chart.legend?.computeBBox() ?? {};
            await clickAction(x, y)(chart);

            await compare(chart);
        });

        it('when clicked twice should hide and re-show the related series', async () => {
            const options = {
                ...examples.GROUPED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            };

            prepareTestOptions(options);

            chart = deproxy(AgCharts.create(options));

            await waitForChartStability(chart);
            const { x = 0, y = 0 } = chart.legend?.computeBBox() ?? {};

            await clickAction(x, y)(chart);
            await waitForChartStability(chart);
            await clickAction(x, y)(chart);

            await compare(chart);
        });
    });

    describe('Double clicking a legend', () => {
        it('should hide all other series except this one', async () => {
            const options = {
                ...examples.GROUPED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            };

            prepareTestOptions(options);

            chart = deproxy(AgCharts.create(options));

            await waitForChartStability(chart);
            const { x = 0, y = 0 } = chart.legend?.computeBBox() ?? {};

            await doubleClickAction(x, y)(chart);

            await compare(chart);
        });

        it('when double clicked twice should show all series', async () => {
            const options = {
                ...examples.GROUPED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            };

            prepareTestOptions(options);

            chart = deproxy(AgCharts.create(options));

            await waitForChartStability(chart);
            const { x = 0, y = 0 } = chart.legend?.computeBBox() ?? {};

            await doubleClickAction(x, y)(chart);
            await waitForChartStability(chart);

            // Click the legend item again for some reason... why does this test require this?
            await clickAction(x, y)(chart);
            await waitForChartStability(chart);

            await doubleClickAction(x, y)(chart);

            await compare(chart);
        });
    });

    describe('showSeriesStroke', () => {
        const compareSnapshot = async (options: AgChartOptions) => {
            chart = await createChart(options);
            const imageData = extractImageData(ctx);
            expect(imageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
        };

        const data = [
            { x: 'Q1', a: 20, b: 10 },
            { x: 'Q2', a: 30, b: 27 },
            { x: 'Q3', a: 35, b: 16 },
            { x: 'Q4', a: 40, b: 20 },
        ];

        test('lines', async () => {
            await compareSnapshot({
                data,
                series: [
                    { xKey: 'x', yKey: 'a', stroke: 'palegreen' },
                    { xKey: 'x', yKey: 'b', stroke: 'blue' },
                ],
                legend: { item: { showSeriesStroke: true } },
            });
        });

        test('areas', async () => {
            await compareSnapshot({
                data,
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'a',
                        strokeWidth: 2,
                        stroke: 'palegreen',
                        fill: '#f0e0e0',
                        marker: { enabled: true, fill: 'seagreen' },
                    },
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'b',
                        strokeWidth: 2,
                        stroke: 'blue',
                        fill: '#e1e1ff',
                        marker: { enabled: true, fill: 'fuchsia' },
                    },
                ],
                legend: { item: { showSeriesStroke: true } },
            });
        });

        test('combination', async () => {
            await compareSnapshot({
                data,
                series: [
                    { type: 'area', xKey: 'x', yKey: 'a', strokeWidth: 2, stroke: 'palegreen', fill: '#f0e0e0' },
                    { type: 'line', xKey: 'x', yKey: 'b', stroke: 'blue' },
                ],
                legend: { item: { showSeriesStroke: true } },
            });
        });

        test('no-markers', async () => {
            await compareSnapshot({
                data,
                series: [
                    { type: 'area', marker: { enabled: false }, xKey: 'x', yKey: 'a', stroke: 'palegreen' },
                    { type: 'line', marker: { enabled: false }, xKey: 'x', yKey: 'b', stroke: 'blue' },
                ],
                legend: { item: { showSeriesStroke: true } },
            });
        });

        test('lineDash', async () => {
            await compareSnapshot({
                data,
                series: [
                    { xKey: 'x', yKey: 'a', marker: { enabled: false }, lineDash: [5, 5] },
                    { type: 'area', xKey: 'x', yKey: 'b', strokeWidth: 2, lineDash: [2, 2] },
                ],
                legend: { item: { showSeriesStroke: true } },
            });
        });
    });
});
