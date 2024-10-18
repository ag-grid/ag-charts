import { afterEach, describe, expect, it } from '@jest/globals';

import type { AgCartesianChartOptions, AgChartOptions } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import type { Chart } from './chart';
import { Marker } from './marker/marker';
import * as examples from './test/examples';
import { seedRandom } from './test/random';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    computeLegendBBox,
    createChart,
    deproxy,
    doubleClickAction,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';
import type { AgChartProxy } from './test/utils';

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

class AGChartsLogo extends Marker {
    override updatePath() {
        const pathData = [
            'M58,10l-17,0l-8,8l25,0l0,-8Z',
            'M43,30l0,-7.995l-14,0l-8.008,7.995l22.008,0Z',
            'M13,38.01l4,-4.01l14,0l0,8l-18,0l0,-3.99Z',
            'M41,10l-4,4l-26,0l0,-8l30,0l0,4Z',
            'M16,26l9,0l8,-8l-17,0l0,8Z',
            'M6,37.988l7,0.012l7.992,-8l-14.992,-0.047l-0,8.035Z',
        ];
        updatePath(pathData, this.path, 0.4, 12, 10);
    }
}

class NpmLogo extends Marker {
    override updatePath() {
        const pathData = ['M5.8,21.75l7.86,0l0,-11.77l3.92,0l0,11.78l3.93,0l0,-15.7l-15.7,0l0,15.69'];
        updatePath(pathData, this.path, 0.75, 5, 11);
    }
}

function updatePath(pathData: string[], path: Marker['path'], scale: number, xOffset: number, yOffset: number) {
    path.clear();
    pathData.forEach((pathDatum) => {
        const parts = pathDatum.split('l');
        let startX = parseFloat(parts[0].substring(1).split(',')[0]) * scale - xOffset;
        let startY = parseFloat(parts[0].substring(1).split(',')[1]) * scale - yOffset;
        path.moveTo(startX, startY);

        for (let i = 1; i < parts.length; i++) {
            const coords = parts[i].split(',');
            const x = parseFloat(coords[0]) * scale;
            const y = parseFloat(coords[1]) * scale;
            path.lineTo(startX + x, startY + y);
            startX += x;
            startY += y;
        }
    });
    path.closePath();
}

