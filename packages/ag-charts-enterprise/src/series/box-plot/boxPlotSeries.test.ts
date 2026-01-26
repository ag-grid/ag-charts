import { describe, expect, it } from '@jest/globals';

import {
    type AgBoxPlotSeriesItemStylerParams,
    type AgBoxPlotSeriesStyle,
    type AgBoxPlotSeriesStylerParams,
    type AgCartesianChartOptions,
    type AgChartInstance,
    type AgChartOptions,
    AgCharts,
} from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    MIN_UNHIGHLIGHT_DELAY,
    type MockBoxPlotStyler,
    expectWarningsCalls,
    extractImageData,
    hoverAction,
    newFreezableMock,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

const BOX_PLOT_BAR_OPTIONS: AgChartOptions = {
    data: [
        { year: '2020', min: 3.07, q1: 4.78, median: 5.3, q3: 6.3, max: 7.27 },
        { year: '2021', min: 4.87, q1: 5.8, median: 6.13, q3: 6.66, max: 7.09 },
        { year: '2022', min: 4.4, q1: 4.41, median: 4.64, q3: 4.96, max: 5.2 },
        { year: '2023', min: 7.31, q1: 7.32, median: 7.32, q3: 7.33, max: 7.33 },
    ],
    series: [
        {
            type: 'box-plot',
            xKey: 'year',
            minKey: 'min',
            q1Key: 'q1',
            medianKey: 'median',
            q3Key: 'q3',
            maxKey: 'max',
        },
    ],
};

const CONTINUOUS_DATA = [
    { year: new Date(2020, 0, 1), min: 3.07, q1: 4.78, median: 5.3, q3: 6.3, max: 7.27 },
    { year: new Date(2021, 0, 1), min: 4.87, q1: 5.8, median: 6.13, q3: 6.66, max: 7.09 },
    { year: new Date(2022, 0, 1), min: 4.4, q1: 4.41, median: 4.64, q3: 4.96, max: 5.2 },
    { year: new Date(2023, 0, 1), min: 7.31, q1: 7.32, median: 7.32, q3: 7.33, max: 7.33 },
];

function switchSeriesType<T extends AgCartesianChartOptions>(opts: T, direction: 'horizontal' | 'vertical'): T {
    return {
        ...opts,
        series: opts['series']?.map((s) => ({
            ...s,
            direction,
        })),
    };
}

