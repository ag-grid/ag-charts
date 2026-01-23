import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { deepClone } from 'ag-charts-core';
import type {
    AgCartesianChartOptions,
    AgChartInstance,
    AgChartOptions,
    AgLineSeriesMarkerItemStylerParams,
    AgLineSeriesOptions,
    AgLineSeriesStylerParams,
    AgLineSeriesStylerResult,
    AgSeriesMarkerStyle,
} from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import {
    DATA_FRACTIONAL_LOG_AXIS,
    DATA_INVALID_DOMAIN_LOG_AXIS,
    DATA_NEGATIVE_LOG_AXIS,
    DATA_POSITIVE_LOG_AXIS,
    DATA_ZERO_EXTENT_LOG_AXIS,
} from '../../test/data';
import * as examples from '../../test/examples';
import { type MockLineStyler, newFreezableMock } from '../../test/freezableMock';
import { testLegendItemName } from '../../test/legendItemName';
import type { CartesianOrPolarTestCase } from '../../test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    extractImageData,
    hoverAction,
    mixinReversedAxesCases,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    waitForChartStability,
} from '../../test/utils';

const buildLogAxisTestCase = (
    data: any[],
    extra?: { warnings?: string[]; skipWarningsReversed?: boolean }
): CartesianOrPolarTestCase => {
    return {
        options: examples.CARTESIAN_CATEGORY_X_AXIS_LOG_Y_AXIS(data, 'line'),
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'log' }, seriesTypes: ['line'] }),
        ...extra,
    };
};

const EXAMPLES: Record<string, CartesianOrPolarTestCase> = {
    ...mixinReversedAxesCases({
        LINE_TIME_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.LINE_TIME_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'unit-time', y: 'number' },
                seriesTypes: repeat('line', 2),
            }),
        },
        LINE_NUMBER_X_AXIS_TIME_Y_AXIS: {
            options: examples.LINE_NUMBER_X_AXIS_TIME_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'unit-time' },
                seriesTypes: repeat('line', 2),
            }),
        },
        LINE_MISSING_Y_DATA_EXAMPLE: {
            options: examples.LINE_MISSING_Y_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['line'] }),
        },
        LINE_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE: {
            options: examples.LINE_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: ['line'],
            }),
            warnings: [
                ['AG Charts - invalid value of type [undefined] for [LineSeries-1 / xValue] ignored:', '[undefined]'],
            ],
            skipWarningsReversed: false,
        },
        LINE_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE: {
            options: examples.LINE_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'unit-time', y: 'number' },
                seriesTypes: ['line'],
            }),
            warnings: [
                ['AG Charts - invalid value of type [object] for [LineSeries-1 / xKey] ignored:', '[null]'],
                ['AG Charts - invalid value of type [object] for [LineSeries-1 / xValue] ignored:', '[null]'],
            ],
            skipWarningsReversed: false,
        },
        LINE_NUMBER_AXES_0_X_DOMAIN: {
            options: examples.LINE_NUMBER_AXES_0_X_DOMAIN,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: repeat('line', 2),
            }),
        },
        LINE_NUMBER_AXES_0_Y_DOMAIN: {
            options: examples.LINE_NUMBER_AXES_0_Y_DOMAIN,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: repeat('line', 2),
            }),
        },
        LINE_TIME_X_AXIS_NUMBER_Y_AXIS_LABELS: {
            options: examples.LINE_TIME_X_AXIS_NUMBER_Y_AXIS_LABELS,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'unit-time', y: 'number' }, seriesTypes: ['line'] }),
        },
        LINE_TIME_X_AXIS_POSITION_TOP_NUMBER_Y_AXIS_LABELS: {
            options: examples.LINE_TIME_X_AXIS_POSITION_TOP_NUMBER_Y_AXIS_LABELS,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'unit-time', y: 'number' }, seriesTypes: ['line'] }),
        },
        LINE_TIME_X_AXIS_NUMBER_Y_AXIS_POSITION_RIGHT_LABELS: {
            options: examples.LINE_TIME_X_AXIS_NUMBER_Y_AXIS_POSITION_RIGHT_LABELS,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'unit-time', y: 'number' }, seriesTypes: ['line'] }),
        },
        LINE_CATEGORY_X_AXIS_POSITIVE_LOG_Y_AXIS: buildLogAxisTestCase(DATA_POSITIVE_LOG_AXIS),
        LINE_CATEGORY_X_AXIS_NEGATIVE_LOG_Y_AXIS: buildLogAxisTestCase(DATA_NEGATIVE_LOG_AXIS),
        LINE_CATEGORY_X_AXIS_FRACTIONAL_LOG_Y_AXIS: buildLogAxisTestCase(DATA_FRACTIONAL_LOG_AXIS),
        LINE_CATEGORY_X_AXIS_ZERO_EXTENT_LOG_Y_AXIS: buildLogAxisTestCase(DATA_ZERO_EXTENT_LOG_AXIS, {
            warnings: [
                'AG Charts - The log axis domain contains a value of 0, the chart data cannot be rendered. See log axis documentation for more information.',
            ],
            skipWarningsReversed: false,
        }),
        LINE_CATEGORY_X_AXIS_INVALID_DOMAIN_LOG_Y_AXIS: buildLogAxisTestCase(DATA_INVALID_DOMAIN_LOG_AXIS, {
            warnings: [
                'AG Charts - The log axis domain crosses zero, the chart data cannot be rendered. See log axis documentation for more information.',
            ],
            skipWarningsReversed: false,
        }),
        LINE_STACKED_DATA_PER_SERIES: {
            options: examples.LINE_STACKED_DATA_PER_SERIES,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: ['line', 'line'],
            }),
        },
        LINE_NORMALISED_SINGLE_LINE: {
            options: {
                ...examples.NORMALISED_STACKED_AREA,
                series: [
                    {
                        ...(examples.NORMALISED_STACKED_AREA.series?.[0] as AgLineSeriesOptions),
                        type: 'line',
                        normalizedTo: 100,
                    },
                ],
            } satisfies AgCartesianChartOptions,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('line', 1),
            }),
        },
        UNSTACKED_LINE_NORMALISED_SINGLE_LINE: {
            options: {
                ...examples.NORMALISED_STACKED_AREA,
                series: [
                    {
                        ...(examples.NORMALISED_STACKED_AREA.series?.[0] as AgLineSeriesOptions),
                        type: 'line',
                        normalizedTo: 100,
                        stacked: false,
                    },
                ],
            } satisfies AgCartesianChartOptions,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('line', 1),
            }),
        },
    }),
    LINE_NULL_CATEGORY_KEY: {
        options: examples.LINE_NULL_CATEGORY_KEY_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['line'] }),
        warnings: [
            ['AG Charts - invalid value of type [object] for [LineSeries-1 / xKey] ignored:', '[null]'],
            ['AG Charts - invalid value of type [object] for [LineSeries-1 / xValue] ignored:', '[null]'],
        ],
    },
};

