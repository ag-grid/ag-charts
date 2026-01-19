import { afterEach, describe, expect, it } from '@jest/globals';

import {
    type AgCartesianChartOptions,
    type AgChartOptions,
    AgCharts,
    type AgRangeAreaSeriesLabelPlacement,
    type AgRangeAreaSeriesStyle,
    type AgRangeAreaSeriesStylerParams,
    type AgSeriesMarkerStyle,
    type AgSeriesMarkerStylerParams,
} from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    type MockRangeAreaStyler,
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

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('RangeAreaSeries', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();

    function lowAndHigh<T>(p: T): { low: T; high: T } {
        return { low: p, high: p };
    }

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const CATEGORY_DATA: { month: string | Date; high: number; low: number; average: number }[] = [
        {
            month: 'Jan',
            high: 9,
            low: 4,
            average: 6,
        },
        {
            month: 'Feb',
            high: 9,
            low: 4,
            average: 6,
        },
        {
            month: 'Mar',
            high: 11,
            low: 5,
            average: 8,
        },
        {
            month: 'Apr',
            high: 14,
            low: 7,
            average: 11,
        },
        {
            month: 'May',
            high: 17,
            low: 10,
            average: 14,
        },
        {
            month: 'June',
            high: 20,
            low: 13,
            average: 17,
        },
        {
            month: 'July',
            high: 23,
            low: 15,
            average: 19,
        },
        {
            month: 'Aug',
            high: 22,
            low: 15,
            average: 19,
        },
        {
            month: 'Sept',
            high: 19,
            low: 13,
            average: 16,
        },
        {
            month: 'Oct',
            high: 15,
            low: 10,
            average: 13,
        },
        {
            month: 'Nov',
            high: 11,
            low: 7,
            average: 9,
        },
        {
            month: 'Dec',
            high: 9,
            low: 5,
            average: 7,
        },
    ];
    const CONTINUOUS_DATA = CATEGORY_DATA.map(
        (datum: { month: string | Date; low: number; high: number; average: number }, i: number) => ({
            ...datum,
            month: new Date(2022, i, 15),
        })
    );

    const RANGE_AREA_OPTIONS: AgChartOptions = {
        data: CATEGORY_DATA,
        series: [
            {
                type: 'range-area',
                xKey: 'month',
                yLowKey: 'low',
                yHighKey: 'high',
                label: {
                    enabled: true,
                    formatter: ({ value }) => `${value}°C`,
                },
                fill: '#E7E8E9',
                item: lowAndHigh({
                    strokeWidth: 2,
                    stroke: '#2A5783',
                    marker: {
                        enabled: true,
                    },
                }),
            },
        ],
    };

    const compare = async (options = { ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 }) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(options);
    };

    it(`should render a range-area chart as expected`, async () => {
        const options: AgChartOptions = { ...RANGE_AREA_OPTIONS };
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-area chart with inverted high and low values`, async () => {
        const options: AgChartOptions = {
            ...RANGE_AREA_OPTIONS,
            data: CATEGORY_DATA.map((datum) => ({
                ...datum,
                low: datum.high,
                high: datum.low,
            })),
        };
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-area chart with some inverted high and low values`, async () => {
        const invertedDataIndices = [2, 5, 9];

        const options: AgChartOptions = {
            ...RANGE_AREA_OPTIONS,
            data: CATEGORY_DATA.map((datum, index) => ({
                ...datum,
                low: invertedDataIndices.includes(index) ? datum.high : datum.low,
                high: invertedDataIndices.includes(index) ? datum.low : datum.high,
            })),
        };
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-area chart with missing and invalid y values`, async () => {
        const invalidDataIndices = [2, 5, 9];
        const options: AgChartOptions = {
            ...RANGE_AREA_OPTIONS,
            data: CATEGORY_DATA.map((datum, index) => ({
                ...datum,
                low: invalidDataIndices.includes(index) ? `invalid` : datum.low,
                high: invalidDataIndices.includes(index) ? `invalid` : datum.high,
            })),
        };
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
        expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [string] for [RangeAreaSeries-1 / yLowValue] ignored:",
    "[invalid]",
  ],
  [
    "AG Charts - invalid value of type [string] for [RangeAreaSeries-1 / yHighValue] ignored:",
    "[invalid]",
  ],
]
`);
    });

    it(`should render a range-area chart with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...RANGE_AREA_OPTIONS,
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
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-area chart with a unit time x-axis`, async () => {
        const options: AgChartOptions = {
            ...RANGE_AREA_OPTIONS,
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
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-area chart with reversed unit time x-axis`, async () => {
        const options: AgChartOptions = {
            ...RANGE_AREA_OPTIONS,
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
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-area chart with a number x-axis`, async () => {
        const invalidDataIndices = [2, 5, 9];
        const options: AgChartOptions = {
            ...RANGE_AREA_OPTIONS,
            data: CONTINUOUS_DATA.map((datum, index) => ({
                ...datum,
                month: invalidDataIndices.includes(index) ? `invalid` : datum.month,
            })),
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
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
        expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [string] for [RangeAreaSeries-1 / xValue] ignored:",
    "[invalid]",
  ],
]
`);
    });

    it(`should render a range-area chart with reversed number x-axis`, async () => {
        const invalidDataIndices = [2, 5, 9];
        const options: AgChartOptions = {
            ...RANGE_AREA_OPTIONS,
            data: CONTINUOUS_DATA.map((datum, index) => ({
                ...datum,
                month: invalidDataIndices.includes(index) ? `invalid` : datum.month,
            })),
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
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
        expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [string] for [RangeAreaSeries-1 / xValue] ignored:",
    "[invalid]",
  ],
]
`);
    });

    it(`should render a range-area chart with missing and invalid x values`, async () => {
        const options: AgChartOptions = {
            ...RANGE_AREA_OPTIONS,
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
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render the legend shape as expected`, async () => {
        const options: AgChartOptions = {
            data: [
                { x: 'q1', fHi: 22, fLo: 18, gHi: 15, gLo: 14, kHi: 7, kLo: 4 },
                { x: 'q2', fHi: 24, fLo: 19, gHi: 18, gLo: 17, kHi: 11, kLo: 6 },
                { x: 'q3', fHi: 21, fLo: 18, gHi: 17, gLo: 16, kHi: 13, kLo: 7 },
                { x: 'q4', fHi: 20, fLo: 17, gHi: 14, gLo: 13, kHi: 9, kLo: 5 },
            ],
            series: [
                {
                    type: 'range-area',
                    xKey: 'x',
                    yHighKey: 'fHi',
                    yLowKey: 'fLo',
                    marker: { shape: 'cross', enabled: false }, // should draw a circle
                },
                {
                    type: 'range-area',
                    xKey: 'x',
                    yHighKey: 'gHi',
                    yLowKey: 'gLo',
                    marker: { shape: 'triangle', enabled: true },
                },
                {
                    type: 'range-area',
                    xKey: 'x',
                    yHighKey: 'kHi',
                    yLowKey: 'kLo',
                    marker: { shape: 'circle', enabled: true },
                },
            ],
        };
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
    });

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for RANGE_AREA_OPTIONS should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = { ...RANGE_AREA_OPTIONS };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('gradient fill', () => {
        it('should render range area series with a default gradient fill', async () => {
            const options = {
                ...RANGE_AREA_OPTIONS,
                series: [
                    {
                        type: 'range-area',
                        xKey: 'month',
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

        it('should render range area series with a gradient fill', async () => {
            const options = {
                ...RANGE_AREA_OPTIONS,
                series: [
                    {
                        type: 'range-area',
                        xKey: 'month',
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
            labelOpts: { placement: AgRangeAreaSeriesLabelPlacement; padding?: number; spacing?: number },
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
                    series: [{ type: 'range-area', xKey: 'x', yLowKey: 'yL', yHighKey: 'yH', label: { ...labelOpts } }],
                })
            );
            await compare({ failureThreshold: 0, failureThresholdType: 'percent', customSnapshotIdentifier: name });
        }
        describe('padding backward compatibility', () => {
            test('inside', async () => {
                await testCase({ placement: 'inside', padding: 30 }, 'AG-8290-range-area-label-spacing-inside');
            });
            test('outside', async () => {
                await testCase({ placement: 'outside', padding: 30 }, 'AG-8290-range-area-label-spacing-outside');
            });
        });
        describe('spacing backward compatibility', () => {
            test('inside', async () => {
                await testCase({ placement: 'inside', spacing: 30 }, 'AG-8290-range-area-label-spacing-inside');
            });
            test('outside', async () => {
                await testCase({ placement: 'outside', spacing: 30 }, 'AG-8290-range-area-label-spacing-outside');
            });
        });
    });

    describe('segmentation', () => {
        it('should render range-area series with segmentation styling on x-axis', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, high: 20, low: 10 },
                    { x: 1, high: 25, low: 15 },
                    { x: 2, high: 18, low: 8 },
                    { x: 3, high: 30, low: 20 },
                    { x: 4, high: 35, low: 25 },
                    { x: 5, high: 28, low: 18 },
                ],
                series: [
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 0, stop: 2, fill: 'rgba(255, 0, 0, 0.3)', stroke: 'red', strokeWidth: 2 },
                                { start: 2, stop: 4, fill: 'rgba(0, 0, 255, 0.3)', stroke: 'blue', strokeWidth: 3 },
                                { start: 4, fill: 'rgba(0, 255, 0, 0.3)', stroke: 'green', strokeWidth: 2 },
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

        it('should render range-area series with segmentation styling on y-axis', async () => {
            const options: AgChartOptions = {
                data: [
                    { category: 'A', high: 20, low: 10 },
                    { category: 'B', high: 35, low: 25 },
                    { category: 'C', high: 28, low: 18 },
                    { category: 'D', high: 42, low: 32 },
                    { category: 'E', high: 30, low: 20 },
                ],
                series: [
                    {
                        type: 'range-area',
                        xKey: 'category',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        segmentation: {
                            key: 'y',
                            segments: [
                                {
                                    start: 10,
                                    stop: 25,
                                    fill: 'rgba(255, 165, 0, 0.3)',
                                    stroke: 'orange',
                                    strokeWidth: 2,
                                    lineDash: [5, 5],
                                },
                                {
                                    start: 25,
                                    stop: 35,
                                    fill: 'rgba(128, 0, 128, 0.3)',
                                    stroke: 'purple',
                                    strokeWidth: 3,
                                },
                                {
                                    start: 35,
                                    fill: 'rgba(0, 255, 255, 0.3)',
                                    stroke: 'cyan',
                                    strokeWidth: 4,
                                    lineDash: [10, 2],
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

        it('should render multiple range-area series with different segmentation', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, high1: 20, low1: 10, high2: 25, low2: 5 },
                    { x: 1, high1: 25, low1: 15, high2: 30, low2: 10 },
                    { x: 2, high1: 18, low1: 8, high2: 35, low2: 15 },
                    { x: 3, high1: 30, low1: 20, high2: 28, low2: 18 },
                    { x: 4, high1: 35, low1: 25, high2: 40, low2: 20 },
                ],
                series: [
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'low1',
                        yHighKey: 'high1',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 0, stop: 2.5, fill: 'rgba(255, 0, 0, 0.2)', stroke: 'red', strokeWidth: 2 },
                                { start: 2.5, fill: 'rgba(0, 0, 255, 0.2)', stroke: 'blue', strokeWidth: 3 },
                            ],
                        },
                    },
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'low2',
                        yHighKey: 'high2',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 0,
                                    stop: 3,
                                    fill: 'rgba(0, 255, 0, 0.2)',
                                    stroke: 'green',
                                    strokeWidth: 2,
                                    lineDash: [3, 3],
                                },
                                { start: 3, fill: 'rgba(255, 255, 0, 0.2)', stroke: 'gold', strokeWidth: 3 },
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

        it('should render range-area series with pattern fill segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { category: 'A', high: 20, low: 10 },
                    { category: 'B', high: 25, low: 15 },
                    { category: 'C', high: 18, low: 8 },
                    { category: 'D', high: 30, low: 20 },
                ],
                series: [
                    {
                        type: 'range-area',
                        xKey: 'category',
                        yLowKey: 'low',
                        yHighKey: 'high',
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
                                    start: 'B',
                                    stop: 'C',
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'horizontal-lines',
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

        it('should render range-area series with gradient fill segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 0, high: 20, low: 10 },
                    { x: 1, high: 25, low: 15 },
                    { x: 2, high: 18, low: 8 },
                    { x: 3, high: 30, low: 20 },
                    { x: 4, high: 35, low: 25 },
                ],
                series: [
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 0,
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
    });

    describe('AG-15782 styler', () => {
        type D = { month: string; gain_low: number; gain_high: number; loss_low: number; loss_high: number };
        type C = unknown;
        type M = MockRangeAreaStyler<D, C>;
        let styler: ReturnType<typeof newFreezableMock<D, C, M>>;
        const data = [
            { month: 'January', gain_low: 1200, gain_high: 1500, loss_low: 800, loss_high: 1100 },
            { month: 'February', gain_low: 1500, gain_high: 1650, loss_low: 950, loss_high: 1450 },
            { month: 'March', gain_low: 1700, gain_high: 1920, loss_low: 1600, loss_high: 1815 },
        ];

        beforeEach(() => {
            styler = newFreezableMock<D, C, M>(
                (params: AgRangeAreaSeriesStylerParams<D, C>): AgRangeAreaSeriesStyle | undefined => {
                    if (params.yLowKey === 'gain_low')
                        return {
                            fill: 'cyan',
                            item: lowAndHigh({
                                lineDash: [4, 4],
                                lineDashOffset: 5,
                                stroke: 'blue',
                                strokeWidth: 2.5,
                                marker: {},
                            }),
                        };
                    else if (params.yLowKey === 'loss_low')
                        return {
                            fill: 'magenta',
                            fillOpacity: 0.5,
                            item: lowAndHigh({
                                marker: {
                                    fill: 'indigo',
                                    strokeWidth: 2.5,
                                    size: 20,
                                },
                            }),
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
                                type: 'range-area',
                                context: c1,
                                xKey: 'month',
                                yName: 'Gain',
                                yLowKey: 'gain_low',
                                yHighKey: 'gain_high',
                                fill: 'cyan',
                                styler: styler.frozen,
                            },
                            {
                                type: 'range-area',
                                context: c2,
                                xKey: 'month',
                                yName: 'Loss',
                                yLowKey: 'loss_low',
                                yHighKey: 'loss_high',
                                styler: styler.frozen,
                                item: lowAndHigh({
                                    marker: {
                                        fill: 'lime', // ignored
                                        fillOpacity: 0.5, // not ignored
                                    },
                                }),
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
                const itemStyler = (params: AgSeriesMarkerStylerParams<D, C>): AgSeriesMarkerStyle => {
                    if (params.datum.month === 'February') {
                        if (params.seriesId === 'gain-series') {
                            return { fill: 'gold' };
                        } else {
                            return { fill: 'grey' };
                        }
                    }
                    return {};
                };
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<AgCartesianChartOptions<D, C>>({
                        data,
                        series: [
                            {
                                type: 'range-area',
                                id: 'gain-series',
                                xKey: 'month',
                                yName: 'Gain',
                                yLowKey: 'gain_low',
                                yHighKey: 'gain_high',
                                fill: 'lime', // ignored
                                marker: {
                                    itemStyler,
                                },
                                item: lowAndHigh({
                                    marker: {
                                        size: 15,
                                    },
                                }),
                                styler: styler.frozen,
                            },
                            {
                                type: 'range-area',
                                id: 'loss-series',
                                xKey: 'month',
                                yName: 'Loss',
                                yLowKey: 'loss_low',
                                yHighKey: 'loss_high',
                                fill: 'olive', // ignored
                                marker: {
                                    itemStyler,
                                },
                                item: lowAndHigh({
                                    stroke: 'navy', // not ignored
                                    strokeWidth: 7, // not ignored
                                    marker: {
                                        fill: 'lime', // ignored
                                        fillOpacity: 0.5, // not ignored
                                    },
                                }),
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
                                type: 'range-area',
                                xKey: 'month',
                                yName: 'Gain',
                                yLowKey: 'gain_low',
                                yHighKey: 'gain_high',
                                styler: () => {
                                    return { fill: { type: 'gradient' } };
                                },
                            },
                            {
                                type: 'range-area',
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
    });

    describe('invertedSegments with invertedStyle', () => {
        it('should render range-area series with invertedStyle for segments that start inverted', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 'Jan', high: 10, low: 20 }, // starts inverted (high < low)
                    { x: 'Feb', high: 15, low: 25 },
                    { x: 'Mar', high: 25, low: 15 }, // crosses over (high > low)
                    { x: 'Apr', high: 30, low: 10 },
                    { x: 'May', high: 20, low: 30 }, // inverts again (high < low)
                ],
                series: [
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        invertedStyle: {
                            fill: 'rgb(255, 87, 87)',
                            fillOpacity: 0.8,
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render range-area series with invertedStyle for segments that start normal', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 'Jan', high: 20, low: 10 }, // starts normal (high > low)
                    { x: 'Feb', high: 25, low: 15 },
                    { x: 'Mar', high: 15, low: 25 }, // crosses over (high < low)
                    { x: 'Apr', high: 10, low: 30 },
                    { x: 'May', high: 30, low: 20 }, // back to normal (high > low)
                ],
                series: [
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        invertedStyle: {
                            fill: 'rgb(255, 87, 87)',
                            fillOpacity: 0.8,
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render range-area series with invertedStyle and gradient fills', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, high: 5, low: 15 }, // starts inverted
                    { x: 1, high: 10, low: 20 },
                    { x: 2, high: 20, low: 10 }, // crosses over
                    { x: 3, high: 25, low: 5 },
                    { x: 4, high: 15, low: 25 }, // inverts again
                    { x: 5, high: 10, low: 30 },
                ],
                series: [
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        fill: {
                            type: 'gradient',
                            colorStops: [{ color: '#4A90E2' }, { color: '#E3F2FD' }],
                        },
                        invertedStyle: {
                            enabled: true,
                            fill: {
                                type: 'gradient',
                                colorStops: [{ color: '#FF5757' }, { color: '#FFE5E5' }],
                            },
                            fillOpacity: 0.8,
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render range-area series with invertedStyle and smooth interpolation', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, high: 10, low: 30 }, // starts inverted
                    { x: 1, high: 15, low: 25 },
                    { x: 2, high: 25, low: 15 }, // crosses to normal
                    { x: 3, high: 30, low: 10 },
                    { x: 4, high: 20, low: 25 }, // crosses to inverted
                    { x: 5, high: 15, low: 30 },
                    { x: 6, high: 28, low: 18 }, // crosses to normal
                    { x: 7, high: 35, low: 12 },
                    { x: 8, high: 18, low: 32 }, // crosses to inverted
                    { x: 9, high: 12, low: 35 },
                ],
                series: [
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        invertedStyle: {
                            fill: 'rgb(255, 87, 87)',
                            fillOpacity: 0.8,
                        },
                        interpolation: {
                            type: 'smooth',
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render range-area series with invertedStyle and step interpolation', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, high: 10, low: 30 }, // starts inverted
                    { x: 1, high: 15, low: 25 },
                    { x: 2, high: 25, low: 15 }, // crosses to normal
                    { x: 3, high: 30, low: 10 },
                    { x: 4, high: 20, low: 25 }, // crosses to inverted
                    { x: 5, high: 15, low: 30 },
                    { x: 6, high: 28, low: 18 }, // crosses to normal
                    { x: 7, high: 35, low: 12 },
                    { x: 8, high: 18, low: 32 }, // crosses to inverted
                    { x: 9, high: 12, low: 35 },
                ],
                series: [
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        invertedStyle: {
                            fill: 'rgb(255, 87, 87)',
                            fillOpacity: 0.8,
                        },
                        interpolation: {
                            type: 'step',
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render range-area series with invertedStyle with time and smooth interpolation', async () => {
            const continuousData = [
                { date: new Date(2023, 0, 1), high: 8, low: 18 }, // starts inverted
                { date: new Date(2023, 0, 15), high: 12, low: 22 },
                { date: new Date(2023, 1, 1), high: 20, low: 15 }, // crosses over
                { date: new Date(2023, 1, 15), high: 25, low: 10 },
                { date: new Date(2023, 2, 1), high: 22, low: 28 }, // crosses back
                { date: new Date(2023, 2, 15), high: 18, low: 32 },
                { date: new Date(2023, 3, 1), high: 30, low: 20 }, // crosses over again
                { date: new Date(2023, 3, 15), high: 35, low: 15 },
            ];

            const options: AgChartOptions = {
                data: continuousData,
                series: [
                    {
                        type: 'range-area',
                        xKey: 'date',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        invertedStyle: {
                            fill: 'rgb(255, 87, 87)',
                            fillOpacity: 0.8,
                        },
                        interpolation: {
                            type: 'smooth',
                        },
                    },
                ],
                axes: {
                    x: { type: 'time', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render range-area series with invertedStyle inherited from series styles', async () => {
            const options: AgChartOptions = {
                data: [
                    { category: 'A', high: 12, low: 22 }, // starts inverted
                    { category: 'B', high: 18, low: 28 },
                    { category: 'C', high: 28, low: 18 }, // crosses over
                    { category: 'D', high: 32, low: 12 },
                    { category: 'E', high: 20, low: 30 }, // inverts again
                ],
                series: [
                    {
                        type: 'range-area',
                        xKey: 'category',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        invertedStyle: {
                            fillOpacity: 0.1,
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render range-area series with invertedStyle that never inverts', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, high: 25, low: 15 },
                    { x: 1, high: 30, low: 20 },
                    { x: 2, high: 28, low: 18 },
                    { x: 3, high: 35, low: 25 },
                    { x: 4, high: 32, low: 22 },
                ],
                series: [
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        invertedStyle: {
                            fill: 'rgb(255, 87, 87)',
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render range-area series with invertedStyle that is always inverted', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, high: 15, low: 25 },
                    { x: 1, high: 20, low: 30 },
                    { x: 2, high: 18, low: 28 },
                    { x: 3, high: 25, low: 35 },
                    { x: 4, high: 22, low: 32 },
                ],
                series: [
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        invertedStyle: {
                            fill: 'rgb(255, 87, 87)',
                        },
                    },
                ],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('AG-15773 itemStyler itemType', () => {
        it('should render high and low markers differently', async () => {
            type D = { month: string; low: number; high: number };
            const options: AgChartOptions<D> = {
                data: [
                    { month: 'January', low: 1200, high: 1500 },
                    { month: 'February', low: 1500, high: 1650 },
                    { month: 'March', low: 1700, high: 1920 },
                    { month: 'April', low: 1800, high: 2100 },
                    { month: 'May', low: 2000, high: 2300 },
                    { month: 'June', low: 2450, high: 2100 },
                    { month: 'July', low: 2600, high: 2300 },
                    { month: 'August', low: 2200, high: 2550 },
                    { month: 'September', low: 2000, high: 2400 },
                    { month: 'October', low: 1900, high: 2250 },
                    { month: 'November', low: 1750, high: 2100 },
                    { month: 'December', low: 1600, high: 1950 },
                ],
                legend: { item: { line: { length: 50 } } },
                series: [
                    {
                        type: 'range-area',
                        xKey: 'month',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        marker: {
                            size: 25,
                            itemStyler: (params) => {
                                switch (params.itemType) {
                                    case 'high':
                                        return { fill: 'lime', stroke: 'forestgreen', shape: 'star' };
                                    case 'low':
                                        return { fill: 'fuchsia', stroke: 'purple', shape: 'heart' };
                                    default:
                                        return {};
                                }
                            },
                        },
                    },
                ],
            };
            chart = AgCharts.create(prepareEnterpriseTestOptions(options));
            await compare();
        });

        test('marker enabled', async () => {
            type Ks = 'a' | 'A' | 'b' | 'B' | 'c' | 'C' | 'd' | 'D' | 'e' | 'E' | 'f' | 'F' | 'g' | 'G';
            type D = { x: string } & { [K in Ks]: number };
            const data: D[] = [
                { x: 'West', a: 1, A: 2, b: 3, B: 4, c: 5, C: 6, d: 7, D: 8, e: 9, E: 10, f: 11, F: 12, g: 13, G: 14 },
                { x: 'East', a: 1, A: 2, b: 3, B: 4, c: 5, C: 6, d: 7, D: 8, e: 9, E: 10, f: 11, F: 12, g: 13, G: 14 },
            ];
            const opts: AgChartOptions<D> = {
                data,
                series: [
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'a',
                        yHighKey: 'A',
                        yName: 'default',
                    },
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'b',
                        yHighKey: 'B',
                        yName: 'high markers only',
                        item: { high: { marker: { enabled: true } } },
                    },
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'c',
                        yHighKey: 'C',
                        yName: 'low markers only',
                        item: { low: { marker: { enabled: true } } },
                    },
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'd',
                        yHighKey: 'D',
                        yName: 'both (implied)',
                        marker: {},
                    },
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'e',
                        yHighKey: 'E',
                        yName: 'both (explicit)',
                        marker: { enabled: true },
                    },
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'f',
                        yHighKey: 'F',
                        yName: 'none (explicit)',
                        marker: { enabled: false },
                    },
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'g',
                        yHighKey: 'G',
                        yName: 'override off',
                        marker: { enabled: true },
                        item: { low: { marker: { enabled: false } } },
                    },
                ],
            };
            chart = AgCharts.create(prepareEnterpriseTestOptions(opts));
            await compare();
        });
    });

    it('should dim non-highlight markers with cutout in range area', async () => {
        const options: AgChartOptions = {
            data: [
                { category: 'Jan', low: 1, high: 5 },
                { category: 'Feb', low: 2, high: 7 },
                { category: 'Mar', low: 3, high: 6 },
                { category: 'Apr', low: 4, high: 8 },
            ],
            series: [
                {
                    type: 'range-area',
                    xKey: 'category',
                    yLowKey: 'low',
                    yHighKey: 'high',
                    item: {
                        low: { marker: { enabled: true, size: 28 } },
                        high: { marker: { enabled: true, size: 28 } },
                    },
                    highlight: {
                        unhighlightedItem: {
                            fillOpacity: 0.4,
                            strokeOpacity: 0.4,
                        },
                    },
                },
            ],
        };

        chart = AgCharts.create(prepareEnterpriseTestOptions(options));

        await waitForChartStability(chart);
        await hoverAction(200, 220)(chart);
        await waitForChartStability(chart);
        await compare();
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
                    { type: 'range-area', xKey: 'x', yLowKey: 's1L', yHighKey: 's1H', yName: 'series 1' },
                    { type: 'range-area', xKey: 'x', yLowKey: 's2L', yHighKey: 's2H', yName: 'series 2' },
                    { type: 'range-area', xKey: 'x', yLowKey: 's3L', yHighKey: 's3H', yName: 'series 3' },
                ],
            },
        });
    });
});
