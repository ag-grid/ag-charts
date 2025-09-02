import { afterEach, describe, expect, it } from '@jest/globals';

import {
    AgCartesianChartOptions,
    type AgChartOptions,
    AgCharts,
    AgRangeAreaSeriesLabelPlacement,
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

describe('RangeAreaSeries', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();

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
                strokeWidth: 2,
                fill: '#E7E8E9',
                stroke: '#2A5783',
                marker: {
                    enabled: true,
                },
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
            axes: [
                {
                    position: 'left',
                    type: 'number',
                    reverse: true,
                },
                {
                    position: 'bottom',
                    type: 'category',
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-area chart with a unit time x-axis`, async () => {
        const options: AgChartOptions = {
            ...RANGE_AREA_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: [
                {
                    position: 'left',
                    type: 'number',
                },
                {
                    position: 'bottom',
                    type: 'unit-time',
                },
            ],
        };
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-area chart with reversed unit time x-axis`, async () => {
        const options: AgChartOptions = {
            ...RANGE_AREA_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: [
                {
                    position: 'left',
                    type: 'number',
                },
                {
                    position: 'bottom',
                    type: 'unit-time',
                    reverse: true,
                },
            ],
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
            axes: [
                {
                    position: 'left',
                    type: 'number',
                },
                {
                    position: 'bottom',
                    type: 'number',
                },
            ],
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
            axes: [
                {
                    position: 'left',
                    type: 'number',
                },
                {
                    position: 'bottom',
                    type: 'number',
                    reverse: true,
                },
            ],
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
            axes: [
                {
                    position: 'left',
                    type: 'number',
                },
                {
                    position: 'bottom',
                    type: 'unit-time',
                },
            ],
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
                axes: [
                    { type: 'number', position: 'bottom' },
                    { type: 'number', position: 'left' },
                ],
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
                axes: [
                    { type: 'category', position: 'bottom' },
                    { type: 'number', position: 'left' },
                ],
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
                axes: [
                    { type: 'number', position: 'bottom' },
                    { type: 'number', position: 'left' },
                ],
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
                axes: [
                    { type: 'category', position: 'bottom' },
                    { type: 'number', position: 'left' },
                ],
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
                axes: [
                    { type: 'number', position: 'bottom' },
                    { type: 'number', position: 'left' },
                ],
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const imageData = extractImageData(ctx);
            expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });
    });
});
