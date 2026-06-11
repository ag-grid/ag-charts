import { afterEach, describe, expect, it } from 'vitest';

import {
    type AgCartesianChartOptions,
    type AgChartOptions,
    AgCharts,
    type AgWaterfallSeriesLabelPlacement,
    type AgWaterfallSeriesOptions,
    type WaterfallSeriesTotalMeta,
} from 'ag-charts-community';
import {
    BIG,
    IMAGE_SNAPSHOT_DEFAULTS,
    NEG_BIG,
    deproxy,
    expectPixelIdenticalAcrossMagnitude,
    expectWarningsCalls,
    extractImageData,
    hoverAction,
    magnitudePair,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    stripAxes,
    waitForChartStability,
} from 'ag-charts-community-test';

import { createEnterpriseChart, prepareEnterpriseTestOptions, renderEnterpriseChartImage } from '../../test/utils';
import type { WaterfallSeries } from './waterfallSeries';

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

    it('preserves bigint value precision in the data label and formatter callback (AG-16608)', async () => {
        // The raw value must reach the label text and label-formatter `value` un-narrowed; a bigint
        // beyond 2^53 would otherwise be float64-rounded in both.
        const BIG_VALUE = 9_007_199_254_740_993n; // Number()-rounds to ...992
        let captured: unknown;
        const options: AgCartesianChartOptions = {
            data: [{ type: 'Revenue', value: BIG_VALUE }],
            series: [
                {
                    type: 'waterfall',
                    xKey: 'type',
                    yKey: 'value',
                    item: {
                        positive: {
                            label: {
                                enabled: true,
                                formatter: (params: any) => {
                                    captured = params.value;
                                    return String(params.value);
                                },
                            },
                        },
                    },
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);

        expect(typeof captured).toBe('bigint');
        expect(captured).toBe(BIG_VALUE);
    });

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

    describe('null category key', () => {
        const WATERFALL_NULL_CATEGORY_KEY_DATA = [
            { year: '2020', spending: 10 },
            { year: null, spending: 20 },
            { year: '2022', spending: -15 },
        ];

        const WATERFALL_NULL_CATEGORY_KEY_OPTIONS: AgCartesianChartOptions = {
            data: WATERFALL_NULL_CATEGORY_KEY_DATA,
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'waterfall',
                    xKey: 'year',
                    yKey: 'spending',
                },
            ],
        };

        it('should reject null category key with warning', async () => {
            const options: AgChartOptions = { ...WATERFALL_NULL_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [WaterfallSeries-1 / xValue] ignored:",
    "[null]",
  ],
]
`);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...WATERFALL_NULL_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...WATERFALL_NULL_CATEGORY_KEY_OPTIONS.series![0],
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

    describe('undefined category key', () => {
        const WATERFALL_UNDEFINED_CATEGORY_KEY_DATA = [
            { year: '2020', spending: 10 },
            { year: undefined, spending: 20 },
            { year: '2022', spending: -15 },
        ];

        const WATERFALL_NULL_AND_UNDEFINED_KEYS_DATA = [
            { year: '2020', spending: 10 },
            { year: null, spending: 15 },
            { year: undefined, spending: 5 },
            { year: '2023', spending: -10 },
        ];

        const WATERFALL_UNDEFINED_CATEGORY_KEY_OPTIONS: AgCartesianChartOptions = {
            data: WATERFALL_UNDEFINED_CATEGORY_KEY_DATA,
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'waterfall',
                    xKey: 'year',
                    yKey: 'spending',
                },
            ],
        };

        const WATERFALL_NULL_AND_UNDEFINED_KEYS_OPTIONS: AgCartesianChartOptions = {
            data: WATERFALL_NULL_AND_UNDEFINED_KEYS_DATA,
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'waterfall',
                    xKey: 'year',
                    yKey: 'spending',
                },
            ],
        };

        it('should reject undefined category key with warning', async () => {
            const options: AgChartOptions = { ...WATERFALL_UNDEFINED_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [WaterfallSeries-1 / xValue] ignored:",
    "[undefined]",
  ],
]
`);
            await compare();
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...WATERFALL_UNDEFINED_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...WATERFALL_UNDEFINED_CATEGORY_KEY_OPTIONS.series![0],
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

        it('should treat null and undefined as distinct categories when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...WATERFALL_NULL_AND_UNDEFINED_KEYS_OPTIONS,
                series: [
                    {
                        ...WATERFALL_NULL_AND_UNDEFINED_KEYS_OPTIONS.series![0],
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

    describe('CRT-1049: tooltip content for subtotal and total nodes', () => {
        const WATERFALL_TOTALS_OPTIONS: AgCartesianChartOptions = {
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
                    totals: [
                        { totalType: 'subtotal', index: 2, axisLabel: 'Subtotal 1' },
                        { totalType: 'subtotal', index: 5, axisLabel: 'Subtotal 2' },
                        { totalType: 'total', index: 8, axisLabel: 'Total' },
                    ],
                },
            ],
        };

        it('should return valid tooltip content for subtotal nodes', async () => {
            const options = { ...WATERFALL_TOTALS_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const series = chart.series[0] as WaterfallSeries;

            // Index 3 is the first subtotal (after data indices 0, 1, 2)
            const subtotalContent = series.getTooltipContent(3);
            expect(subtotalContent).toBeDefined();
            expect(subtotalContent?.type).toBe('structured');
            if (subtotalContent?.type === 'structured') {
                expect(subtotalContent.data?.[0].missing).not.toBe(true);
            }
        });

        it('should return valid tooltip content for total nodes', async () => {
            const options = { ...WATERFALL_TOTALS_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const series = chart.series[0] as WaterfallSeries;

            // Last index is the total node
            const nodeData = series['contextNodeData']?.nodeData;
            const totalIndex = nodeData ? nodeData.length - 1 : -1;
            const totalContent = series.getTooltipContent(totalIndex);
            expect(totalContent).toBeDefined();
            expect(totalContent?.type).toBe('structured');
            if (totalContent?.type === 'structured') {
                expect(totalContent.data?.[0].missing).not.toBe(true);
            }
        });

        it('should return valid tooltip content for regular data nodes', async () => {
            const options = { ...WATERFALL_TOTALS_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const series = chart.series[0] as WaterfallSeries;

            // Index 0 is the first regular data node
            const regularContent = series.getTooltipContent(0);
            expect(regularContent).toBeDefined();
            expect(regularContent?.type).toBe('structured');
            if (regularContent?.type === 'structured') {
                expect(regularContent.data?.[0].missing).not.toBe(true);
            }
        });

        it('should return non-missing tooltip content for all node types in sequence', async () => {
            const options = { ...WATERFALL_TOTALS_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const series = chart.series[0] as WaterfallSeries;
            const nodeData = series['contextNodeData']?.nodeData;
            expect(nodeData).toBeDefined();

            // Verify every node returns non-missing tooltip content
            for (let i = 0; i < nodeData!.length; i++) {
                const content = series.getTooltipContent(i);
                expect(content).toBeDefined();
                expect(content?.type).toBe('structured');
                if (content?.type === 'structured') {
                    expect(content.data?.[0].missing).not.toBe(true);
                }
            }
        });
    });

    describe('AG-17059: item-level tooltip.renderer', () => {
        const TOTALS_OPTIONS: AgCartesianChartOptions = {
            data: [
                { year: '2020', spending: 10 },
                { year: '2021', spending: -20 },
                { year: '2022', spending: 30 },
                { year: '2023', spending: 40 },
            ],
            series: [
                {
                    type: 'waterfall',
                    xKey: 'year',
                    yKey: 'spending',
                    totals: [{ totalType: 'subtotal', index: 1, axisLabel: 'Subtotal' }],
                },
            ],
        };

        async function hoverDatum(datumIndex: number): Promise<string> {
            const series = chart.series[0] as WaterfallSeries;
            const nodeData = series['contextNodeData']?.nodeData;
            const datum = nodeData?.[datumIndex];
            expect(datum).toBeDefined();
            const cx = datum!.x + datum!.width / 2;
            const cy = datum!.y + datum!.height / 2;
            await hoverAction(cx, cy)(chart);
            await waitForChartStability(chart);
            const el = chart.ctx.agDocument.body.getElementsByClassName('ag-charts-tooltip')[0] as
                | HTMLElement
                | undefined;
            const html = el?.innerHTML ?? '';
            expect(html).not.toBe('');
            return html;
        }

        it('invokes item.positive.tooltip.renderer for positive datums', async () => {
            const options: AgCartesianChartOptions = {
                ...TOTALS_OPTIONS,
                series: [
                    {
                        ...(TOTALS_OPTIONS.series![0] as AgWaterfallSeriesOptions),
                        item: { positive: { tooltip: { renderer: () => 'POSITIVE-ITEM' } } },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expect(await hoverDatum(0)).toContain('POSITIVE-ITEM');
            expect(await hoverDatum(1)).not.toContain('POSITIVE-ITEM');
        });

        it('item-level renderer overrides series-level renderer when both are set', async () => {
            const options: AgCartesianChartOptions = {
                ...TOTALS_OPTIONS,
                series: [
                    {
                        ...(TOTALS_OPTIONS.series![0] as AgWaterfallSeriesOptions),
                        tooltip: { renderer: () => 'SERIES-LEVEL' },
                        item: { positive: { tooltip: { renderer: () => 'ITEM-LEVEL' } } },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const positiveHtml = await hoverDatum(0);
            expect(positiveHtml).toContain('ITEM-LEVEL');
            expect(positiveHtml).not.toContain('SERIES-LEVEL');

            expect(await hoverDatum(1)).toContain('SERIES-LEVEL');
        });

        it('subtotal datums use item.total.tooltip.renderer', async () => {
            const options: AgCartesianChartOptions = {
                ...TOTALS_OPTIONS,
                series: [
                    {
                        ...(TOTALS_OPTIONS.series![0] as AgWaterfallSeriesOptions),
                        item: { total: { tooltip: { renderer: () => 'TOTAL-ITEM' } } },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expect(await hoverDatum(2)).toContain('TOTAL-ITEM');
            expect(await hoverDatum(0)).not.toContain('TOTAL-ITEM');
        });

        it('AG-10316 item-level renderer returning undefined falls through to default tooltip content', async () => {
            const options: AgCartesianChartOptions = {
                ...TOTALS_OPTIONS,
                series: [
                    {
                        ...(TOTALS_OPTIONS.series![0] as AgWaterfallSeriesOptions),
                        yName: 'Spending',
                        item: { positive: { tooltip: { renderer: () => undefined } } },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            // Returning undefined must fall through to the default structured tooltip
            // rather than rendering literal "undefined".
            const html = await hoverDatum(0);
            expect(html).not.toContain('undefined');
            expect(html).toContain('Spending');
        });
    });

    describe('AG-17484: synthetic datum and original-index itemId for total/subtotal bars', () => {
        // Augmented order [2020, 2021, Sub, 2022, 2023, Total]: the synthetic subtotal/total consume
        // index slots, so real bars 2022/2023 sit at datumIndex 3/4 while their original indices stay 2/3.
        const DATA = [
            { year: '2020', spending: 10 },
            { year: '2021', spending: -20 },
            { year: '2022', spending: 30 },
            { year: '2023', spending: 40 },
        ];
        const TOTALS_OPTIONS: AgCartesianChartOptions = {
            data: DATA,
            series: [
                {
                    type: 'waterfall',
                    xKey: 'year',
                    yKey: 'spending',
                    totals: [
                        { totalType: 'subtotal', index: 1, axisLabel: 'Subtotal' },
                        { totalType: 'total', index: 3, axisLabel: 'Total' },
                    ],
                },
            ],
        };

        const createWaterfall = async (series: AgWaterfallSeriesOptions) => {
            const options: AgCartesianChartOptions = { ...TOTALS_OPTIONS, series: [series] };
            prepareEnterpriseTestOptions(options as any);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            return chart.series[0] as WaterfallSeries;
        };

        const getNodeData = (series: WaterfallSeries) => {
            const nodeData = series['contextNodeData']?.nodeData as
                | { itemType: string; datum: unknown; datumIndex: number; itemId?: string }[]
                | undefined;
            expect(nodeData).toBeDefined();
            return nodeData!;
        };

        it('AC1/AC3: tooltip.renderer receives datum=undefined for total/subtotal and the original datum for real bars', async () => {
            const params: Record<string, any> = {};
            const series = await createWaterfall({
                ...(TOTALS_OPTIONS.series![0] as AgWaterfallSeriesOptions),
                item: {
                    positive: { tooltip: { renderer: (p) => ((params.positive = p), 'P') } },
                    negative: { tooltip: { renderer: (p) => ((params.negative = p), 'N') } },
                    total: { tooltip: { renderer: (p) => ((params[p.itemType] = p), 'T') } },
                },
            });
            const nodeData = getNodeData(series);

            const indexOfType = (itemType: string) => nodeData.findIndex((n) => n.itemType === itemType);
            series.getTooltipContent(indexOfType('positive'));
            series.getTooltipContent(indexOfType('negative'));
            series.getTooltipContent(indexOfType('subtotal'));
            series.getTooltipContent(indexOfType('total'));

            expect(params.subtotal?.datum).toBeUndefined();
            expect(params.subtotal?.itemType).toBe('subtotal');
            expect(params.total?.datum).toBeUndefined();
            expect(params.total?.itemType).toBe('total');
            expect(params.positive?.datum).toEqual(DATA[0]);
            expect(params.negative?.datum).toEqual(DATA[1]);

            // totalLabel exposes the synthetic bar's axisLabel and is undefined for real bars.
            expect(params.subtotal?.totalLabel).toBe('Subtotal');
            expect(params.total?.totalLabel).toBe('Total');
            expect(params.positive?.totalLabel).toBeUndefined();
            expect(params.negative?.totalLabel).toBeUndefined();
        });

        it('AC1/AC3/AC5: itemStyler receives datum=undefined for synthetic bars and the original datum for real bars', async () => {
            const calls: { itemType: string; datum: unknown; totalLabel: unknown }[] = [];
            const styler = (p: any) => (
                calls.push({ itemType: p.itemType, datum: p.datum, totalLabel: p.totalLabel }),
                {}
            );
            const series = await createWaterfall({
                ...(TOTALS_OPTIONS.series![0] as AgWaterfallSeriesOptions),
                item: {
                    positive: { itemStyler: styler },
                    negative: { itemStyler: styler },
                    total: { itemStyler: styler },
                },
            });
            getNodeData(series);

            const syntheticCalls = calls.filter((c) => c.itemType === 'total' || c.itemType === 'subtotal');
            const realCalls = calls.filter((c) => c.itemType === 'positive' || c.itemType === 'negative');
            expect(syntheticCalls.length).toBeGreaterThan(0);
            expect(realCalls.length).toBeGreaterThan(0);
            expect(syntheticCalls.every((c) => c.datum === undefined)).toBe(true);
            expect(realCalls.every((c) => c.datum != null && typeof c.datum === 'object')).toBe(true);

            // totalLabel: the synthetic bar's axisLabel, undefined for real bars.
            expect(calls.filter((c) => c.itemType === 'subtotal').every((c) => c.totalLabel === 'Subtotal')).toBe(true);
            expect(calls.filter((c) => c.itemType === 'total').every((c) => c.totalLabel === 'Total')).toBe(true);
            expect(realCalls.every((c) => c.totalLabel === undefined)).toBe(true);
        });

        it('AC2: node datum is undefined for synthetic bars and the original object for real bars', async () => {
            const series = await createWaterfall(TOTALS_OPTIONS.series![0] as AgWaterfallSeriesOptions);
            const nodeData = getNodeData(series);

            // The nodeClick/nodeDoubleClick/activeChange event payload is built directly from
            // `node.datum` (SeriesNodeEvent), so asserting it here covers those surfaces.
            const byType = (itemType: string) => nodeData.filter((n) => n.itemType === itemType);
            expect(byType('subtotal').every((n) => n.datum === undefined)).toBe(true);
            expect(byType('total').every((n) => n.datum === undefined)).toBe(true);
            expect(byType('positive')[0]?.datum).toEqual(DATA[0]);
        });

        it('AC6: real-bar itemId is the original data index and round-trips via findNodeDatum', async () => {
            const series = await createWaterfall(TOTALS_OPTIONS.series![0] as AgWaterfallSeriesOptions);
            const nodeData = getNodeData(series);

            // 2022 is a real bar after the subtotal: augmented datumIndex 3, original index 2.
            const shifted = nodeData.find((n) => n.datumIndex === 3)!;
            expect(shifted.itemType).toBe('positive');
            expect(shifted.itemId).toBe('2');
            // The public event itemId (getItemId → node.itemId when set) resolves back to this node.
            expect(series.findNodeDatum('2')).toBe(shifted);

            // Synthetic bars carry no original-data itemId and resolve via their numeric datumIndex.
            const subtotal = nodeData.find((n) => n.itemType === 'subtotal')!;
            expect(subtotal.itemId).toBeUndefined();
            expect(series.findNodeDatum(subtotal.datumIndex)).toBe(subtotal);
        });

        it('highlighting a synthetic bar invokes its itemStyler with highlighted-item', async () => {
            // The item-highlight overlay must render for synthetic bars even though their datum is
            // undefined, otherwise the styler only ever sees the base-layer unhighlighted-item state.
            const calls: { itemType: string; highlightState: string }[] = [];
            const styler = (p: any) => (calls.push({ itemType: p.itemType, highlightState: p.highlightState }), {});
            const series = await createWaterfall({
                ...(TOTALS_OPTIONS.series![0] as AgWaterfallSeriesOptions),
                item: {
                    positive: { itemStyler: styler },
                    negative: { itemStyler: styler },
                    total: { itemStyler: styler },
                },
            });
            const total = getNodeData(series).find((n) => n.itemType === 'total')!;

            calls.length = 0;
            chart.ctx.highlightManager.updateHighlight(chart.id, total);
            await waitForChartStability(chart);

            const totalStates = new Set(calls.filter((c) => c.itemType === 'total').map((c) => c.highlightState));
            expect(totalStates.has('highlighted-item')).toBe(true);
        });
    });

    describe('bigint values (AG-16608)', () => {
        it('renders a plain waterfall series with out-of-safe-range bigint values', async () => {
            expect(
                await renderEnterpriseChartImage(ctx, {
                    data: [
                        { x: 'a', amount: BIG },
                        { x: 'b', amount: NEG_BIG },
                        { x: 'c', amount: BIG * 2n },
                    ],
                    series: [{ type: 'waterfall', xKey: 'x', yKey: 'amount' }],
                    axes: { x: { type: 'category' }, y: { type: 'number' } },
                })
            ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });
    });

    describe('ISO datetime (AG-16654)', () => {
        it('renders a waterfall series with ISO-8601 datetime-string x values on a unit-time axis', async () => {
            expect(
                await renderEnterpriseChartImage(ctx, {
                    data: [
                        { time: '2024-01-15T09:00:00Z', amount: 12 },
                        { time: '2024-01-15T10:00:00Z', amount: -5 },
                        { time: '2024-01-15T11:00:00Z', amount: 8 },
                        { time: '2024-01-15T12:00:00Z', amount: -3 },
                    ],
                    series: [{ type: 'waterfall', xKey: 'time', yKey: 'amount' }],
                    axes: { x: { type: 'unit-time' }, y: { type: 'number' } },
                })
            ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });
    });

    describe('bigint magnitude invariance (AG-16608)', () => {
        const amounts = (values: number[]) => (toValue: (v: number) => number | bigint) =>
            values.map((amount, i) => ({ x: `c${i}`, amount: toValue(amount) }));

        it('positions a plain waterfall series identically when scaled beyond Number.MAX_VALUE', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createEnterpriseChart,
                magnitudePair(
                    {
                        series: [{ type: 'waterfall', xKey: 'x', yKey: 'amount' }],
                        axes: stripAxes({ x: { type: 'category' }, y: { type: 'number', nice: false } }),
                    },
                    amounts([3, -2, 4])
                )
            );
        });
    });
});