describe('Legend', () => {
    setupMockConsole();
    let chart: Chart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async (chartInstance: Chart) => {
        await waitForChartStability(chartInstance);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    const compareSnapshot = async (options: AgChartOptions) => {
        chart = await createChart(options);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
    };

    describe('Large series count chart', () => {
        it.each([800, 600, 400, 200])('should render legend correctly at width [%s]', async (width) => {
            const options = {
                ...examples.LINE_GRAPH_WITH_GAPS_EXAMPLE,
            };

            prepareTestOptions(options);
            options.width = width ?? options.width;

            chart = deproxy(AgCharts.create(options) as AgChartProxy);
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
            chart = await createChart(options);
            await compare(chart);
        });
    });

    describe('Clicking a legend', () => {
        it('should hide the related series', async () => {
            const options = {
                ...examples.GROUPED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            };
            chart = await createChart(options);

            const { x, y } = computeLegendBBox(chart);
            await clickAction(x, y)(chart);

            await compare(chart);
        });

        it('when clicked twice should hide and re-show the related series', async () => {
            const options = {
                ...examples.GROUPED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            };
            chart = await createChart(options);

            const { x, y } = computeLegendBBox(chart);

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
            chart = await createChart(options);

            const { x, y } = computeLegendBBox(chart);
            await doubleClickAction(x, y)(chart);

            await compare(chart);
        });

        it('when double clicked twice should show all series', async () => {
            const options = {
                ...examples.GROUPED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            };
            chart = await createChart(options);

            const { x, y } = computeLegendBBox(chart);

            await doubleClickAction(x, y)(chart);
            await waitForChartStability(chart);

            // Click the legend item again for some reason... why does this test require this?
            await clickAction(x, y)(chart);
            await waitForChartStability(chart);

            await doubleClickAction(x, y)(chart);

            await compare(chart);
        });
    });

    describe('Hover over legend', () => {
        it('should change the cursor when entering and leaving the legend rect', async () => {
            const options = {
                ...examples.GROUPED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            };

            prepareTestOptions(options);

            chart = deproxy(AgCharts.create(options));

            const legendButtons = document.querySelectorAll('button.proxy-elem[role="switch"]');
            for (const button of Array.from(legendButtons) as HTMLElement[]) {
                expect(button).toBeInstanceOf(HTMLButtonElement);
                expect(button.style.cursor).toBe('pointer');
            }
        });
    });

    describe('showSeriesStroke', () => {
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
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'a',
                        strokeWidth: 2,
                        stroke: 'palegreen',
                        fill: '#f0e0e0',
                        marker: { enabled: true },
                    },
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

        test('line strokeWidth override', async () => {
            await compareSnapshot({
                data,
                series: [
                    { type: 'line', xKey: 'x', yKey: 'a', strokeWidth: 1, marker: { enabled: false } },
                    { type: 'area', xKey: 'x', yKey: 'b', strokeWidth: 1 },
                ],
                legend: {
                    item: {
                        showSeriesStroke: true,
                        line: { strokeWidth: 8 },
                    },
                },
            });
        });

        test('line length', async () => {
            await compareSnapshot({
                data,
                series: [
                    { type: 'line', xKey: 'x', yKey: 'a', strokeWidth: 1 },
                    { type: 'area', xKey: 'x', yKey: 'b', strokeWidth: 1 },
                ],
                legend: {
                    item: {
                        showSeriesStroke: true,
                        line: { length: 35 },
                    },
                },
            });
        });
    });

    describe('Large faded symbols', () => {
        test('strokeWidth: 10', async () => {
            await compareSnapshot({
                data: [
                    { x: 'x1', a: 1, b: 2 },
                    { x: 'x2', a: 1, b: 2 },
                ],
                series: [
                    { visible: false, xKey: 'x', yKey: 'a', marker: { shape: 'diamond' } },
                    { visible: false, xKey: 'x', yKey: 'b', marker: { shape: 'triangle' } },
                ],
                legend: { item: { marker: { size: 30, strokeWidth: 10 }, line: { length: 70 } } },
            });
        });
    });

    describe('AG-12614', () => {
        test('updateDelta line to bar', async () => {
            const options: AgChartOptions = prepareTestOptions({
                title: { text: 'Chinese Olympic medals' },
                data: [
                    { year: '2016', gold: 26, silver: 18, bronze: 26 },
                    { year: '2020', gold: 38, silver: 32, bronze: 19 },
                    { year: '2024', gold: 40, silver: 27, bronze: 24 },
                ],
                series: [
                    { type: 'line', xKey: 'year', yKey: 'gold' },
                    { type: 'line', xKey: 'year', yKey: 'silver' },
                    { type: 'line', xKey: 'year', yKey: 'bronze' },
                ],
            });

            const chartInstance = AgCharts.create(options);
            chart = deproxy(chartInstance);
            await compare(chart);

            await chartInstance.updateDelta({
                ...options,
                series: [
                    { type: 'bar', xKey: 'year', yKey: 'gold' },
                    { type: 'bar', xKey: 'year', yKey: 'silver' },
                    { type: 'bar', xKey: 'year', yKey: 'bronze' },
                ],
            });
            await compare(chart);
        });
    });

    describe('AG-12693', () => {
        test('custom marker shapes', async () => {
            const options = prepareTestOptions({
                data: [
                    { x: 0, ag: 2, npm: 3 },
                    { x: 1, ag: 6, npm: 7 },
                    { x: 2, ag: 5, npm: 1 },
                ],
                series: [
                    { type: 'scatter', xKey: 'x', yKey: 'ag', shape: AGChartsLogo },
                    { type: 'scatter', xKey: 'x', yKey: 'npm', shape: NpmLogo },
                ],
            });
            chart = deproxy(AgCharts.create(options));
            await compare(chart);

            const [x_ag, x_npm, y] = [357, 428, 575];

            // Hide AG Grid scatter
            await clickAction(x_ag, y)(chart);
            await compare(chart);

            // Hide NPM scatter
            await clickAction(x_npm, y)(chart);
            await compare(chart);

            // Show both scatters
            await clickAction(x_ag, y)(chart);
            await clickAction(x_npm, y)(chart);
            await compare(chart);
        });
    });
});