describe('BoxPlotSeries', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    const compareSnapshot = async (chart: any) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);

        chart.destroy();
    };

    it(`should render a box-plot chart as expected`, async () => {
        const options = BOX_PLOT_BAR_OPTIONS;
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a horizontal box-plot chart as expected`, async () => {
        const options = switchSeriesType(BOX_PLOT_BAR_OPTIONS, 'horizontal');
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a box-plot chart with a unit time x-axis`, async () => {
        const options: AgChartOptions = {
            ...BOX_PLOT_BAR_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                },
                x: {
                    position: 'bottom',
                    type: 'unit-time',
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a box-plot chart with a time x-axis`, async () => {
        const options: AgChartOptions = {
            ...BOX_PLOT_BAR_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                },
                x: {
                    position: 'bottom',
                    type: 'time',
                    nice: false,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a horizontal box-plot chart with a unit time y-axis`, async () => {
        const options: AgChartOptions = {
            ...switchSeriesType(BOX_PLOT_BAR_OPTIONS, 'horizontal'),
            data: CONTINUOUS_DATA,
            axes: {
                x: {
                    position: 'bottom',
                    type: 'number',
                },
                y: {
                    position: 'left',
                    type: 'unit-time',
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a horizontal box-plot chart with a time y-axis`, async () => {
        const options: AgChartOptions = {
            ...switchSeriesType(BOX_PLOT_BAR_OPTIONS, 'horizontal'),
            data: CONTINUOUS_DATA,
            axes: {
                x: {
                    position: 'bottom',
                    type: 'number',
                },
                y: {
                    position: 'left',
                    type: 'time',
                    nice: false,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a box-plot chart as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...BOX_PLOT_BAR_OPTIONS,
            axes: {
                x: {
                    type: 'category',
                    position: 'bottom',
                    reverse: true,
                },
                y: {
                    type: 'number',
                    position: 'left',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a horizontal box-plot chart as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...switchSeriesType(BOX_PLOT_BAR_OPTIONS, 'horizontal'),
            axes: {
                y: {
                    type: 'category',
                    position: 'left',
                    reverse: true,
                },
                x: {
                    type: 'number',
                    position: 'bottom',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a box-plot chart with a reversed unit time x-axis`, async () => {
        const options: AgChartOptions = {
            ...BOX_PLOT_BAR_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                },
                x: {
                    position: 'bottom',
                    type: 'unit-time',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a box-plot chart with a reversed time x-axis`, async () => {
        const options: AgChartOptions = {
            ...BOX_PLOT_BAR_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                },
                x: {
                    position: 'bottom',
                    type: 'time',
                    nice: false,
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a horizontal box-plot chart with a reversed unit time y-axis`, async () => {
        const options: AgChartOptions = {
            ...switchSeriesType(BOX_PLOT_BAR_OPTIONS, 'horizontal'),
            data: CONTINUOUS_DATA,
            axes: {
                x: {
                    position: 'bottom',
                    type: 'number',
                },
                y: {
                    position: 'left',
                    type: 'unit-time',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a horizontal box-plot chart with a reversed time y-axis`, async () => {
        const options: AgChartOptions = {
            ...switchSeriesType(BOX_PLOT_BAR_OPTIONS, 'horizontal'),
            data: CONTINUOUS_DATA,
            axes: {
                x: {
                    position: 'bottom',
                    type: 'number',
                },
                y: {
                    position: 'left',
                    type: 'time',
                    nice: false,
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for BOX_PLOT_BAR_OPTIONS should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = { ...BOX_PLOT_BAR_OPTIONS };
                prepareEnterpriseTestOptions(options);

                await compareSnapshot(AgCharts.create(options));
            });
        }
    });

    describe('gradient fill', () => {
        it('should render box plot series with a default gradient fill', async () => {
            const options = {
                ...BOX_PLOT_BAR_OPTIONS,
                series: [
                    {
                        ...BOX_PLOT_BAR_OPTIONS.series![0],
                        fill: {
                            type: 'gradient',
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);
            await compareSnapshot(AgCharts.create(options as AgChartOptions));
        });

        it('should render box plot series with a gradient fill', async () => {
            const options = {
                ...BOX_PLOT_BAR_OPTIONS,
                series: [
                    {
                        ...BOX_PLOT_BAR_OPTIONS.series![0],
                        fill: {
                            type: 'gradient',
                            colorStops: [
                                {
                                    color: 'green',
                                },
                                {
                                    color: 'white',
                                },
                            ],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);
            await compareSnapshot(AgCharts.create(options as AgChartOptions));
        });
    });

    describe('AG-15782 styler', () => {
        let chart: AgChartInstance;
        type D1 = { s1_min: number; s1_q1: number; s1_median: number; s1_q3: number; s1_max: number };
        type D2 = { s2_min: number; s2_q1: number; s2_median: number; s2_q3: number; s2_max: number };
        type D = { role: string } & D1 & D2;
        type C = unknown;
        type M = MockBoxPlotStyler<D, C>;
        type O = AgCartesianChartOptions<D, C>;
        let styler: ReturnType<typeof newFreezableMock<D, C, M>>;

        const data: D[] = [
            {
                role: 'Sales Executive',
                s1_min: 4001,
                s2_min: 3500,
                s1_q1: 5071,
                s2_q1: 4700,
                s1_median: 6232,
                s2_median: 5800,
                s1_q3: 8620,
                s2_q3: 9100,
                s1_max: 13872,
                s2_max: 14500,
            },
            {
                role: 'Research Scientist',
                s1_min: 1009,
                s2_min: 1200,
                s1_q1: 2389,
                s2_q1: 2100,
                s1_median: 2889,
                s2_median: 2600,
                s1_q3: 3904,
                s2_q3: 4200,
                s1_max: 5974,
                s2_max: 6100,
            },
            {
                role: 'Manufacturing Director',
                s1_min: 4011,
                s2_min: 3900,
                s1_q1: 5121,
                s2_q1: 5000,
                s1_median: 6474,
                s2_median: 6900,
                s1_q3: 9547,
                s2_q3: 10000,
                s1_max: 13973,
                s2_max: 14100,
            },
            {
                role: 'Manager',
                s1_min: 12504,
                s2_min: 12000,
                s1_q1: 16437,
                s2_q1: 15000,
                s1_median: 17465,
                s2_median: 16800,
                s1_q3: 19187,
                s2_q3: 19500,
                s1_max: 19999,
                s2_max: 20000,
            },
            {
                role: 'Research Director',
                s1_min: 11031,
                s2_min: 10500,
                s1_q1: 13499,
                s2_q1: 12500,
                s1_median: 16598,
                s2_median: 15500,
                s1_q3: 19038,
                s2_q3: 18500,
                s1_max: 19973,
                s2_max: 19800,
            },
            {
                role: 'Human Resources',
                s1_min: 1555,
                s2_min: 1400,
                s1_q1: 2342,
                s2_q1: 2200,
                s1_median: 3195,
                s2_median: 3100,
                s1_q3: 5985,
                s2_q3: 5800,
                s1_max: 10725,
                s2_max: 11200,
            },
        ];

        beforeEach(() => {
            styler = newFreezableMock<D, C, M>(
                (params: AgBoxPlotSeriesStylerParams<D, C>): AgBoxPlotSeriesStyle | undefined => {
                    if (params.yName === 'Company 1')
                        return {
                            fill: 'cyan',
                            lineDash: [7, 2],
                            lineDashOffset: 5,
                            stroke: 'blue',
                            strokeWidth: 7,
                            strokeOpacity: 0.5,
                            whisker: {
                                lineDash: [3, 3],
                                lineDashOffset: 5,
                                stroke: 'navy',
                                strokeWidth: 3,
                                strokeOpacity: 1,
                            },
                        };
                    else if (params.yName === 'Company 2')
                        return {
                            fill: 'magenta',
                            fillOpacity: 0.5,
                            cornerRadius: 15,
                            cap: { lengthRatio: 1 },
                        };
                    return {};
                }
            );
        });
        describe('init', () => {
            let c1: C;
            let c2: C;
            beforeEach(async () => {
                c1 = { name: 'context 1' };
                c2 = { name: 'context 2' };
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        series: [
                            {
                                type: 'box-plot',
                                yName: 'Company 1',
                                xKey: 'role',
                                minKey: 's1_min',
                                q1Key: 's1_q1',
                                medianKey: 's1_median',
                                q3Key: 's1_q3',
                                maxKey: 's1_max',

                                context: c1,
                                fill: 'lime', // ignored
                                stroke: 'lawngreen', // ignored
                                whisker: { stroke: 'seagreen' }, // ignored
                                styler: styler.frozen,
                            },
                            {
                                type: 'box-plot',
                                yName: 'Company 2',
                                xKey: 'role',
                                minKey: 's2_min',
                                q1Key: 's2_q1',
                                medianKey: 's2_median',
                                q3Key: 's2_q3',
                                maxKey: 's2_max',

                                context: c2,
                                stroke: 'gold', // not ignored
                                styler: styler.frozen,
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compareSnapshot(chart);
            });
            describe('callbacks', () => {
                test('context', () => {
                    styler.expect().nthCalledWithContext(0, c1);
                    styler.expect().nthCalledWithContext(1, c2);
                    styler.expect().toHaveBeenCalledTimes(2);
                });
                test('params', () => {
                    expect(styler.mock.mock.calls).toMatchSnapshot();
                });
            });
        });
        describe('priorities', () => {
            beforeEach(async () => {
                const itemStyler = (params: AgBoxPlotSeriesItemStylerParams<D, C>): AgBoxPlotSeriesStyle => {
                    if (params.seriesId === 'BoxPlotSeries-2') {
                        if (params.datum.role === 'Manager') {
                            return { fill: 'darkgreen', cornerRadius: 0 };
                        }
                    }
                    if (params.datum.role === 'Human Resources') {
                        return { fill: 'grey', cornerRadius: 0 };
                    }
                    return {};
                };
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        series: [
                            {
                                type: 'box-plot',
                                yName: 'Company 1',
                                xKey: 'role',
                                minKey: 's1_min',
                                q1Key: 's1_q1',
                                medianKey: 's1_median',
                                q3Key: 's1_q3',
                                maxKey: 's1_max',

                                fill: 'lime', // ignored
                                stroke: 'lawngreen', // ignored
                                whisker: { stroke: 'seagreen' }, // ignored
                                itemStyler,
                                styler: styler.frozen,
                            },
                            {
                                type: 'box-plot',
                                yName: 'Company 2',
                                xKey: 'role',
                                minKey: 's2_min',
                                q1Key: 's2_q1',
                                medianKey: 's2_median',
                                q3Key: 's2_q3',
                                maxKey: 's2_max',

                                stroke: 'gold', // not ignored
                                cornerRadius: 45, // ignored (overridden by: styler, itemStyler for Manager & Human Resources)
                                itemStyler,
                                styler: styler.frozen,
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compareSnapshot(chart);
            });
        });
        describe('gradient-pattern', () => {
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        series: [
                            {
                                type: 'box-plot',
                                yName: 'Company 1',
                                xKey: 'role',
                                minKey: 's1_min',
                                q1Key: 's1_q1',
                                medianKey: 's1_median',
                                q3Key: 's1_q3',
                                maxKey: 's1_max',
                                fill: { type: 'gradient' },
                                styler: () => {
                                    return { fill: { type: 'gradient' } };
                                },
                            },
                            {
                                type: 'box-plot',
                                yName: 'Company 2',
                                xKey: 'role',
                                minKey: 's2_min',
                                q1Key: 's2_q1',
                                medianKey: 's2_median',
                                q3Key: 's2_q3',
                                maxKey: 's2_max',
                                fill: { type: 'pattern' },
                                styler: () => {
                                    return { fill: { type: 'pattern' } };
                                },
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compareSnapshot(chart);
            });
        });
        describe('highlights', () => {
            // Manual-test version available at box-plot-series-test#styler-highlight-state
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        series: [
                            {
                                type: 'box-plot',
                                yName: 'Company 1',
                                xKey: 'role',
                                minKey: 's1_min',
                                q1Key: 's1_q1',
                                medianKey: 's1_median',
                                q3Key: 's1_q3',
                                maxKey: 's1_max',
                                styler: styler.frozen,
                            },
                            {
                                type: 'box-plot',
                                yName: 'Company 2',
                                xKey: 'role',
                                minKey: 's2_min',
                                q1Key: 's2_q1',
                                medianKey: 's2_median',
                                q3Key: 's2_q3',
                                maxKey: 's2_max',
                                styler: styler.frozen,
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });

            const miss = { x: 200, y: 100 } as const;
            const series0datum0 = { x: 100, y: 333 } as const;
            const series0datum2 = { x: 222, y: 424 } as const;
            const series1datum0 = { x: 145, y: 333 } as const;
            const legendItem0 = { x: 333, y: 572 } as const;
            const legendItem1 = { x: 444, y: 572 } as const;

            describe('single', () => {
                async function testHover(p: { readonly x: number; readonly y: number }) {
                    await hoverAction(p.x, p.y)(chart);
                    expect(styler.mock.mock.calls).toMatchSnapshot();
                }
                test('miss', async () => testHover(miss));
                test('series[0].datum[0]', async () => testHover(series0datum0));
                test('series[0].datum[2]', async () => testHover(series0datum2));
                test('series[1].datum[0]', async () => testHover(series1datum0));
                test('legendItem[0]', async () => testHover(legendItem0));
                test('legendItem[1]', async () => testHover(legendItem1));
            });
            describe('sequenced', () => {
                async function hover(p: { readonly x: number; readonly y: number }) {
                    await hoverAction(p.x, p.y)(chart);
                }
                test('1', async () => {
                    await hover(miss);
                    await hover(series0datum0);
                    await hover(miss);
                    await hover(series0datum2);
                    await hover(miss);
                    await hover(series1datum0);
                    await hover(miss);
                    await hover(legendItem0);
                    await hover(legendItem1);
                    // Wait for delayed unhighlights to complete
                    await waitForChartStability(chart, MIN_UNHIGHLIGHT_DELAY);
                    expect(styler.mock.mock.calls).toMatchSnapshot();
                });
            });
        });
    });

    describe('segmentation', () => {
        it('should render box-plot series with segmentation styling on x-axis', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { category: 'A', min: 3.07, q1: 4.78, median: 5.3, q3: 6.3, max: 7.27 },
                    { category: 'B', min: 4.87, q1: 5.8, median: 6.13, q3: 6.66, max: 7.09 },
                    { category: 'C', min: 4.4, q1: 4.41, median: 4.64, q3: 4.96, max: 5.2 },
                    { category: 'D', min: 7.31, q1: 7.32, median: 7.32, q3: 7.33, max: 7.33 },
                    { category: 'E', min: 5.1, q1: 6.2, median: 7, q3: 8.1, max: 9 },
                ],
                series: [
                    {
                        type: 'box-plot',
                        xKey: 'category',
                        minKey: 'min',
                        q1Key: 'q1',
                        medianKey: 'median',
                        q3Key: 'q3',
                        maxKey: 'max',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 'A', stop: 'B', fill: 'rgba(255, 0, 0, 0.3)', stroke: 'red', strokeWidth: 2 },
                                { start: 'C', stop: 'D', fill: 'rgba(0, 0, 255, 0.3)', stroke: 'blue', strokeWidth: 3 },
                                { start: 'E', fill: 'rgba(0, 255, 0, 0.3)', stroke: 'green', strokeWidth: 2 },
                            ],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);
            await compareSnapshot(AgCharts.create(options));
        });

        it('should render box-plot series with segmentation styling on y-axis', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 0, min: 3, q1: 5, median: 7, q3: 9, max: 12 },
                    { x: 1, min: 8, q1: 10, median: 13, q3: 16, max: 20 },
                    { x: 2, min: 15, q1: 18, median: 22, q3: 25, max: 30 },
                    { x: 3, min: 28, q1: 32, median: 35, q3: 38, max: 42 },
                ],
                series: [
                    {
                        type: 'box-plot',
                        xKey: 'x',
                        minKey: 'min',
                        q1Key: 'q1',
                        medianKey: 'median',
                        q3Key: 'q3',
                        maxKey: 'max',
                        segmentation: {
                            key: 'y',
                            segments: [
                                {
                                    start: 5,
                                    stop: 15,
                                    fill: 'rgba(255, 165, 0, 0.3)',
                                    stroke: 'orange',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 15,
                                    stop: 25,
                                    fill: 'rgba(128, 0, 128, 0.3)',
                                    stroke: 'purple',
                                    strokeWidth: 3,
                                },
                                { start: 25, fill: 'rgba(0, 255, 255, 0.3)', stroke: 'cyan', strokeWidth: 4 },
                            ],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);
            await compareSnapshot(AgCharts.create(options));
        });

        it('should render horizontal box-plot series with segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { category: 'A', min: 3.07, q1: 4.78, median: 5.3, q3: 6.3, max: 7.27 },
                    { category: 'B', min: 4.87, q1: 5.8, median: 6.13, q3: 6.66, max: 7.09 },
                    { category: 'C', min: 4.4, q1: 4.41, median: 4.64, q3: 4.96, max: 5.2 },
                    { category: 'D', min: 7.31, q1: 7.32, median: 7.32, q3: 7.33, max: 7.33 },
                ],
                series: [
                    {
                        type: 'box-plot',
                        direction: 'horizontal',
                        xKey: 'category',
                        minKey: 'min',
                        q1Key: 'q1',
                        medianKey: 'median',
                        q3Key: 'q3',
                        maxKey: 'max',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'A',
                                    stop: 'B',
                                    fill: 'rgba(255, 192, 203, 0.4)',
                                    stroke: 'hotpink',
                                    strokeWidth: 2,
                                },
                                { start: 'C', fill: 'rgba(173, 216, 230, 0.4)', stroke: 'lightblue', strokeWidth: 3 },
                            ],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);
            await compareSnapshot(AgCharts.create(options));
        });

        it('should render box-plot series with pattern fill segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { category: 'A', min: 3.07, q1: 4.78, median: 5.3, q3: 6.3, max: 7.27 },
                    { category: 'B', min: 4.87, q1: 5.8, median: 6.13, q3: 6.66, max: 7.09 },
                    { category: 'C', min: 4.4, q1: 4.41, median: 4.64, q3: 4.96, max: 5.2 },
                ],
                series: [
                    {
                        type: 'box-plot',
                        xKey: 'category',
                        minKey: 'min',
                        q1Key: 'q1',
                        medianKey: 'median',
                        q3Key: 'q3',
                        maxKey: 'max',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'A',
                                    stop: 'B',
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'vertical-lines',
                                        strokeWidth: 3,
                                    },
                                    stroke: '#ff6b6b',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 'C',
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'forward-slanted-lines',
                                    },
                                    stroke: '#4ecdc4',
                                    strokeWidth: 3,
                                },
                            ],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);
            await compareSnapshot(AgCharts.create(options as AgChartOptions));
        });
    });

    describe('null category key', () => {
        const BOX_PLOT_NULL_CATEGORY_KEY_DATA = [
            { year: '2020', min: 3.07, q1: 4.78, median: 5.3, q3: 6.3, max: 7.27 },
            { year: null, min: 4.87, q1: 5.8, median: 6.13, q3: 6.66, max: 7.09 },
            { year: '2022', min: 4.4, q1: 4.41, median: 4.64, q3: 4.96, max: 5.2 },
        ];

        const BOX_PLOT_NULL_CATEGORY_KEY_OPTIONS: AgChartOptions = {
            data: BOX_PLOT_NULL_CATEGORY_KEY_DATA,
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'box-plot',
                    xKey: 'year',
                    minKey: 'min',
                    q1Key: 'q1',
                    medianKey: 'median',
                    q3Key: 'q3',
                    maxKey: 'max',
                },
            ],
        };

        it('should reject null category key with warning', async () => {
            const options: AgChartOptions = { ...BOX_PLOT_NULL_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            const chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [BoxPlotSeries-1 / xValue] ignored:",
    "[null]",
  ],
]
`);
            await compareSnapshot(chart);
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...BOX_PLOT_NULL_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...BOX_PLOT_NULL_CATEGORY_KEY_OPTIONS.series![0],
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            const chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compareSnapshot(chart);
        });
    });

    describe('undefined category key', () => {
        const BOX_PLOT_UNDEFINED_CATEGORY_KEY_DATA = [
            { year: '2020', min: 3.07, q1: 4.78, median: 5.3, q3: 6.3, max: 7.27 },
            { year: undefined, min: 4.87, q1: 5.8, median: 6.13, q3: 6.66, max: 7.09 },
            { year: '2022', min: 4.4, q1: 4.41, median: 4.64, q3: 4.96, max: 5.2 },
        ];

        const BOX_PLOT_NULL_AND_UNDEFINED_KEYS_DATA = [
            { year: '2020', min: 3.07, q1: 4.78, median: 5.3, q3: 6.3, max: 7.27 },
            { year: null, min: 4, q1: 5, median: 5.5, q3: 6, max: 6.5 },
            { year: undefined, min: 4.87, q1: 5.8, median: 6.13, q3: 6.66, max: 7.09 },
            { year: '2023', min: 4.4, q1: 4.41, median: 4.64, q3: 4.96, max: 5.2 },
        ];

        const BOX_PLOT_UNDEFINED_CATEGORY_KEY_OPTIONS: AgChartOptions = {
            data: BOX_PLOT_UNDEFINED_CATEGORY_KEY_DATA,
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'box-plot',
                    xKey: 'year',
                    minKey: 'min',
                    q1Key: 'q1',
                    medianKey: 'median',
                    q3Key: 'q3',
                    maxKey: 'max',
                },
            ],
        };

        const BOX_PLOT_NULL_AND_UNDEFINED_KEYS_OPTIONS: AgChartOptions = {
            data: BOX_PLOT_NULL_AND_UNDEFINED_KEYS_DATA,
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'box-plot',
                    xKey: 'year',
                    minKey: 'min',
                    q1Key: 'q1',
                    medianKey: 'median',
                    q3Key: 'q3',
                    maxKey: 'max',
                },
            ],
        };

        it('should reject undefined category key with warning', async () => {
            const options: AgChartOptions = { ...BOX_PLOT_UNDEFINED_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            const chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [BoxPlotSeries-1 / xValue] ignored:",
    "[undefined]",
  ],
]
`);
            await compareSnapshot(chart);
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...BOX_PLOT_UNDEFINED_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...BOX_PLOT_UNDEFINED_CATEGORY_KEY_OPTIONS.series![0],
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            const chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compareSnapshot(chart);
        });

        it('should aggregate null and undefined to the same category when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...BOX_PLOT_NULL_AND_UNDEFINED_KEYS_OPTIONS,
                series: [
                    {
                        ...BOX_PLOT_NULL_AND_UNDEFINED_KEYS_OPTIONS.series![0],
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            const chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compareSnapshot(chart);
        });
    });
});
