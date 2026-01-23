import { afterEach, describe, expect, it } from '@jest/globals';

import {
    type AgCartesianChartOptions,
    type AgChartOptions,
    AgCharts,
    type AgRangeBarSeriesItemStylerParams,
    type AgRangeBarSeriesLabelPlacement,
    type AgRangeBarSeriesStyle,
    type AgRangeBarSeriesStylerParams,
} from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    MIN_UNHIGHLIGHT_DELAY,
    type MockRangeBarStyler,
    expectWarningsCalls,
    extractImageData,
    hoverAction,
    newFreezableMock,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    testLegendItemName,
    waitForChartStability,
} from 'ag-charts-community-test';
import { roundTo } from 'ag-charts-core';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('RangeBarSeries', () => {
    setupMockConsole();
    let chart: any;
    const ctx = setupMockCanvas();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const CONTINUOUS_DATA = [
        {
            date: new Date(1996, 4, 11).getTime(),
            high: 1900,
            low: 900,
        },
        {
            date: new Date(1996, 4, 12).getTime(),
            high: 1345,
            low: 345,
        },
        {
            date: new Date(1996, 4, 13).getTime(),
            high: 1393,
            low: 393,
        },
        {
            date: new Date(1996, 4, 14).getTime(),
            high: 1108,
            low: -108,
        },
        {
            date: new Date(1996, 4, 15).getTime(),
            high: 1154,
            low: -154,
        },
        {
            date: new Date(1996, 4, 16).getTime(),
            high: 1135,
            low: 135,
        },
        {
            date: new Date(1996, 4, 17).getTime(),
            high: 1178,
            low: 178,
        },
        {
            date: new Date(1996, 4, 18).getTime(),
            high: 1286,
            low: 286,
        },
        {
            date: new Date(1996, 4, 19).getTime(),
            high: 1119,
            low: -119,
        },
        {
            date: new Date(1996, 4, 20).getTime(),
            high: 1361,
            low: -361,
        },
        {
            date: new Date(1996, 4, 21).getTime(),
            high: 1203,
            low: -203,
        },
    ];
    const CONTINUOUS_DATE_DATA = CONTINUOUS_DATA.map((d) => ({ ...d, date: new Date(d.date) }));
    const Y_DATE_DATA = [
        {
            department: 'Finance',
            low: new Date(2024, 5, 20), //.getTime(),
            high: new Date(2024, 6, 21), //.getTime(),
        },
        {
            department: 'Engineering',
            low: new Date(2024, 3, 20), //.getTime(),
            high: new Date(2024, 5, 21), //.getTime(),
        },
        {
            department: 'Marketing',
            low: new Date(2024, 6, 20), //.getTime(),
            high: new Date(2024, 7, 21), //.getTime(),
        },
        {
            department: 'Sales',
            low: new Date(2024, 4, 20), //.getTime(),
            high: new Date(2024, 10, 21), //.getTime(),
        },
    ];
    const RANGE_COLUMN_OPTIONS: AgCartesianChartOptions = {
        data: [
            {
                date: 'Jan',
                high: 5.2,
                low: -13.9,
            },
            {
                date: 'Feb',
                high: 10.6,
                low: -16.7,
            },
            {
                date: 'Mar',
                high: 11.6,
                low: -4.7,
            },
            {
                date: 'Apr',
                high: 16.8,
                low: -4.4,
            },
            {
                date: 'May',
                high: 27.2,
                low: -2.1,
            },
            {
                date: 'Jun',
                high: 29.4,
                low: 5.9,
            },
            {
                date: 'Jul',
                high: 29.1,
                low: 6.5,
            },
            {
                date: 'Aug',
                high: 25.4,
                low: 4.7,
            },
            {
                date: 'Sep',
                high: 21.6,
                low: 4.3,
            },
            {
                date: 'Oct',
                high: 15.1,
                low: -3.5,
            },
            {
                date: 'Nov',
                high: 12.5,
                low: -9.8,
            },
            {
                date: 'Dec',
                high: 8.4,
                low: -11.5,
            },
        ],
        series: [
            {
                type: 'range-bar',
                xKey: 'date',
                yLowKey: 'low',
                yHighKey: 'high',
                label: {
                    enabled: true,
                    formatter: ({ value }) => `${value}°C`,
                },
            },
        ],
    };
    const RANGE_Y_DATE_OPTIONS: AgCartesianChartOptions = {
        data: Y_DATE_DATA,
        series: [
            {
                type: 'range-bar',
                xKey: 'department',
                yLowKey: 'low',
                yHighKey: 'high',
            },
        ],
        axes: {
            y: { type: 'time', position: 'left' },
            x: { type: 'category', position: 'bottom' },
        },
    };

    const compare = async (options = IMAGE_SNAPSHOT_DEFAULTS) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(options);
    };

    function switchSeriesType<T extends AgCartesianChartOptions>(
        { axes, ...opts }: T,
        direction: 'horizontal' | 'vertical'
    ): T {
        if (axes) {
            for (const axis of Object.values(axes)) {
                switch (axis.position) {
                    case 'left':
                        axis.position = 'bottom';
                        break;
                    case 'right':
                        axis.position = 'top';
                        break;
                    case 'bottom':
                        axis.position = 'left';
                        break;
                    case 'top':
                        axis.position = 'right';
                        break;
                }
            }
        }
        return {
            ...opts,
            axes,
            series: opts['series']?.map((s) => ({
                ...s,
                direction,
            })),
        } as T;
    }

    it(`should render a range-bar chart as expected`, async () => {
        const options: AgChartOptions = { ...RANGE_COLUMN_OPTIONS };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart as expected`, async () => {
        const options: AgChartOptions = { ...switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal') };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with Date x values as expected`, async () => {
        const options: AgChartOptions = { ...RANGE_COLUMN_OPTIONS, data: CONTINUOUS_DATE_DATA };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart with Date x values as expected`, async () => {
        const options: AgChartOptions = {
            ...switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal'),
            data: CONTINUOUS_DATE_DATA,
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with Date y values as expected`, async () => {
        const options: AgChartOptions = { ...RANGE_Y_DATE_OPTIONS };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart with Date y values as expected`, async () => {
        const options: AgChartOptions = {
            ...switchSeriesType(RANGE_Y_DATE_OPTIONS, 'horizontal'),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with inverted high and low values`, async () => {
        const options: AgChartOptions = {
            ...RANGE_COLUMN_OPTIONS,
            data: RANGE_COLUMN_OPTIONS.data?.map((datum: { date: string; high: number; low: number }) => ({
                ...datum,
                low: datum.high,
                high: datum.low,
            })),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart with inverted high and low values`, async () => {
        const RANGE_BAR_OPTIONS = switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal');
        const options: AgChartOptions = {
            ...RANGE_BAR_OPTIONS,
            data: RANGE_BAR_OPTIONS.data?.map((datum: { date: string; high: number; low: number }) => ({
                ...datum,
                low: datum.high,
                high: datum.low,
            })),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...RANGE_COLUMN_OPTIONS,
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                    reverse: true,
                },
                x: {
                    position: 'bottom',
                    type: 'category',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal'),
            axes: {
                x: {
                    position: 'bottom',
                    type: 'number',
                    reverse: true,
                },
                y: {
                    position: 'left',
                    type: 'category',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with a unit time x-axis`, async () => {
        const options: AgChartOptions = {
            ...RANGE_COLUMN_OPTIONS,
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

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with a reversed unit time x-axis`, async () => {
        const options: AgChartOptions = {
            ...RANGE_COLUMN_OPTIONS,
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

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart with a unit time y-axis`, async () => {
        const RANGE_BAR_OPTIONS = switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal');
        const options: AgChartOptions = {
            ...RANGE_BAR_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                y: {
                    position: 'left',
                    type: 'unit-time',
                },
                x: {
                    position: 'bottom',
                    type: 'number',
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart with a reversed unit time y-axis`, async () => {
        const RANGE_BAR_OPTIONS = switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal');
        const options: AgChartOptions = {
            ...RANGE_BAR_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                y: {
                    position: 'left',
                    type: 'unit-time',
                    reverse: true,
                },
                x: {
                    position: 'bottom',
                    type: 'number',
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with a number x-axis`, async () => {
        const options: AgChartOptions = {
            ...RANGE_COLUMN_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                },
                x: {
                    position: 'bottom',
                    type: 'number',
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with a reversed number x-axis`, async () => {
        const options: AgChartOptions = {
            ...RANGE_COLUMN_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                },
                x: {
                    position: 'bottom',
                    type: 'number',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart with a number y-axis`, async () => {
        const RANGE_BAR_OPTIONS = switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal');
        const options: AgChartOptions = {
            ...RANGE_BAR_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                },
                x: {
                    position: 'bottom',
                    type: 'number',
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal range-bar chart with a number y-axis`, async () => {
        const RANGE_BAR_OPTIONS = switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal');
        const options: AgChartOptions = {
            ...RANGE_BAR_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                    reverse: true,
                },
                x: {
                    position: 'bottom',
                    type: 'number',
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with duplicate category keys`, async () => {
        const options: AgChartOptions = {
            ...RANGE_COLUMN_OPTIONS,
            series: RANGE_COLUMN_OPTIONS.series?.map((s) => ({
                ...s,
                strokeWidth: 1,
                fillOpacity: 0.5,
            })),
            data: [
                ...(RANGE_COLUMN_OPTIONS.data ?? []),
                ...(RANGE_COLUMN_OPTIONS.data?.map((datum: { date: string; high: number; low: number }) => ({
                    ...datum,
                    low: roundTo(datum.low * 0.5, 1),
                    high: roundTo(datum.high * 2, 1),
                })) ?? []),
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for RANGE_COLUMN_OPTIONS should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = { ...RANGE_COLUMN_OPTIONS };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await compare();
            });

            it(`for horizontal RANGE_COLUMN_OPTIONS should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = { ...switchSeriesType(RANGE_COLUMN_OPTIONS, 'horizontal') };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('gradient fill', () => {
        it('should render range column series with a default gradient fill', async () => {
            const options = {
                ...RANGE_COLUMN_OPTIONS,
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'date',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        fill: {
                            type: 'gradient',
                        },
                    },
                ],
            };

            prepareEnterpriseTestOptions(options as AgChartOptions);

            chart = AgCharts.create(options as AgChartOptions);
            await waitForChartStability(chart);

            await compare();
        });

        it('should render range bar series with a default gradient fill', async () => {
            const options = {
                ...RANGE_COLUMN_OPTIONS,
                series: [
                    {
                        type: 'range-bar',
                        direction: 'horizontal',
                        xKey: 'date',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        fill: {
                            type: 'gradient',
                        },
                    },
                ],
            };

            prepareEnterpriseTestOptions(options as AgChartOptions);

            chart = AgCharts.create(options as AgChartOptions);
            await waitForChartStability(chart);

            await compare();
        });

        it('should render range column series with a gradient fill', async () => {
            const options = {
                ...RANGE_COLUMN_OPTIONS,
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'date',
                        yLowKey: 'low',
                        yHighKey: 'high',
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

            prepareEnterpriseTestOptions(options as AgChartOptions);

            chart = AgCharts.create(options as AgChartOptions);
            await waitForChartStability(chart);

            await compare();
        });

        it('should render range bar series with a gradient fill', async () => {
            const options = {
                ...RANGE_COLUMN_OPTIONS,
                series: [
                    {
                        type: 'range-bar',
                        direction: 'horizontal',
                        xKey: 'date',
                        yLowKey: 'low',
                        yHighKey: 'high',
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

            prepareEnterpriseTestOptions(options as AgChartOptions);

            chart = AgCharts.create(options as AgChartOptions);
            await waitForChartStability(chart);

            await compare();
        });
    });

    describe('AG-8290', () => {
        async function testCase(
            labelOpts: { placement: AgRangeBarSeriesLabelPlacement; padding?: number; spacing?: number },
            name: string
        ) {
            chart = AgCharts.create(
                prepareEnterpriseTestOptions({
                    data: [
                        { x: '1', yL: 140, yH: 160 },
                        { x: '2', yL: 124, yH: 141 },
                        { x: '3', yL: 112, yH: 165 },
                        { x: '4', yL: 118, yH: 132 },
                    ],
                    series: [{ type: 'range-bar', xKey: 'x', yLowKey: 'yL', yHighKey: 'yH', label: { ...labelOpts } }],
                })
            );
            await compare({ failureThreshold: 0, failureThresholdType: 'percent', customSnapshotIdentifier: name });
        }
        describe('padding backward compatibility', () => {
            test('inside', async () => {
                await testCase({ placement: 'inside', padding: 30 }, 'AG-8290-range-bar-label-spacing-inside');
            });
            test('outside', async () => {
                await testCase({ placement: 'outside', padding: 30 }, 'AG-8290-range-bar-label-spacing-outside');
            });
        });
        describe('spacing backward compatibility', () => {
            test('inside', async () => {
                await testCase({ placement: 'inside', spacing: 30 }, 'AG-8290-range-bar-label-spacing-inside');
            });
            test('outside', async () => {
                await testCase({ placement: 'outside', spacing: 30 }, 'AG-8290-range-bar-label-spacing-outside');
            });
        });
    });

    describe('AG-15448', () => {
        const DATA1 = [
            { month: 'Jan', tempLow: 5, tempHigh: 15, status: 1 },
            { month: 'Feb', tempLow: 7, tempHigh: 18, status: 1 },
            { month: 'Mar', tempLow: 10, tempHigh: 22, status: 1 },
            { month: 'Apr', tempLow: 12, tempHigh: 25, status: 2 },
            { month: 'Jul', tempLow: 20, tempHigh: 30, status: 2 }, // This overlaps with the DATA2 dataset and can render in the wrong color.
            { month: 'Aug', tempLow: 18, tempHigh: 28, status: 1 },
        ];

        const DATA2 = [
            { month: 'May', tempLow: 15, tempHigh: 27, status: 2 },
            { month: 'Jun', tempLow: 18, tempHigh: 29, status: 1 },
            { month: 'Jul', tempLow: 20, tempHigh: 30, status: 2 },
        ];

        const EXAMPLE_OPTIONS: AgCartesianChartOptions<
            { month: string; tempLow: number; tempHigh: number; status: number },
            { colors: Record<number, string> }
        > = {
            context: { colors: { 1: 'orange', 2: 'green' } },
            data: DATA1,
            series: [
                {
                    type: 'range-bar',
                    xKey: 'month',
                    yLowKey: 'tempLow',
                    yHighKey: 'tempHigh',
                    label: { formatter: ({ datum, context }) => context?.colors[datum.status] ?? 'none' },
                    itemStyler: ({ datum, context }) => ({
                        fill: context?.colors[datum.status] ?? 'none',
                    }),
                },
            ],
        };

        it('should render updated data in the itemStyler specified colors', async () => {
            const options = { ...EXAMPLE_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            await chart.updateDelta({ data: DATA2 });
            await compare();
        });
    });

    describe('AG-15782 styler', () => {
        type D = { month: string; gain_low: number; gain_high: number; loss_low: number; loss_high: number };
        type C = unknown;
        type M = MockRangeBarStyler<D, C>;
        let styler: ReturnType<typeof newFreezableMock<D, C, M>>;
        const data = [
            { month: 'January', gain_low: 1200, gain_high: 1500, loss_low: 800, loss_high: 1100 },
            { month: 'February', gain_low: 1500, gain_high: 1650, loss_low: 950, loss_high: 1450 },
            { month: 'March', gain_low: 1700, gain_high: 1920, loss_low: 1600, loss_high: 1815 },
        ];
        beforeEach(() => {
            styler = newFreezableMock<D, C, M>(
                (params: AgRangeBarSeriesStylerParams<D, C>): AgRangeBarSeriesStyle | undefined => {
                    if (params.yLowKey === 'gain_low')
                        return {
                            fill: 'cyan',
                            lineDash: [3, 3],
                            lineDashOffset: 5,
                            stroke: 'blue',
                            strokeWidth: 7,
                        };
                    else if (params.yLowKey === 'loss_low')
                        return {
                            fill: 'magenta',
                            fillOpacity: 0.5,
                            cornerRadius: 15,
                        };
                    return {};
                }
            );
        });
        describe('init', () => {
            let c1: C;
            let c2: C;
            beforeEach(async () => {
                c1 = { name: 'gain context' };
                c2 = { name: 'loss context' };
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions({
                        data,
                        series: [
                            {
                                type: 'range-bar',
                                context: c1,
                                xKey: 'month',
                                yName: 'Gain',
                                yLowKey: 'gain_low',
                                yHighKey: 'gain_high',
                                styler: styler.frozen,
                                grouped: false,
                            },
                            {
                                type: 'range-bar',
                                context: c2,
                                xKey: 'month',
                                yName: 'Loss',
                                yLowKey: 'loss_low',
                                yHighKey: 'loss_high',
                                styler: styler.frozen,
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
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
                const itemStyler = (params: AgRangeBarSeriesItemStylerParams<D, C>): AgRangeBarSeriesStyle => {
                    if (params.datum[params.xKey] === 'February') {
                        if (params.yLowKey === 'gain_low') {
                            return { fill: 'gold', cornerRadius: 0 };
                        } else {
                            return { fill: 'grey', cornerRadius: 0 };
                        }
                    }
                    return {};
                };
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<AgCartesianChartOptions<D, C>>({
                        data,
                        series: [
                            {
                                type: 'range-bar',
                                xKey: 'month',
                                yName: 'Gain',
                                yLowKey: 'gain_low',
                                yHighKey: 'gain_high',
                                fill: 'lime', // ignored
                                cornerRadius: 45, // ignored only for February
                                itemStyler,
                                styler: styler.frozen,
                            },
                            {
                                type: 'range-bar',
                                xKey: 'month',
                                yName: 'Loss',
                                yLowKey: 'loss_low',
                                yHighKey: 'loss_high',
                                fill: 'olive', // ignored
                                stroke: 'navy', // not ignored
                                strokeWidth: 3, // not ignored
                                itemStyler,
                                styler: styler.frozen,
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
        });
        describe('gradient-pattern', () => {
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions({
                        data,
                        series: [
                            {
                                type: 'range-bar',
                                xKey: 'month',
                                yName: 'Gain',
                                yLowKey: 'gain_low',
                                yHighKey: 'gain_high',
                                styler: () => {
                                    return { fill: { type: 'gradient' } };
                                },
                            },
                            {
                                type: 'range-bar',
                                xKey: 'month',
                                yName: 'Loss',
                                yLowKey: 'loss_low',
                                yHighKey: 'loss_high',
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
                await compare();
            });
        });
        describe('stroke-strokeWidth-defaults', () => {
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions({
                        data,
                        series: [
                            {
                                type: 'range-bar',
                                xKey: 'month',
                                yName: 'Gain',
                                yLowKey: 'gain_low',
                                yHighKey: 'gain_high',
                                styler: () => {
                                    // check that default `strokeWidth: 2` is resolved.
                                    return { stroke: 'lime' };
                                },
                            },
                            {
                                type: 'range-bar',
                                xKey: 'month',
                                yName: 'Loss',
                                yLowKey: 'loss_low',
                                yHighKey: 'loss_high',
                                styler: () => {
                                    // check that theme-default `stroke` is resolved.
                                    return { strokeWidth: 4 };
                                },
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
        });
        describe('highlights', () => {
            // Manual-test version available at range-bar-series-test#styler-highlight-state
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions({
                        data,
                        series: [
                            {
                                type: 'range-bar',
                                xKey: 'month',
                                yName: 'Gain',
                                yLowKey: 'gain_low',
                                yHighKey: 'gain_high',
                                styler: styler.frozen,
                                grouped: false,
                            },
                            {
                                type: 'range-bar',
                                xKey: 'month',
                                yName: 'Loss',
                                yLowKey: 'loss_low',
                                yHighKey: 'loss_high',
                                styler: styler.frozen,
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });

            const miss = { x: 100, y: 100 } as const;
            const series0datum0 = { x: 178, y: 287 } as const;
            const series0datum2 = { x: 660, y: 75 } as const;
            const series1datum0 = { x: 178, y: 450 } as const;
            const legendItem0 = { x: 375, y: 572 } as const;
            const legendItem1 = { x: 440, y: 572 } as const;

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
        it('should render range-bar series with segmentation styling on x-axis', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { category: 'A', high: 100, low: 50 },
                    { category: 'B', high: 150, low: 80 },
                    { category: 'C', high: 120, low: 60 },
                    { category: 'D', high: 180, low: 110 },
                    { category: 'E', high: 200, low: 130 },
                ],
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'category',
                        yLowKey: 'low',
                        yHighKey: 'high',
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
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const imageData = extractImageData(ctx);
            expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('should render range-bar series with segmentation styling on y-axis', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 0, high: 100, low: 50 },
                    { x: 1, high: 180, low: 120 },
                    { x: 2, high: 150, low: 90 },
                    { x: 3, high: 220, low: 160 },
                    { x: 4, high: 250, low: 180 },
                ],
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        segmentation: {
                            key: 'y',
                            segments: [
                                {
                                    start: 50,
                                    stop: 150,
                                    fill: 'rgba(255, 165, 0, 0.3)',
                                    stroke: 'orange',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 150,
                                    stop: 200,
                                    fill: 'rgba(128, 0, 128, 0.3)',
                                    stroke: 'purple',
                                    strokeWidth: 3,
                                },
                                { start: 200, fill: 'rgba(0, 255, 255, 0.3)', stroke: 'cyan', strokeWidth: 4 },
                            ],
                        },
                    },
                ],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const imageData = extractImageData(ctx);
            expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('should render horizontal range-bar series with segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { category: 'A', high: 100, low: 50 },
                    { category: 'B', high: 150, low: 80 },
                    { category: 'C', high: 120, low: 60 },
                    { category: 'D', high: 180, low: 110 },
                ],
                series: [
                    {
                        type: 'range-bar',
                        direction: 'horizontal',
                        xKey: 'category',
                        yLowKey: 'low',
                        yHighKey: 'high',
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
                axes: {
                    y: { type: 'category', position: 'left' },
                    x: { type: 'number', position: 'bottom' },
                },
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const imageData = extractImageData(ctx);
            expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('should render grouped range-bar series with segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { category: 'Q1', high1: 100, low1: 50, high2: 80, low2: 40 },
                    { category: 'Q2', high1: 150, low1: 80, high2: 120, low2: 70 },
                    { category: 'Q3', high1: 120, low1: 60, high2: 140, low2: 90 },
                    { category: 'Q4', high1: 180, low1: 110, high2: 160, low2: 100 },
                ],
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'category',
                        yLowKey: 'low1',
                        yHighKey: 'high1',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'Q1',
                                    stop: 'Q2',
                                    fill: 'rgba(255, 0, 0, 0.3)',
                                    stroke: 'red',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 'Q3',
                                    stop: 'Q3',
                                    fill: 'rgba(0, 0, 255, 0.3)',
                                    stroke: 'blue',
                                    strokeWidth: 3,
                                },
                                { start: 'Q4', fill: 'rgba(0, 255, 0, 0.3)', stroke: 'green', strokeWidth: 2 },
                            ],
                        },
                    },
                    {
                        type: 'range-bar',
                        xKey: 'category',
                        yLowKey: 'low2',
                        yHighKey: 'high2',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'Q1',
                                    stop: 'Q2',
                                    fill: 'rgba(255, 165, 0, 0.3)',
                                    stroke: 'orange',
                                    strokeWidth: 2,
                                },
                                { start: 'Q3', fill: 'rgba(128, 0, 128, 0.3)', stroke: 'purple', strokeWidth: 3 },
                            ],
                        },
                    },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const imageData = extractImageData(ctx);
            expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('should render range-bar series with pattern fill segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { category: 'A', high: 100, low: 50 },
                    { category: 'B', high: 150, low: 80 },
                    { category: 'C', high: 120, low: 60 },
                    { category: 'D', high: 180, low: 110 },
                ],
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'category',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'A',
                                    stop: 'A',
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'vertical-lines',
                                        strokeWidth: 3,
                                    },
                                    stroke: '#ff6b6b',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 'B',
                                    stop: 'B',
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'horizontal-lines',
                                        stroke: '#4ecdc4',
                                        strokeWidth: 2,
                                    },
                                    stroke: '#4ecdc4',
                                    strokeWidth: 3,
                                },
                                {
                                    start: 'C',
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'forward-slanted-lines',
                                        strokeWidth: 2,
                                    },
                                    stroke: '#45b7d1',
                                    strokeWidth: 2,
                                },
                            ],
                        },
                    },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const imageData = extractImageData(ctx);
            expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('should render range-bar series with gradient fill segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 0, high: 100, low: 50 },
                    { x: 1, high: 150, low: 80 },
                    { x: 2, high: 120, low: 60 },
                    { x: 3, high: 180, low: 110 },
                    { x: 4, high: 200, low: 130 },
                ],
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: -1,
                                    stop: 2,
                                    fill: {
                                        type: 'gradient',
                                    },
                                    stroke: '#ff6b6b',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 2,
                                    stop: 4,
                                    fill: {
                                        type: 'gradient',
                                    },
                                    stroke: '#4ecdc4',
                                    strokeWidth: 3,
                                },
                                {
                                    start: 4,
                                    fill: {
                                        type: 'gradient',
                                    },
                                    stroke: '#45b7d1',
                                    strokeWidth: 2,
                                },
                            ],
                        },
                    },
                ],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const imageData = extractImageData(ctx);
            expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('should render range-bar series with time axis segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { date: new Date(2023, 0, 1), high: 1200, low: 800 },
                    { date: new Date(2023, 1, 1), high: 1500, low: 1000 },
                    { date: new Date(2023, 2, 1), high: 1100, low: 700 },
                    { date: new Date(2023, 3, 1), high: 1800, low: 1200 },
                    { date: new Date(2023, 4, 1), high: 2000, low: 1400 },
                ],
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'date',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: new Date(2023, 0, 1),
                                    stop: new Date(2023, 2, 1),
                                    fill: 'rgba(255, 0, 0, 0.3)',
                                    stroke: 'red',
                                    strokeWidth: 2,
                                },
                                {
                                    start: new Date(2023, 2, 1),
                                    fill: 'rgba(0, 255, 0, 0.3)',
                                    stroke: 'green',
                                    strokeWidth: 3,
                                },
                            ],
                        },
                    },
                ],
                axes: {
                    x: { type: 'time', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const imageData = extractImageData(ctx);
            expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });
    });

    describe('AG-15743 legendItemName', () => {
        testLegendItemName({
            create: (o) => (chart = AgCharts.create(prepareEnterpriseTestOptions(o))),
            compare,
            chartOptions: {
                data: [
                    { x: 'West', s1L: 0, s1H: 1, s2L: 2, s2H: 3, s3L: 4, s3H: 5 },
                    { x: 'East', s1L: 0, s1H: 1, s2L: 2, s2H: 3, s3L: 4, s3H: 5 },
                ],
                series: [
                    { type: 'range-bar', xKey: 'x', yLowKey: 's1L', yHighKey: 's1H', yName: 'series 1' },
                    { type: 'range-bar', xKey: 'x', yLowKey: 's2L', yHighKey: 's2H', yName: 'series 2' },
                    { type: 'range-bar', xKey: 'x', yLowKey: 's3L', yHighKey: 's3H', yName: 'series 3' },
                ],
            },
        });
    });

    describe('null category key', () => {
        const RANGE_BAR_NULL_CATEGORY_KEY_DATA = [
            { month: 'Jan', high: 9.2, low: -4.5 },
            { month: null, high: 11.6, low: -3.7 },
            { month: 'Mar', high: 14.8, low: 0.5 },
        ];

        const RANGE_BAR_NULL_CATEGORY_KEY_OPTIONS: AgChartOptions = {
            data: RANGE_BAR_NULL_CATEGORY_KEY_DATA,
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'range-bar',
                    xKey: 'month',
                    yLowKey: 'low',
                    yHighKey: 'high',
                },
            ],
        };

        it('should reject null category key with warning', async () => {
            const options: AgChartOptions = { ...RANGE_BAR_NULL_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [RangeBarSeries-1 / xValue] ignored:",
    "[null]",
  ],
]
`);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...RANGE_BAR_NULL_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...RANGE_BAR_NULL_CATEGORY_KEY_OPTIONS.series![0],
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });
    });
});
