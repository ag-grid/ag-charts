import { afterEach, describe, expect, it } from '@jest/globals';

import {
    type AgCartesianChartOptions,
    type AgChartOptions,
    AgCharts,
    type AgWaterfallSeriesLabelPlacement,
    type AgWaterfallSeriesOptions,
    type WaterfallSeriesTotalMeta,
} from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    expectWarningsCalls,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('WaterfallSeries', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const TOTALS_META_DATA: WaterfallSeriesTotalMeta[] = [
        { totalType: 'subtotal', index: 2, axisLabel: 'Subtotal 1' },
        { totalType: 'subtotal', index: 5, axisLabel: 'Subtotal 2' },
        { totalType: 'subtotal', index: 7, axisLabel: 'Subtotal 3' },
        { totalType: 'total', index: 8, axisLabel: 'Total' },
    ];

    const CONTINUOUS_DATA = [
        { year: new Date(2020, 0, 1), spending: 10 },
        { year: new Date(2021, 0, 1), spending: 20 },
        { year: new Date(2022, 0, 1), spending: 30 },
        { year: new Date(2024, 0, 1), spending: -20 },
        { year: new Date(2025, 0, 1), spending: -30 },
        { year: new Date(2026, 0, 1), spending: 40 },
        { year: new Date(2028, 0, 1), spending: -30 },
        { year: new Date(2029, 0, 1), spending: 40 },
        { year: new Date(2030, 0, 1), spending: 50 },
    ];

    const DATA_WITH_MISSING_INVALID_VALUES = [
        { year: '2020', spending: 10 },
        { year: '2021' },
        { year: '2022', spending: 30 },
        { year: '2024', spending: -80 },
        { year: '2025', spending: '-30' },
        { year: '2026', spending: 40 },
        { year: '2028', spending: -30 },
        { year: '2029', spending: 40 },
        { year: '2031', spending: [50] },
    ];

    const WATERFALL_COLUMN_OPTIONS: AgCartesianChartOptions = {
        data: [
            { year: '2020', spending: 10 },
            { year: '2021', spending: 20 },
            { year: '2022', spending: 30 },
            { year: '2023', spending: -20 },
            { year: '2024', spending: -30 },
            { year: '2025', spending: 40 },
            { year: '2026', spending: -30 },
            { year: '2027', spending: 40 },
            { year: '2028', spending: 50 },
        ],
        series: [
            {
                type: 'waterfall',
                xKey: 'year',
                yKey: 'spending',
                item: {
                    total: {
                        label: {
                            enabled: true,
                            placement: 'inside-center',
                        },
                    },
                    positive: {
                        label: {
                            enabled: true,
                            placement: 'inside-center',
                        },
                        fill: '#91CC75',
                        name: 'Revenue',
                    },
                    negative: {
                        label: {
                            enabled: true,
                            placement: 'inside-center',
                        },
                        fill: '#D21E75',
                        name: 'Product Cost',
                    },
                },
            },
        ],
        legend: {
            enabled: true,
        },
    };

    const compare = async (options = IMAGE_SNAPSHOT_DEFAULTS) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(options);
    };

    function switchSeriesType<T extends AgChartOptions>(opts: T, direction: 'horizontal' | 'vertical'): T {
        return {
            ...opts,
            series: opts['series']?.map((s) => ({
                ...s,
                direction,
            })),
        };
    }

    it(`should render a waterfall chart as expected`, async () => {
        const options: AgChartOptions = { ...WATERFALL_COLUMN_OPTIONS };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal waterfall chart as expected`, async () => {
        const options: AgChartOptions = { ...switchSeriesType(WATERFALL_COLUMN_OPTIONS, 'horizontal') };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a waterfall chart with total and subtotal columns`, async () => {
        const WATERFALL_COLUMN_SERIES_OPTIONS = WATERFALL_COLUMN_OPTIONS.series! as AgWaterfallSeriesOptions[];
        const options: AgCartesianChartOptions = {
            ...WATERFALL_COLUMN_OPTIONS,
            series: [{ ...WATERFALL_COLUMN_SERIES_OPTIONS[0], totals: TOTALS_META_DATA }],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a waterfall chart with corner radius`, async () => {
        const options: AgChartOptions = {
            theme: {
                overrides: {
                    waterfall: {
                        series: {
                            item: {
                                positive: {
                                    cornerRadius: 10,
                                },
                                negative: {
                                    cornerRadius: 10,
                                },
                                total: {
                                    cornerRadius: 10,
                                },
                            },
                        },
                    },
                },
            },
            ...WATERFALL_COLUMN_OPTIONS,
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a waterfall chart with a time x-axis`, async () => {
        const options: AgChartOptions = {
            ...WATERFALL_COLUMN_OPTIONS,
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

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a waterfall chart with a reversed time x-axis`, async () => {
        const options: AgChartOptions = {
            ...WATERFALL_COLUMN_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: {
                x: {
                    position: 'left',
                    type: 'number',
                },
                y: {
                    position: 'bottom',
                    type: 'time',
                    reverse: true,
                    nice: false,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal waterfall chart with a time y-axis`, async () => {
        const options: AgChartOptions = {
            ...switchSeriesType(WATERFALL_COLUMN_OPTIONS, 'horizontal'),
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

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal waterfall chart with a reversed time y-axis`, async () => {
        const options: AgChartOptions = {
            ...switchSeriesType(WATERFALL_COLUMN_OPTIONS, 'horizontal'),
            data: CONTINUOUS_DATA,
            axes: {
                x: {
                    position: 'bottom',
                    type: 'number',
                },
                y: {
                    position: 'left',
                    type: 'time',
                    reverse: true,
                    nice: false,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a waterfall chart with reversed axes`, async () => {
        const WATERFALL_COLUMN_SERIES_OPTIONS = WATERFALL_COLUMN_OPTIONS.series as AgWaterfallSeriesOptions[];
        const options: AgChartOptions = {
            ...WATERFALL_COLUMN_OPTIONS,
            series: [{ ...WATERFALL_COLUMN_SERIES_OPTIONS[0], totals: TOTALS_META_DATA }],
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

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal waterfall chart with reversed axes`, async () => {
        const WATERFALL_BAR_OPTIONS = switchSeriesType(WATERFALL_COLUMN_OPTIONS, 'horizontal');
        const WATERFALL_BAR_SERIES_OPTIONS = WATERFALL_BAR_OPTIONS.series?.[0] as AgWaterfallSeriesOptions;
        const options: AgChartOptions = {
            ...WATERFALL_BAR_OPTIONS,
            series: [{ ...WATERFALL_BAR_SERIES_OPTIONS, totals: TOTALS_META_DATA }],
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

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a horizontal waterfall chart with total and subtotal bars`, async () => {
        const WATERFALL_BAR_OPTIONS = switchSeriesType(WATERFALL_COLUMN_OPTIONS, 'horizontal');
        const WATERFALL_BAR_SERIES_OPTIONS = WATERFALL_BAR_OPTIONS.series?.[0] as AgWaterfallSeriesOptions;
        const options: AgChartOptions = {
            ...WATERFALL_BAR_OPTIONS,
            series: [{ ...WATERFALL_BAR_SERIES_OPTIONS, totals: TOTALS_META_DATA }],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a waterfall chart with missing and invalid values`, async () => {
        const WATERFALL_COLUMN_SERIES_OPTIONS = WATERFALL_COLUMN_OPTIONS.series as AgWaterfallSeriesOptions[];
        const options: AgChartOptions = {
            ...WATERFALL_COLUMN_OPTIONS,
            data: DATA_WITH_MISSING_INVALID_VALUES,
            series: [{ ...WATERFALL_COLUMN_SERIES_OPTIONS[0], totals: TOTALS_META_DATA }],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();

        expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [string] for [WaterfallSeries-1 / yRaw] ignored:",
    "[-30]",
  ],
  [
    "AG Charts - invalid value of type [object] for [WaterfallSeries-1 / yRaw] ignored:",
    "[50]",
  ],
]
`);
    });

    it(`should render a horizontal waterfall chart with missing and invalid values`, async () => {
        const WATERFALL_BAR_OPTIONS = switchSeriesType(WATERFALL_COLUMN_OPTIONS, 'horizontal');
        const WATERFALL_BAR_SERIES_OPTIONS = WATERFALL_BAR_OPTIONS.series?.[0] as AgWaterfallSeriesOptions;
        const options: AgChartOptions = {
            ...WATERFALL_BAR_OPTIONS,
            data: DATA_WITH_MISSING_INVALID_VALUES,
            series: [{ ...WATERFALL_BAR_SERIES_OPTIONS, totals: TOTALS_META_DATA }],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();

        expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [string] for [WaterfallSeries-1 / yRaw] ignored:",
    "[-30]",
  ],
  [
    "AG Charts - invalid value of type [object] for [WaterfallSeries-1 / yRaw] ignored:",
    "[50]",
  ],
]
`);
    });

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for WATERFALL_COLUMN_OPTIONS should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = { ...WATERFALL_COLUMN_OPTIONS };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await compare();
            });

            it(`for horizontal WATERFALL_COLUMN_OPTIONS should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = { ...switchSeriesType(WATERFALL_COLUMN_OPTIONS, 'horizontal') };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('gradient fill', () => {
        it('should render waterfall series with a default gradient fill', async () => {
            const options = {
                ...WATERFALL_COLUMN_OPTIONS,
                series: [
                    {
                        ...WATERFALL_COLUMN_OPTIONS.series![0],
                        item: {
                            positive: {
                                fill: {
                                    type: 'gradient',
                                },
                            },
                            negative: {
                                fill: {
                                    type: 'gradient',
                                },
                            },
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options as any);
            await compare();
        });

        it('should render waterfall series with a gradient fill', async () => {
            const options = {
                ...WATERFALL_COLUMN_OPTIONS,
                series: [
                    {
                        ...WATERFALL_COLUMN_OPTIONS.series![0],
                        item: {
                            positive: {
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
                            negative: {
                                fill: {
                                    type: 'gradient',
                                    colorStops: [
                                        {
                                            color: 'red',
                                        },
                                        {
                                            color: 'white',
                                        },
                                    ],
                                },
                            },
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options as any);
            await compare();
        });
    });

    describe('AG-8290', () => {
        async function testCase(
            labelOpts: { placement: AgWaterfallSeriesLabelPlacement; padding?: number; spacing?: number },
            name: string
        ) {
            chart = AgCharts.create(
                prepareEnterpriseTestOptions({
                    data: [
                        { x: 'A', y: 185 },
                        { x: 'B', y: 145 },
                        { x: 'C', y: 134 },
                        { x: 'D', y: 55 },
                        { x: 'E', y: 34 },
                        { x: 'F', y: -155 },
                        { x: 'G', y: -112 },
                        { x: 'H', y: -165 },
                        { x: 'I', y: -163 },
                        { x: 'J', y: -91 },
                    ],
                    series: [
                        {
                            type: 'waterfall',
                            xKey: 'x',
                            yKey: 'y',
                            item: {
                                positive: { label: { ...labelOpts } },
                                negative: { label: { ...labelOpts } },
                                total: { label: { ...labelOpts } },
                            },
                            totals: [
                                { totalType: 'subtotal', index: 4, axisLabel: 'ABCDE' },
                                { totalType: 'subtotal', index: 9, axisLabel: 'FGHIJ' },
                                { totalType: 'total', index: 9, axisLabel: 'Total' },
                            ],
                        },
                    ],
                })
            );
            await compare({ failureThreshold: 0, failureThresholdType: 'percent', customSnapshotIdentifier: name });
        }
        describe('padding backward compatibility', () => {
            test('inside-start', async () => {
                await testCase(
                    { placement: 'inside-start', padding: 30 },
                    'AG-8290-waterfall-label-spacing-inside-start'
                );
            });
            test('inside-end', async () => {
                await testCase({ placement: 'inside-end', padding: 30 }, 'AG-8290-waterfall-label-spacing-inside-end');
            });
            test('outside-start', async () => {
                await testCase(
                    { placement: 'outside-start', padding: 30 },
                    'AG-8290-waterfall-label-spacing-outside-start'
                );
            });
            test('outside-end', async () => {
                await testCase(
                    { placement: 'outside-end', padding: 30 },
                    'AG-8290-waterfall-label-spacing-outside-end'
                );
            });
        });
        describe('spacing backward compatibility', () => {
            test('inside-start', async () => {
                await testCase(
                    { placement: 'inside-start', spacing: 30 },
                    'AG-8290-waterfall-label-spacing-inside-start'
                );
            });
            test('inside-end', async () => {
                await testCase({ placement: 'inside-end', spacing: 30 }, 'AG-8290-waterfall-label-spacing-inside-end');
            });
            test('outside-start', async () => {
                await testCase(
                    { placement: 'outside-start', spacing: 30 },
                    'AG-8290-waterfall-label-spacing-outside-start'
                );
            });
            test('outside-end', async () => {
                await testCase(
                    { placement: 'outside-end', spacing: 30 },
                    'AG-8290-waterfall-label-spacing-outside-end'
                );
            });
        });
    });

    describe('itemStyler', () => {
        it('complex fills', async () => {
            const options = {
                ...WATERFALL_COLUMN_OPTIONS,
                series: [
                    {
                        ...WATERFALL_COLUMN_OPTIONS.series![0],
                        item: {
                            positive: {
                                itemStyler: () => {
                                    return { fill: { type: 'gradient' } };
                                },
                            },
                            negative: {
                                itemStyler: () => {
                                    return { fill: { type: 'pattern' } };
                                },
                            },
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options as any);
            await compare();
        });
    });
});
