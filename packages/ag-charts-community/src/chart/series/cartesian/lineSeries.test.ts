import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import { deepClone } from '../../../util/json';
import {
    DATA_FRACTIONAL_LOG_AXIS,
    DATA_INVALID_DOMAIN_LOG_AXIS,
    DATA_NEGATIVE_LOG_AXIS,
    DATA_POSITIVE_LOG_AXIS,
    DATA_ZERO_EXTENT_LOG_AXIS,
} from '../../test/data';
import * as examples from '../../test/examples';
import type { CartesianOrPolarTestCase } from '../../test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    extractImageData,
    mixinReversedAxesCases,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    spyOnAnimationManager,
    waitForChartStability,
} from '../../test/utils';

const buildLogAxisTestCase = (
    data: any[],
    extra?: { warnings?: string[]; skipWarningsReversed?: boolean }
): CartesianOrPolarTestCase => {
    return {
        options: examples.CARTESIAN_CATEGORY_X_AXIS_LOG_Y_AXIS(data, 'line'),
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'log'], seriesTypes: ['line'] }),
        ...extra,
    };
};

const EXAMPLES: Record<string, CartesianOrPolarTestCase> = {
    ...mixinReversedAxesCases({
        LINE_TIME_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.LINE_TIME_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
        },
        LINE_NUMBER_X_AXIS_TIME_Y_AXIS: {
            options: examples.LINE_NUMBER_X_AXIS_TIME_Y_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: ['number', 'time'], seriesTypes: repeat('line', 2) }),
        },
        LINE_MISSING_Y_DATA_EXAMPLE: {
            options: examples.LINE_MISSING_Y_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['line'] }),
        },
        LINE_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE: {
            options: examples.LINE_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'number'],
                seriesTypes: ['line'],
            }),
            warnings: [
                ['AG Charts - invalid value of type [undefined] for [LineSeries-1 / xValue] ignored:', '[undefined]'],
            ],
        },
        LINE_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE: {
            options: examples.LINE_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: ['time', 'number'],
                seriesTypes: ['line'],
            }),
            warnings: [['AG Charts - invalid value of type [object] for [LineSeries-1 / xValue] ignored:', '[null]']],
        },
        LINE_NUMBER_AXES_0_X_DOMAIN: {
            options: examples.LINE_NUMBER_AXES_0_X_DOMAIN,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'number'],
                seriesTypes: repeat('line', 2),
            }),
        },
        LINE_NUMBER_AXES_0_Y_DOMAIN: {
            options: examples.LINE_NUMBER_AXES_0_Y_DOMAIN,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'number'],
                seriesTypes: repeat('line', 2),
            }),
        },
        LINE_TIME_X_AXIS_NUMBER_Y_AXIS_LABELS: {
            options: examples.LINE_TIME_X_AXIS_NUMBER_Y_AXIS_LABELS,
            assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: ['line'] }),
        },
        LINE_TIME_X_AXIS_POSITION_TOP_NUMBER_Y_AXIS_LABELS: {
            options: examples.LINE_TIME_X_AXIS_POSITION_TOP_NUMBER_Y_AXIS_LABELS,
            assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: ['line'] }),
        },
        LINE_TIME_X_AXIS_NUMBER_Y_AXIS_POSITION_RIGHT_LABELS: {
            options: examples.LINE_TIME_X_AXIS_NUMBER_Y_AXIS_POSITION_RIGHT_LABELS,
            assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: ['line'] }),
        },
        LINE_CATEGORY_X_AXIS_POSITIVE_LOG_Y_AXIS: buildLogAxisTestCase(DATA_POSITIVE_LOG_AXIS),
        LINE_CATEGORY_X_AXIS_NEGATIVE_LOG_Y_AXIS: buildLogAxisTestCase(DATA_NEGATIVE_LOG_AXIS),
        LINE_CATEGORY_X_AXIS_FRACTIONAL_LOG_Y_AXIS: buildLogAxisTestCase(DATA_FRACTIONAL_LOG_AXIS),
        LINE_CATEGORY_X_AXIS_ZERO_EXTENT_LOG_Y_AXIS: buildLogAxisTestCase(DATA_ZERO_EXTENT_LOG_AXIS),
        LINE_CATEGORY_X_AXIS_INVALID_DOMAIN_LOG_Y_AXIS: buildLogAxisTestCase(DATA_INVALID_DOMAIN_LOG_AXIS, {
            warnings: [
                'AG Charts - the data domain crosses zero, the chart data cannot be rendered. See log axis documentation for more information.',
            ],
            skipWarningsReversed: false,
        }),
    }),
};

describe('LineSeries', () => {
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

                warnings.forEach((message, index) => {
                    // eslint-disable-next-line no-console
                    expect(console.warn).toHaveBeenNthCalledWith(
                        index + 1,
                        ...(Array.isArray(message) ? message : [message])
                    );
                });
                if (warnings.length === 0) {
                    // eslint-disable-next-line no-console
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
            axes: [
                {
                    position: 'left',
                    type: 'number',
                    keys: ['iphone'],
                },
                {
                    position: 'bottom',
                    type: 'category',
                },
            ],
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
            axes: [
                {
                    position: 'left',
                    type: 'number',
                },
                {
                    position: 'bottom',
                    type: 'category',
                },
            ],
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
    });
});