describe('LineSeries', () => {
    setupMockConsole();
    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    describe('#create', () => {
        beforeEach(() => {
            console.warn = jest.fn();
        });

        it.each(Object.entries(EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const { assertions, options, warnings = [] } = example;
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await assertions(chart);

                for (const [index, message] of warnings.entries()) {
                    expect(console.warn).toHaveBeenNthCalledWith(
                        index + 1,
                        ...(Array.isArray(message) ? message : [message])
                    );
                }
                if (warnings.length === 0) {
                    expect(console.warn).not.toHaveBeenCalled();
                }
            }
        );

        it.each(Object.entries(EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            }
        );
    });

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for LINE_CATEGORY_X_AXIS_FRACTIONAL_LOG_Y_AXIS should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);
                const options: AgChartOptions = examples.CARTESIAN_CATEGORY_X_AXIS_LOG_Y_AXIS(
                    DATA_FRACTIONAL_LOG_AXIS,
                    'line'
                );
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    const ANIMATION_CATEGORY_DATA = [
        { quarter: 'week 3', iphone: 60, macos: 31 },
        { quarter: 'week 4', iphone: 185, macos: 43 },
        { quarter: 'week 5', iphone: 148, macos: 35 },
        { quarter: 'week 6', iphone: 130, macos: 42 },
        { quarter: 'week 9', iphone: 62, macos: 45 },
        { quarter: 'week 10', iphone: 137, macos: 24 },
        { quarter: 'week 11', iphone: 121, macos: 57 },
    ];

    describe('category animation', () => {
        const animate = spyOnAnimationManager();

        const OPTIONS: AgChartOptions = {
            data: ANIMATION_CATEGORY_DATA,
            series: [
                {
                    type: 'line',
                    xKey: 'quarter',
                    yKey: 'iphone',
                    label: {
                        formatter: ({ value }) => String(value),
                    },
                },
            ],
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                },
                x: {
                    position: 'bottom',
                    type: 'category',
                },
            },
        };

        const animationTestCases: Array<[string, any] | [string, any, number]> = [
            ['removing points', [...ANIMATION_CATEGORY_DATA.slice(0, 2), ...ANIMATION_CATEGORY_DATA.slice(4)]],
            ['removing the first point', [...ANIMATION_CATEGORY_DATA.slice(1)]],
            ['removing the last point', [...ANIMATION_CATEGORY_DATA.slice(0, -1)]],
            [
                'adding points',
                [
                    ...ANIMATION_CATEGORY_DATA.slice(0, 4),
                    { quarter: 'week 7', iphone: 142 },
                    { quarter: 'week 8', iphone: 87 },
                    ...ANIMATION_CATEGORY_DATA.slice(4),
                ],
            ],
            [
                'adding points before',
                [{ quarter: 'week 1', iphone: 89 }, { quarter: 'week 2', iphone: 110 }, ...ANIMATION_CATEGORY_DATA],
            ],
            [
                'adding points after',
                [...ANIMATION_CATEGORY_DATA, { quarter: 'week 12', iphone: 78 }, { quarter: 'week 13', iphone: 138 }],
            ],
            [
                'updating points',
                [
                    ...ANIMATION_CATEGORY_DATA.slice(0, 2),
                    { quarter: 'week 5', iphone: 190 },
                    { quarter: 'week 6', iphone: 38 },
                    ...ANIMATION_CATEGORY_DATA.slice(4),
                ],
            ],
            [
                'updating points to undefined',
                [
                    ...ANIMATION_CATEGORY_DATA.slice(0, 2),
                    { quarter: 'week 5', iphone: undefined },
                    ...ANIMATION_CATEGORY_DATA.slice(3),
                ],
            ],
            [
                'adding, removing and updating simultaneously',
                [
                    { quarter: 'week 1', iphone: 89, mac: 40 },
                    { quarter: 'week 2', iphone: 110, mac: 40 },
                    { quarter: 'week 3', iphone: 82, mac: 40 },
                    { quarter: 'week 6', iphone: 130 },
                    { quarter: 'week 7', iphone: 142 },
                    { quarter: 'week 8', iphone: 87 },
                    { quarter: 'week 9', iphone: 62, mac: 42 },
                    { quarter: 'week 10', iphone: 137 },
                    { quarter: 'week 11', iphone: 121 },
                ],
                700,
            ],
        ];

        for (const [testCase, changedData, duration = 1200] of animationTestCases) {
            for (const ratio of [0, 0.5, 1]) {
                it(`should animate ${testCase} at ${ratio * 100}%`, async () => {
                    animate(1200, 1);
                    prepareTestOptions(OPTIONS);
                    chart = AgCharts.create(OPTIONS);
                    await waitForChartStability(chart);

                    animate(duration, ratio);
                    await chart.updateDelta({ data: changedData });
                    await waitForChartStability(chart);
                    await compare();
                });
            }
        }
    });

    describe('legend toggle animation', () => {
        const animate = spyOnAnimationManager();

        const OPTIONS: AgChartOptions = {
            data: ANIMATION_CATEGORY_DATA,
            series: [
                {
                    type: 'line',
                    xKey: 'quarter',
                    yKey: 'iphone',
                    label: {
                        formatter: ({ value }) => String(value),
                    },
                },
                {
                    type: 'line',
                    xKey: 'quarter',
                    yKey: 'macos',
                    label: {
                        formatter: ({ value }) => String(value),
                    },
                },
            ],
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                },
                x: {
                    position: 'bottom',
                    type: 'category',
                },
            },
        };

        describe('hide', () => {
            for (const ratio of [0, 0.1, 0.2, 0.3, 1]) {
                it(`should animate at ${ratio * 100}%`, async () => {
                    animate(1200, 1);

                    const options: AgChartOptions = deepClone(OPTIONS);
                    prepareTestOptions(options);

                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);

                    animate(1200, ratio);
                    options.series![0].visible = false;
                    await chart.update({ ...options });

                    await compare();
                });
            }
        });

        describe('show', () => {
            for (const ratio of [0, 0.7, 0.8, 0.9, 1]) {
                it(`should animate at ${ratio * 100}%`, async () => {
                    animate(1200, 1);

                    const options: AgChartOptions = deepClone(OPTIONS);
                    options.series![1].visible = false;
                    prepareTestOptions(options);

                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);

                    animate(1200, ratio);
                    options.series![1].visible = true;
                    await chart.update(options);

                    await compare();
                });
            }
        });
    });

    // CRT-995: Verify stacked line series animation works correctly when adding points.
    // The fix ensures animation uses yCumulative instead of yDatum for stacked series,
    // preventing lines from animating up from the bottom (y=0) when points are added.
    describe('CRT-995 stacked line animation', () => {
        const animate = spyOnAnimationManager();

        const STACKED_DATA = [
            { quarter: 'Q1', apples: 50, oranges: 30 },
            { quarter: 'Q2', apples: 60, oranges: 40 },
            { quarter: 'Q3', apples: 70, oranges: 35 },
        ];

        const STACKED_OPTIONS: AgChartOptions = {
            data: STACKED_DATA,
            series: [
                { type: 'line', xKey: 'quarter', yKey: 'apples', stacked: true },
                { type: 'line', xKey: 'quarter', yKey: 'oranges', stacked: true },
            ],
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
        };

        for (const ratio of [0, 0.5, 0.6, 0.7, 0.8]) {
            it(`should animate adding points to stacked series at ${ratio * 100}%`, async () => {
                animate(1200, 1);
                prepareTestOptions(STACKED_OPTIONS);
                chart = AgCharts.create(STACKED_OPTIONS);
                await waitForChartStability(chart);

                // Add more data points
                const newData = [
                    ...STACKED_DATA,
                    { quarter: 'Q4', apples: 80, oranges: 45 },
                    { quarter: 'Q5', apples: 65, oranges: 50 },
                ];

                animate(1200, ratio);
                await chart.updateDelta({ data: newData });
                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('multiple overlapping lines', () => {
        beforeEach(() => {
            console.warn = jest.fn();
        });

        it('should render line series with the correct relative Z-index', async () => {
            const options: AgChartOptions = {
                data: repeat(null, 30).reduce(
                    (result, _, i) => [
                        {
                            ...(result[0] ?? {}),
                            [`x${i}`]: 0,
                            [`y${i}`]: i,
                        },
                        {
                            ...(result[1] ?? {}),
                            [`x${i}`]: 1,
                            [`y${i}`]: 30 - i,
                        },
                    ],
                    [{}, {}]
                ),
                series: repeat(null, 30).map((_, i) => ({
                    type: 'line',
                    xKey: `x${i}`,
                    yKey: `y${i}`,
                    strokeWidth: 30,
                })),
                legend: { enabled: false },
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('clipping animation', () => {
        const animate = spyOnAnimationManager();

        describe('AG-10477', () => {
            for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
                it(`should render correctly at ${ratio * 100}%`, async () => {
                    animate(1200, ratio);
                    const options: AgChartOptions = {
                        data: [
                            { month: 'Jun', a: 50, b: 50 },
                            { month: 'Jul', a: 100, b: 0 },
                            { month: 'Aug', a: 100, b: 0 },
                            { month: 'Sep', a: 100, b: 0 },
                            { month: 'Oct', a: 100, b: 0 },
                        ],
                        series: [
                            { type: 'line', xKey: 'month', yKey: 'a', strokeWidth: 22 },
                            { type: 'line', xKey: 'month', yKey: 'b', strokeWidth: 22 },
                        ],
                    };

                    prepareTestOptions(options);

                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);
                    await compare();
                });
            }
        });
    });

    describe('data per series', () => {
        it('with category keys should render as expected', async () => {
            const options: AgChartOptions = {
                series: [
                    {
                        data: [
                            { key: '2020', value: 300 },
                            { key: '2021', value: 200 },
                            { key: '2022', value: 350 },
                            { key: '2023', value: 400 },
                        ],
                        type: 'line',
                        xKey: 'key',
                        yKey: 'value',
                    },
                    {
                        data: [
                            { key: '2022', value: 100 },
                            { key: '2023', value: 130 },
                            { key: '2024', value: 160 },
                            { key: '2025', value: 200 },
                        ],
                        type: 'line',
                        xKey: 'key',
                        yKey: 'value',
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);

            // TODO: replace with `compare()` with 0 percent threshold
            await waitForChartStability(chart);

            const imageData = extractImageData(ctx);
            expect(imageData).toMatchImageSnapshot({
                failureThreshold: 0,
                failureThresholdType: 'percent',
            });
        });

        it('with continuous keys should render as expected', async () => {
            const options: AgChartOptions = {
                series: [
                    {
                        data: [
                            { key: new Date('2020'), value: 300 },
                            { key: new Date('2021'), value: 200 },
                            { key: new Date('2022'), value: 350 },
                            { key: new Date('2023'), value: 400 },
                        ],
                        type: 'line',
                        xKey: 'key',
                        yKey: 'value',
                    },
                    {
                        data: [
                            { key: new Date('2022'), value: 100 },
                            { key: new Date('2023'), value: 130 },
                            { key: new Date('2024'), value: 160 },
                            { key: new Date('2025'), value: 200 },
                        ],
                        type: 'line',
                        xKey: 'key',
                        yKey: 'value',
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);

            // TODO: replace with `compare()` with 0 percent threshold
            await waitForChartStability(chart);

            const imageData = extractImageData(ctx);
            expect(imageData).toMatchImageSnapshot({
                failureThreshold: 0,
                failureThresholdType: 'percent',
            });
        });

        it('should handle stacked case', async () => {
            const options = {
                ...examples.LINE_STACKED_DATA_PER_SERIES,
                series: examples.LINE_STACKED_DATA_PER_SERIES.series!.map((series, index) => ({
                    ...series,
                    id: `series-${index}`,
                })),
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);

            await waitForChartStability(chart);

            const state = chart.getState();

            state.legend = [
                {
                    seriesId: 'series-0',
                    visible: false,
                },
            ];

            await chart.setState(state);

            const imageData = extractImageData(ctx);
            expect(imageData).toMatchImageSnapshot();
        });

        it('should handle stacked with unconnected missing data case', async () => {
            const options = {
                ...examples.LINE_STACKED_MISSING_DATA,
                series: examples.LINE_STACKED_MISSING_DATA.series!.map((series) => ({
                    ...series,
                    connectMissingData: false,
                })),
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);

            await waitForChartStability(chart);

            const imageData = extractImageData(ctx);
            expect(imageData).toMatchImageSnapshot();
        });

        it('should handle stacked with connected missing data case', async () => {
            const options = {
                ...examples.LINE_STACKED_MISSING_DATA,
                series: examples.LINE_STACKED_MISSING_DATA.series!.map((series) => ({
                    ...series,
                    connectMissingData: true,
                })),
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);

            await waitForChartStability(chart);

            const imageData = extractImageData(ctx);
            expect(imageData).toMatchImageSnapshot();
        });
    });

    describe('item styler', () => {
        it('calculates first, last, min, max values', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 'a', y: 100 },
                    { x: 'b', y: -100 },
                    { x: 'c', y: 200 },
                    { x: 'd', y: 100 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        marker: {
                            size: 20,
                            itemStyler: (params) => {
                                if (params.first) return { fill: 'red' };
                                if (params.min) return { fill: 'yellow' };
                                if (params.max) return { fill: 'green' };
                                if (params.last) return { fill: 'blue' };
                            },
                        },
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    test('AG-8290 label boxing', async () => {
        chart = AgCharts.create(
            prepareTestOptions({
                data: [
                    { month: 'Jan', value: 29.9 },
                    { month: 'Apr', value: 129.2 },
                    { month: 'Jul', value: 135.6 },
                    { month: 'Oct', value: 194.1 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'month',
                        yKey: 'value',
                        label: {
                            itemStyler: (params) => {
                                if (params.datum.month === 'Jul') {
                                    return {
                                        border: {
                                            stroke: 'red',
                                            strokeWidth: 6,
                                            strokeOpacity: 1,
                                        },
                                        padding: {
                                            top: 30,
                                            bottom: 60,
                                            left: 40,
                                            right: 20,
                                        },
                                        fontWeight: 'bold',
                                        fill: {
                                            type: 'gradient',
                                            colorStops: [
                                                { color: '#70C1FF', stop: 0.1 },
                                                { color: '#FFD86F', stop: 0.3 },
                                                { color: '#FF9A60', stop: 0.5 },
                                                { color: '#D16BA5' },
                                            ],
                                        },
                                    };
                                }
                            },
                            enabled: true,
                            cornerRadius: 8,
                            fill: 'rgb(252, 255, 197)',
                            fillOpacity: 0.7,
                            padding: 10,
                            border: {
                                stroke: '#AAA',
                                strokeWidth: 3,
                                strokeOpacity: 0.2,
                            },
                        },
                    },
                ],
            })
        );
        await compare();
    });

    describe('AG-11673 styler', () => {
        type D = unknown;
        type C = unknown;
        type M = MockLineStyler<D, C>;
        let styler: ReturnType<typeof newFreezableMock<D, C, M>>;
        const data = [
            { month: 'January', sales: 1200, expenses: 800 },
            { month: 'February', sales: 1500, expenses: 950 },
            { month: 'March', sales: 1700, expenses: 1100 },
        ];
        beforeEach(() => {
            styler = newFreezableMock<D, C, M>(
                (params: AgLineSeriesStylerParams<D, C>): AgLineSeriesStylerResult | undefined => {
                    if (params.yKey === 'sales')
                        return {
                            marker: {
                                fill: 'cyan',
                                shape: 'triangle',
                                size: 50,
                            },
                            lineDash: [3, 3],
                            lineDashOffset: 5,
                            stroke: 'blue',
                            strokeWidth: 7,
                        };
                    else if (params.yKey === 'expenses')
                        return {
                            marker: {
                                fill: 'magenta',
                                fillOpacity: 0.5,
                                shape: 'star',
                                size: 40,
                            },
                            stroke: 'purple',
                        };
                    return {};
                }
            );
        });
        describe('init', () => {
            let c1: C;
            let c2: C;
            beforeEach(async () => {
                c1 = { name: 'sales context' };
                c2 = { name: 'expenses context' };
                chart = AgCharts.create(
                    prepareTestOptions({
                        data,
                        series: [
                            { type: 'line', xKey: 'month', yKey: 'sales', styler: styler.frozen, context: c1 },
                            { type: 'line', xKey: 'month', yKey: 'expenses', styler: styler.frozen, context: c2 },
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
                const itemStyler = (params: AgLineSeriesMarkerItemStylerParams<D, C>): AgSeriesMarkerStyle => {
                    if (params.xValue === 'February') {
                        if (params.yKey === 'sales') {
                            return { fill: 'gold', shape: 'plus', strokeWidth: 0 };
                        } else {
                            return { fill: 'grey', shape: 'cross' };
                        }
                    }
                    return {};
                };
                chart = AgCharts.create(
                    prepareTestOptions({
                        data,
                        series: [
                            {
                                type: 'line',
                                xKey: 'month',
                                yKey: 'sales',
                                marker: {
                                    fill: 'lime', // ignored
                                    shape: 'square', // ignored
                                    strokeWidth: 3, // ignored only for February
                                    itemStyler,
                                },
                                styler: styler.frozen,
                            },
                            {
                                type: 'line',
                                xKey: 'month',
                                yKey: 'expenses',
                                marker: {
                                    fill: 'olive', // ignored
                                    shape: 'square', // ignored
                                    itemStyler,
                                },
                                stroke: 'navy', // ignored
                                strokeWidth: 5, // not ignored
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
                    prepareTestOptions({
                        data,
                        series: [
                            {
                                type: 'line',
                                xKey: 'month',
                                yKey: 'sales',
                                styler: () => {
                                    return { marker: { size: 50, fill: { type: 'gradient' } } };
                                },
                            },
                            {
                                type: 'line',
                                xKey: 'month',
                                yKey: 'expenses',
                                styler: () => {
                                    return { marker: { size: 50, fill: { type: 'pattern' } } };
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
        describe('stroke options', () => {
            beforeEach(async () => {
                const options = prepareTestOptions({
                    data: [
                        { month: 'Jan', subscriptions: 222 },
                        { month: 'Feb', subscriptions: 240 },
                        { month: 'Mar', subscriptions: 280 },
                        { month: 'Apr', subscriptions: 300 },
                        { month: 'May', subscriptions: 350 },
                        { month: 'Jun', subscriptions: 420 },
                        { month: 'Jul', subscriptions: 300 },
                        { month: 'Aug', subscriptions: 270 },
                        { month: 'Sep', subscriptions: 260 },
                        { month: 'Oct', subscriptions: 385 },
                        { month: 'Nov', subscriptions: 320 },
                        { month: 'Dec', subscriptions: 330 },
                    ],
                    legend: { item: { line: { length: 120 }, marker: { size: 40 } } },
                    series: [
                        {
                            type: 'line',
                            xKey: 'month',
                            yKey: 'subscriptions',
                            marker: { size: 35 },
                            styler: () => {
                                return {
                                    strokeWidth: 4,
                                    strokeOpacity: 0.5,
                                    stroke: 'fuchsia',
                                    lineDash: [9, 5, 4, 6],
                                    lineDashOffset: 7,
                                    marker: {
                                        strokeWidth: 7,
                                        strokeOpacity: 0.8,
                                        stroke: 'lime',
                                        lineDash: [7, 3, 2, 3],
                                        lineDashOffset: 7,
                                    },
                                };
                            },
                        },
                    ],
                });
                chart = AgCharts.create(options);
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
        });
    });

    describe('segmentation', () => {
        it('should render line series with segmentation styling on x-axis', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: 10 },
                    { x: 1, y: 20 },
                    { x: 2, y: 15 },
                    { x: 3, y: 25 },
                    { x: 4, y: 30 },
                    { x: 5, y: 35 },
                    { x: 6, y: 40 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 0, stop: 2, stroke: 'red', strokeWidth: 3 },
                                { start: 2, stop: 4, stroke: 'blue', strokeWidth: 2 },
                                { start: 4, stroke: 'green', strokeWidth: 4 },
                            ],
                        },
                    },
                ],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render line series with segmentation styling on y-axis', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 'A', y: 10 },
                    { x: 'B', y: 20 },
                    { x: 'C', y: 15 },
                    { x: 'D', y: 25 },
                    { x: 'E', y: 30 },
                    { x: 'F', y: 35 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'y',
                            segments: [
                                { start: 10, stop: 20, stroke: 'orange', strokeWidth: 2, lineDash: [5, 5] },
                                { start: 20, stop: 30, stroke: 'purple', strokeWidth: 3 },
                                { start: 30, stroke: 'cyan', strokeWidth: 4, lineDash: [10, 2] },
                            ],
                        },
                    },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render multiple line series with different segmentation', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y1: 10, y2: 5 },
                    { x: 1, y1: 20, y2: 15 },
                    { x: 2, y1: 15, y2: 25 },
                    { x: 3, y1: 25, y2: 20 },
                    { x: 4, y1: 30, y2: 35 },
                    { x: 5, y1: 35, y2: 30 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y1',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 0, stop: 2.5, stroke: 'red', strokeWidth: 2 },
                                { start: 2.5, stroke: 'blue', strokeWidth: 3 },
                            ],
                        },
                    },
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y2',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 0, stop: 3, stroke: 'green', strokeWidth: 2, lineDash: [3, 3] },
                                { start: 3, stroke: 'purple', strokeWidth: 2 },
                            ],
                        },
                    },
                ],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render line series with dashed segmentation from specific month', async () => {
            const options: AgChartOptions = {
                data: [
                    { month: 'Jan', value: 30 },
                    { month: 'Feb', value: 72 },
                    { month: 'Mar', value: 105 },
                    { month: 'Apr', value: 130 },
                    { month: 'May', value: 145 },
                    { month: 'Jun', value: 175 },
                    { month: 'Jul', value: 140 },
                    { month: 'Aug', value: 150 },
                    { month: 'Sep', value: 220 },
                    { month: 'Oct', value: 195 },
                    { month: 'Nov', value: 95 },
                    { month: 'Dec', value: 55 },
                ],
                title: {
                    text: 'Zone with dash style',
                },
                subtitle: {
                    text: 'Dotted line typically signifies prognosis',
                },
                series: [
                    {
                        type: 'line',
                        xKey: 'month',
                        yKey: 'value',
                        yName: 'Series 1',
                        marker: {
                            enabled: true,
                            size: 11,
                        },
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'Sep',
                                    strokeWidth: 3,
                                    lineDash: [3, 9],
                                },
                            ],
                        },
                    },
                ],
                axes: {
                    x: {
                        type: 'category',
                        position: 'bottom',
                    },
                    y: {
                        type: 'number',
                        position: 'left',
                        title: {
                            text: 'Values',
                        },
                        nice: true,
                    },
                },
                legend: {
                    position: 'bottom',
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render line series with financial data segmentation and special marker', async () => {
            const options: AgChartOptions = {
                data: [
                    { month: "Jan '24", value: 13.5e6 },
                    { month: "Feb '24", value: 12.9e6 },
                    { month: "Mar '24", value: 12.2e6 },
                    { month: "Apr '24", value: 11.6e6 },
                    { month: "May '24", value: 10.2e6 },
                    { month: "Jun '24", value: 9e6 },
                    { month: "Jul '24", value: 8.8e6 },
                    { month: "Aug '24", value: 8.3e6 },
                    { month: "Sep '24", value: 8e6 },
                    { month: "Oct '24", value: 7.6e6 },
                    { month: "Nov '24", value: 7.2e6 },
                    { month: "Dec '24", value: 7e6 },
                    { month: "Jan '25", value: 17.8e6 },
                    { month: "Feb '25", value: 17e6 },
                    { month: "Mar '25", value: 16e6 },
                    { month: "Apr '25", value: 15.2e6 },
                    { month: "May '25", value: 14e6 },
                    { month: "Jun '25", value: 12.5e6 },
                    { month: "Jul '25", value: 9e6 },
                ],
                padding: { top: 40, right: 10, bottom: 40, left: 60 },
                title: { text: 'Cash' },
                subtitle: {
                    text: '$8.241M • LAST CLOSE',
                    color: 'rgb(185, 192, 204)',
                    fontSize: 15,
                    fontWeight: 'bold',
                },
                series: [
                    {
                        type: 'line',
                        xKey: 'month',
                        yKey: 'value',
                        yName: 'Cash',
                        stroke: '#3b3743',
                        strokeWidth: 3,
                        strokeOpacity: 1,
                        marker: {
                            itemStyler: ({ datum }) => {
                                if (datum.month === "Aug '24") {
                                    return {
                                        size: 15,
                                        fill: '#3b3743',
                                        strokeWidth: 3,
                                        stroke: '#faf1f8',
                                    };
                                }
                                return {
                                    size: 0,
                                };
                            },
                        },
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: "Aug '24",
                                    stroke: 'rgb(92, 123, 187)',
                                    lineDash: [8, 6],
                                },
                            ],
                        },
                    },
                ],
                axes: {
                    x: {
                        type: 'category',
                        position: 'bottom',
                        paddingOuter: 0.8,
                        interval: {
                            values: ["Jan '24", "Apr '24", "Jul '24", "Oct '24", "Jan '25", "Apr '25", "Jul '25"],
                        },
                        line: {
                            enabled: false,
                        },
                        crossLines: [
                            {
                                type: 'range',
                                range: ["Jan '24", "Jul '25"],
                                fill: '#faf1f8',
                                fillOpacity: 0.7,
                                strokeWidth: 0,
                            },
                        ],
                        label: {
                            color: 'rgb(185, 192, 204)',
                            fontSize: 15,
                            fontWeight: 'bold',
                        },
                    },
                    y: {
                        type: 'number',
                        position: 'left',
                        nice: false,
                        min: 0,
                        max: 18e6,
                        interval: { values: [0, 4.5e6, 9e6, 13.5e6, 18e6] },
                        label: {
                            color: 'rgb(185, 192, 204)',
                            fontSize: 15,
                            fontWeight: 'bold',
                            formatter: ({ value }) => `${value / 1e6}M`,
                        },
                        gridLine: {
                            style: [
                                {
                                    stroke: 'grey',
                                    lineDash: [4, 6],
                                },
                            ],
                        },
                        line: {
                            enabled: false,
                        },
                    },
                },
                legend: { enabled: false },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render line series with missing start values in segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Jan', y: 10 },
                    { x: 'Feb', y: 15 },
                    { x: 'Mar', y: 12 },
                    { x: 'Apr', y: 18 },
                    { x: 'May', y: 22 },
                    { x: 'Jun', y: 25 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 'Jan', stop: 'Feb', stroke: 'red', strokeWidth: 3 },
                                { stop: 'Apr', stroke: 'blue', strokeWidth: 4, lineDash: [5, 3] }, // Missing start - should use 'Feb'
                                { stop: 'Jun', stroke: 'green', strokeWidth: 2, lineDash: [3, 2] }, // Missing start - should use 'Apr'
                            ],
                        },
                        marker: {
                            enabled: true,
                            fill: 'orange',
                            stroke: 'darkorange',
                            strokeWidth: 2,
                        },
                    },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render line series with missing stop values in segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Q1', y: 100 },
                    { x: 'Q2', y: 120 },
                    { x: 'Q3', y: 110 },
                    { x: 'Q4', y: 140 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 'Q1', stroke: '#ff4444', strokeWidth: 5 }, // Missing stop - should use 'Q2'
                                { start: 'Q2', stroke: '#4444ff', strokeWidth: 3, lineDash: [4, 4] }, // Missing stop - should use 'Q4'
                                { start: 'Q4', stop: 'Q4', stroke: '#44ff44', strokeWidth: 2 },
                            ],
                        },
                        marker: {
                            enabled: true,
                            shape: 'diamond',
                            size: 8,
                        },
                    },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render line series with Y-axis segmentation and missing values', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'A', y: 5 },
                    { x: 'B', y: 15 },
                    { x: 'C', y: 25 },
                    { x: 'D', y: 35 },
                    { x: 'E', y: 45 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'y',
                            segments: [
                                { start: 0, stop: 20, stroke: 'crimson', strokeWidth: 4 },
                                { stop: 40, stroke: 'mediumblue', strokeWidth: 3, lineDash: [6, 2] }, // Missing start - should use 20
                                { start: 40, stroke: 'forestgreen', strokeWidth: 5 }, // Missing stop - should extend to max
                            ],
                        },
                        marker: {
                            enabled: true,
                            fill: 'gold',
                            stroke: 'orange',
                            strokeWidth: 1,
                            shape: 'triangle',
                        },
                    },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render line series with complex missing values pattern', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                    { x: 3, y: 15 },
                    { x: 4, y: 25 },
                    { x: 5, y: 30 },
                    { x: 6, y: 28 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 1, stop: 2, stroke: 'red', strokeWidth: 3 },
                                { stroke: 'blue', strokeWidth: 4 }, // Missing both start/stop - should bridge from 2 to 4
                                { start: 4, stroke: 'green', strokeWidth: 2, lineDash: [5, 5] }, // Missing stop - should extend to end
                            ],
                        },
                        marker: {
                            enabled: true,
                            size: 6,
                            shape: 'square',
                        },
                    },
                ],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('cutout drawing mode', () => {
        it('should render line series with cutout highlight drawing mode', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 1, y: 10 },
                    { x: 2, y: 25 },
                    { x: 3, y: 15 },
                    { x: 4, y: 30 },
                    { x: 5, y: 20 },
                    { x: 6, y: 35 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        title: 'Line Series',
                        marker: {
                            enabled: true,
                            size: 25,
                            shape: 'circle',
                        },
                        highlight: {
                            highlightedItem: {
                                fill: 'blue',
                                fillOpacity: 0.2,
                                stroke: 'black',
                                lineDash: [4, 2],
                            },
                        },
                    },
                ],
                highlight: {
                    drawingMode: 'cutout',
                },
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);

            await waitForChartStability(chart);
            await hoverAction(250, 300)(chart);
            await compare();
        });

        it('should render multi-line series with cutout highlight drawing mode', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { month: 'Jan', sales: 100, expenses: 80 },
                    { month: 'Feb', sales: 120, expenses: 90 },
                    { month: 'Mar', sales: 110, expenses: 85 },
                    { month: 'Apr', sales: 140, expenses: 100 },
                    { month: 'May', sales: 130, expenses: 95 },
                    { month: 'Jun', sales: 150, expenses: 110 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'month',
                        yKey: 'sales',
                        title: 'Sales',
                        marker: {
                            enabled: true,
                            size: 25,
                            shape: 'square',
                        },
                        strokeWidth: 3,
                        highlight: {
                            highlightedItem: {
                                fill: 'blue',
                                fillOpacity: 0.2,
                                stroke: 'white',
                                lineDash: [4, 2],
                            },
                        },
                    },
                    {
                        type: 'line',
                        xKey: 'month',
                        yKey: 'expenses',
                        title: 'Expenses',
                        marker: {
                            enabled: true,
                            size: 25,
                            shape: 'triangle',
                        },
                        strokeWidth: 3,
                    },
                ],
                highlight: {
                    drawingMode: 'cutout',
                },
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);

            await waitForChartStability(chart);
            await hoverAction(200, 250)(chart);
            await compare();
        });

        it('should render line series with default highlight style cutout highlight drawing mode', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 1, y: 5 },
                    { x: 2, y: 15 },
                    { x: 3, y: 10 },
                    { x: 4, y: 20 },
                    { x: 5, y: 12 },
                    { x: 6, y: 18 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        marker: {
                            enabled: true,
                            size: 25,
                            shape: 'diamond',
                        },
                        strokeWidth: 2,
                    },
                ],
                highlight: {
                    drawingMode: 'cutout',
                },
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);

            await waitForChartStability(chart);
            await hoverAction(300, 280)(chart);
            await compare();
        });

        it('should use cutout on dimmed non-highlight markers to mask the line', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 1, y: 5 },
                    { x: 2, y: 15 },
                    { x: 3, y: 10 },
                    { x: 4, y: 20 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        strokeWidth: 5,
                        marker: {
                            enabled: true,
                            size: 28,
                            shape: 'circle',
                        },
                        highlight: {
                            unhighlightedItem: {
                                fillOpacity: 0.4,
                                strokeOpacity: 0.4,
                            },
                        },
                    },
                ],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);

            await waitForChartStability(chart);
            await hoverAction(300, 280)(chart);
            await waitForChartStability(chart);
            await compare();
        });

        it('should dim non-highlight markers with cutout in multi-series default highlight style', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { month: 'Jan', sales: 100, expenses: 80 },
                    { month: 'Feb', sales: 120, expenses: 90 },
                    { month: 'Mar', sales: 110, expenses: 85 },
                    { month: 'Apr', sales: 140, expenses: 100 },
                    { month: 'May', sales: 130, expenses: 95 },
                    { month: 'Jun', sales: 150, expenses: 110 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'month',
                        yKey: 'sales',
                        strokeWidth: 5,
                        marker: {
                            enabled: true,
                            size: 28,
                            shape: 'circle',
                        },
                    },
                    {
                        type: 'line',
                        xKey: 'month',
                        yKey: 'expenses',
                        strokeWidth: 5,
                        marker: {
                            enabled: true,
                            size: 28,
                            shape: 'triangle',
                        },
                    },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);

            await waitForChartStability(chart);
            await hoverAction(220, 250)(chart);
            await waitForChartStability(chart);
            await compare();
        });
    });

    describe('AG-15743 legendItemName', () => {
        testLegendItemName({
            create: (o) => (chart = AgCharts.create(prepareTestOptions(o))),
            compare,
            chartOptions: {
                data: [{ x: 'Value', s1: 100, s2: 200, s3: 300 }],
                series: [
                    { type: 'line', xKey: 'x', yKey: 's1', yName: 'series 1' },
                    { type: 'line', xKey: 'x', yKey: 's2', yName: 'series 2' },
                    { type: 'line', xKey: 'x', yKey: 's3', yName: 'series 3' },
                ],
            },
        });
    });
});
