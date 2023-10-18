import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

import type { AgChartOptions } from '../../../options/agChartOptions';
import { AgChart } from '../../agChartV2';
import type { Chart } from '../../chart';
import {
    DATA_FRACTIONAL_LOG_AXIS,
    DATA_INVALID_DOMAIN_LOG_AXIS,
    DATA_NEGATIVE_LOG_AXIS,
    DATA_POSITIVE_LOG_AXIS,
    DATA_ZERO_EXTENT_LOG_AXIS,
} from '../../test/data';
import * as examples from '../../test/examples';
import type { TestCase } from '../../test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    extractImageData,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    spyOnAnimationManager,
    waitForChartStability,
} from '../../test/utils';

expect.extend({ toMatchImageSnapshot });

const buildLogAxisTestCase = (data: any[]): TestCase => {
    return {
        options: examples.CARTESIAN_CATEGORY_X_AXIS_LOG_Y_AXIS(data, 'line'),
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'log'], seriesTypes: ['line'] }),
    };
};

const EXAMPLES: Record<string, TestCase> = {
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
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['line'] }),
    },
    LINE_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE: {
        options: examples.LINE_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: ['line'] }),
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
};

const INVALID_DATA_EXAMPLES: Record<string, TestCase> = {
    LINE_CATEGORY_X_AXIS_INVALID_DOMAIN_LOG_Y_AXIS: buildLogAxisTestCase(DATA_INVALID_DOMAIN_LOG_AXIS),
};

describe('LineSeries', () => {
    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    let chart: Chart;

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

        afterEach(() => {
            expect(console.warn).not.toBeCalled();
        });

        for (const [exampleName, example] of Object.entries(EXAMPLES)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgChart.create(options) as Chart;
                await waitForChartStability(chart);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgChart.create(options) as Chart;
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            });
        }
    });

    describe('initial animation', () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for LINE_CATEGORY_X_AXIS_FRACTIONAL_LOG_Y_AXIS should animate at ${ratio * 100}%`, async () => {
                spyOnAnimationManager(1200, ratio);

                const options: AgChartOptions = examples.CARTESIAN_CATEGORY_X_AXIS_LOG_Y_AXIS(
                    DATA_FRACTIONAL_LOG_AXIS,
                    'line'
                );
                prepareTestOptions(options);

                chart = AgChart.create(options) as Chart;
                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('animation', () => {
        const data = [
            { quarter: 'week 3', iphone: 60 },
            { quarter: 'week 4', iphone: 185 },
            { quarter: 'week 5', iphone: 148 },
            { quarter: 'week 6', iphone: 130 },
            { quarter: 'week 9', iphone: 62 },
            { quarter: 'week 10', iphone: 137 },
            { quarter: 'week 11', iphone: 121 },
        ];

        const options: AgChartOptions = {
            data,
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
            ['removing points', [...data.slice(0, 2), ...data.slice(4)]],
            ['removing the first point', [...data.slice(1)]],
            ['removing the last point', [...data.slice(0, -1)]],
            [
                'adding points',
                [
                    ...data.slice(0, 4),
                    { quarter: 'week 7', iphone: 142 },
                    { quarter: 'week 8', iphone: 87 },
                    ...data.slice(4),
                ],
            ],
            ['adding points before', [{ quarter: 'week 1', iphone: 89 }, { quarter: 'week 2', iphone: 110 }, ...data]],
            ['adding points after', [...data, { quarter: 'week 12', iphone: 78 }, { quarter: 'week 13', iphone: 138 }]],
            [
                'updating points',
                [
                    ...data.slice(0, 2),
                    { quarter: 'week 5', iphone: 190 },
                    { quarter: 'week 6', iphone: 38 },
                    ...data.slice(4),
                ],
            ],
            [
                'updating points to undefined',
                [...data.slice(0, 2), { quarter: 'week 5', iphone: undefined }, ...data.slice(3)],
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
                    spyOnAnimationManager(1200, 1);
                    prepareTestOptions(options);
                    chart = AgChart.create(options) as Chart;
                    await waitForChartStability(chart);

                    spyOnAnimationManager(duration, ratio);
                    AgChart.updateDelta(chart, { data: changedData });
                    await waitForChartStability(chart);
                    await compare();
                });
            }
        }

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it.skip(`should animate with short-circuiting when run again before it finishes at ${
                ratio * 100
            }%`, async () => {
                spyOnAnimationManager(1200, 1);
                prepareTestOptions(options);
                chart = AgChart.create(options) as Chart;
                await waitForChartStability(chart);

                const changedDataA = [...data, { quarter: 'week 12', iphone: 78 }];
                const changedDataB = [...data, { quarter: 'week 12', iphone: 78 }, { quarter: 'week 13', iphone: 138 }];

                spyOnAnimationManager(1200, ratio);

                AgChart.updateDelta(chart, { data: changedDataA });
                await waitForChartStability(chart);

                AgChart.updateDelta(chart, { data: changedDataB });
                await compare();
            });
        }
    });

    describe('invalid data domain', () => {
        beforeEach(() => {
            console.warn = jest.fn();
        });

        for (const [exampleName, example] of Object.entries(INVALID_DATA_EXAMPLES)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgChart.create(options) as Chart;
                await waitForChartStability(chart);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgChart.create(options) as Chart;
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }

                expect(console.warn).toBeCalled();
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

            chart = AgChart.create(options) as Chart;
            await compare();
        });
    });
});
