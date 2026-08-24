import { afterEach, describe, it, vi } from 'vitest';

import { expectWarningsCalls } from 'ag-charts-test';
import type { AgChartInstance, AgSparklineOptions } from 'ag-charts-types';

import {
    compareImageSnapshot,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../chart/test/utils';
import { AgCharts } from '../agCharts';

describe('Sparkline Preset', () => {
    setupMockConsole();

    let chart: AgChartInstance<AgSparklineOptions>;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        vi.restoreAllMocks();
    });

    const ctx = setupMockCanvas({ height: 150 });

    const compare = async () => {
        await compareImageSnapshot(chart, ctx);
    };

    const prepareSparklineOptions = (opts: AgSparklineOptions) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { height, ...outputOpts } = prepareTestOptions(opts);
        return { height: 150, pool: false, ...outputOpts };
    };

    describe('#__createSparkline', () => {
        it('should render a basic sparkline', async () => {
            const options = prepareSparklineOptions({
                type: 'line',
                xKey: 'x',
                yKey: 'y',
                data: [
                    {
                        x: 0,
                        y: 0.56,
                    },
                    {
                        x: 1,
                        y: -0.81,
                    },
                    {
                        x: 2,
                        y: -0.18,
                    },
                    {
                        x: 3,
                        y: 0.66,
                    },
                    {
                        x: 4,
                        y: -0.45,
                    },
                ],
            });

            chart = AgCharts.__createSparkline(options);
            await waitForChartStability(chart);

            await compare();
        });

        it('should render a basic sparkline from single value data', async () => {
            const options = prepareSparklineOptions({
                type: 'line',
                data: [0.56, -0.81, -0.18, 0.66, -0.45],
            });

            chart = AgCharts.__createSparkline(options);
            await waitForChartStability(chart);

            await compare();
        });

        it('should render a basic sparkline from single value data when first value is undefined', async () => {
            const options = prepareSparklineOptions({
                type: 'line',
                data: [undefined, -0.81, -0.18, 0.66, -0.45],
            });

            chart = AgCharts.__createSparkline(options);
            await waitForChartStability(chart);

            await compare();
        });

        it('should render a basic sparkline from tuples', async () => {
            const options = prepareSparklineOptions({
                type: 'line',
                data: [
                    [0, 0.56],
                    [1, -0.81],
                    [2, -0.18],
                    [3, 0.66],
                    [4, -0.45],
                ],
            });

            chart = AgCharts.__createSparkline(options);
            await waitForChartStability(chart);

            await compare();
        });

        it('should render a basic sparkline from tuples when first value is undefined', async () => {
            const options = prepareSparklineOptions({
                type: 'line',
                data: [undefined, [1, -0.81], [2, -0.18], [3, 0.66], [4, -0.45]],
            });

            chart = AgCharts.__createSparkline(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [LineSeries-1 / xKey] ignored:",
    "[undefined]",
  ],
  [
    "AG Charts - invalid value of type [undefined] for [LineSeries-1 / xValue] ignored:",
    "[undefined]",
  ],
]
`);

            await compare();
        });

        it('should render a basic sparkline from empty data', async () => {
            const options = prepareSparklineOptions({
                type: 'line',
                data: [],
            });

            chart = AgCharts.__createSparkline(options);
            await waitForChartStability(chart);
        });

        it('should render a bar sparkline', async () => {
            const options = prepareSparklineOptions({
                type: 'bar',
                xKey: 'x',
                yKey: 'y',
                data: [
                    {
                        x: 0,
                        y: 0.56,
                    },
                    {
                        x: 1,
                        y: -0.81,
                    },
                    {
                        x: 2,
                        y: -0.18,
                    },
                    {
                        x: 3,
                        y: 0.66,
                    },
                    {
                        x: 4,
                        y: -0.45,
                    },
                ],
            });

            chart = AgCharts.__createSparkline(options);
            await waitForChartStability(chart);

            await compare();
        });

        it('should render a bar sparkline with an item styler', async () => {
            const options = prepareSparklineOptions({
                type: 'bar',
                xKey: 'x',
                yKey: 'y',
                data: [
                    {
                        x: 0,
                        y: 0.56,
                    },
                    {
                        x: 1,
                        y: -0.81,
                    },
                    {
                        x: 2,
                        y: -0.18,
                    },
                    {
                        x: 3,
                        y: 0.66,
                    },
                    {
                        x: 4,
                        y: -0.45,
                    },
                ],
                itemStyler: (params) => {
                    if (params.first) return { fill: 'blue' };
                    if (params.last) return { fill: 'green' };
                },
            });

            chart = AgCharts.__createSparkline(options);
            await waitForChartStability(chart);

            await compare();
        });

        // Renders the same cases optionsModule.test.ts pins as a resolved option tree.
        const parityData = [1, 3, 2, 5, 4];

        function markerItemStyler(params: { highlightState?: string }) {
            return params.highlightState === 'highlighted-item' ? { size: 7 } : { size: 0 };
        }

        it('should render a bar sparkline with user-supplied axis styling', async () => {
            const options = prepareSparklineOptions({
                type: 'bar',
                direction: 'vertical',
                fill: '#fac858',
                data: parityData,
                axis: { type: 'category', stroke: '#cccccc', strokeWidth: 2, visible: true },
            });

            chart = AgCharts.__createSparkline(options);
            await waitForChartStability(chart);

            await compare();
        });

        it('should render a horizontal bar sparkline with user-supplied axis styling', async () => {
            const options = prepareSparklineOptions({
                type: 'bar',
                direction: 'horizontal',
                min: 0,
                // Above the data's maximum, so the bars scale to distinguishable lengths. A `max`
                // below it saturates every bar to full width, leaving no geometry to compare.
                max: 6,
                fill: '#5470c6',
                data: parityData,
                axis: { type: 'category', stroke: '#cccccc', strokeWidth: 2, visible: true },
            });

            chart = AgCharts.__createSparkline(options);
            await waitForChartStability(chart);

            await compare();
        });

        it('should render a line sparkline with top-level padding', async () => {
            const options = prepareSparklineOptions({
                type: 'line',
                stroke: 'rgb(124, 255, 178)',
                strokeWidth: 2,
                data: parityData,
                padding: { top: 5, bottom: 5 },
            });

            chart = AgCharts.__createSparkline(options);
            await waitForChartStability(chart);

            await compare();
        });

        it('should render an area sparkline with fill opacity and a marker styler', async () => {
            const options = prepareSparklineOptions({
                type: 'area',
                fill: 'rgba(216, 204, 235, 0.3)',
                fillOpacity: 0.5,
                stroke: 'rgb(119,77,185)',
                data: parityData,
                marker: { enabled: true, size: 0, itemStyler: markerItemStyler },
                axis: { type: 'category', stroke: 'rgb(204, 204, 235)' },
            });

            chart = AgCharts.__createSparkline(options);
            await waitForChartStability(chart);

            await compare();
        });

        it('should render a line sparkline with a tooltip renderer and a marker styler', async () => {
            const options = prepareSparklineOptions({
                type: 'line',
                stroke: 'rgb(124, 255, 178)',
                data: parityData,
                marker: { enabled: true, size: 0, itemStyler: markerItemStyler },
                tooltip: {
                    renderer: (params) => ({ title: String(params.xValue), content: String(params.yValue) }),
                },
            });

            chart = AgCharts.__createSparkline(options);
            await waitForChartStability(chart);

            await compare();
        });

        it('should render a bar sparkline with labels and a label formatter', async () => {
            const options = prepareSparklineOptions({
                type: 'bar',
                direction: 'vertical',
                fill: '#fac858',
                data: parityData,
                padding: { top: 10, bottom: 10 },
                label: {
                    enabled: true,
                    color: '#999999',
                    // Inside the bar: `outside-end` pushes the tallest bar's label off the top of
                    // the canvas, losing the label most likely to move if layout changes.
                    placement: 'inside-end',
                    fontSize: 7.5,
                    padding: 1,
                    formatter: (params) => `${params.value}%`,
                },
            });

            chart = AgCharts.__createSparkline(options);
            await waitForChartStability(chart);

            await compare();
        });
    });

    describe('#updateDelta', () => {
        it('should update a basic sparkline', async () => {
            const options = prepareSparklineOptions({
                type: 'line',
                xKey: 'x',
                yKey: 'y',
                data: [
                    {
                        x: 0,
                        y: 0.56,
                    },
                    {
                        x: 1,
                        y: -0.81,
                    },
                    {
                        x: 2,
                        y: -0.18,
                    },
                    {
                        x: 3,
                        y: 0.66,
                    },
                    {
                        x: 4,
                        y: -0.45,
                    },
                ],
            });

            chart = AgCharts.__createSparkline(options);
            await waitForChartStability(chart);

            await chart.updateDelta({
                data: [
                    {
                        x: 0,
                        y: 0.4,
                    },
                    {
                        x: 1,
                        y: -0.3,
                    },
                    {
                        x: 2,
                        y: -0.2,
                    },
                    {
                        x: 3,
                        y: 0.1,
                    },
                    {
                        x: 4,
                        y: -0.5,
                    },
                ],
            });

            await compare();
        });

        it('should update a basic sparkline from single value data', async () => {
            const options = prepareSparklineOptions({ type: 'line', data: [0.56, -0.81, -0.18, 0.66, -0.45] });

            chart = AgCharts.__createSparkline(options);
            await waitForChartStability(chart);

            await chart.updateDelta({ data: [0.4, -0.3, -0.2, 0.1, -0.5] });

            await compare();
        });

        it('should render a basic sparkline from tuples', async () => {
            const options = prepareSparklineOptions({
                type: 'line',
                data: [
                    [0, 0.56],
                    [1, -0.81],
                    [2, -0.18],
                    [3, 0.66],
                    [4, -0.45],
                ],
            });

            chart = AgCharts.__createSparkline(options);
            await waitForChartStability(chart);

            await chart.updateDelta({
                data: [
                    [0, 0.4],
                    [1, -0.3],
                    [2, -0.2],
                    [3, 0.1],
                    [4, -0.5],
                ],
            });

            await compare();
        });

        it('should update a bar sparkline with an item styler', async () => {
            const options = prepareSparklineOptions({
                type: 'bar',
                xKey: 'x',
                yKey: 'y',
                data: [
                    {
                        x: 0,
                        y: 0.56,
                    },
                    {
                        x: 1,
                        y: -0.81,
                    },
                    {
                        x: 2,
                        y: -0.18,
                    },
                    {
                        x: 3,
                        y: 0.66,
                    },
                    {
                        x: 4,
                        y: -0.45,
                    },
                ],
                itemStyler: (params) => {
                    if (params.first) return { fill: 'blue' };
                    if (params.last) return { fill: 'green' };
                },
            });

            chart = AgCharts.__createSparkline(options);
            await waitForChartStability(chart);

            await chart.updateDelta({ data: [0.4, -0.3, -0.2, 0.1, -0.5] });

            await compare();
        });
    });
});
