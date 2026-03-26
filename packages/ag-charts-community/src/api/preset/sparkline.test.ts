import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { expectWarningsCalls } from 'ag-charts-test';
import type { AgChartInstance, AgSparklineOptions } from 'ag-charts-types';

import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
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
        jest.restoreAllMocks();
    });

    const ctx = setupMockCanvas({ height: 150 });

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
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
