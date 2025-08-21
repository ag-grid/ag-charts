import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type {
    AgBarSeriesItemStylerParams,
    AgBarSeriesLabelPlacement,
    AgBarSeriesOptions,
    AgBarSeriesStyle,
    AgBarSeriesStylerParams,
    AgCartesianChartOptions,
    AgChartInstance,
    AgChartOptions,
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
import { MockBarStyler, newFreezableMock } from '../../test/freezableMock';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    PATTERN_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    expectWarningsCalls,
    extractImageData,
    mixinReversedAxesCases,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    waitForChartStability,
} from '../../test/utils';
import type { CartesianOrPolarTestCase } from '../../test/utils';

const buildLogAxisTestCase = (
    data: any[],
    extra?: { warnings?: string[]; skipWarningsReversed?: boolean }
): CartesianOrPolarTestCase => {
    return {
        options: examples.CARTESIAN_CATEGORY_X_AXIS_LOG_Y_AXIS(data, 'bar'),
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'log'], seriesTypes: ['bar'] }),
        ...extra,
    };
};

const EXAMPLES: Record<string, CartesianOrPolarTestCase> = {
    ...mixinReversedAxesCases({
        COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['bar'] }),
        },
        COLUMN_TIME_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.COLUMN_TIME_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: ['unit-time', 'number'], seriesTypes: ['bar'] }),
        },
        STACKED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.STACKED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'number'],
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.GROUPED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'number'],
                seriesTypes: repeat('bar', 4),
            }),
        },
        BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['bar'] }),
        },
        BAR_TIME_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.BAR_TIME_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: ['unit-time', 'number'], seriesTypes: ['bar'] }),
        },
        STACKED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.STACKED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'number'],
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_NORMALISED_SINGLE_BAR_COLUMN_NUMBER_Y_AXIS: {
            options: {
                ...examples.STACKED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS,
                series: [
                    {
                        ...(examples.STACKED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS.series?.[0] as AgBarSeriesOptions),
                        type: 'bar',
                        normalizedTo: 100,
                    },
                ],
            } satisfies AgCartesianChartOptions,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'number'],
                seriesTypes: repeat('bar', 1),
            }),
        },
        UNSTACKED_NORMALISED_SINGLE_BAR_COLUMN_NUMBER_Y_AXIS: {
            options: {
                ...examples.STACKED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS,
                series: [
                    {
                        ...(examples.STACKED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS.series?.[0] as AgBarSeriesOptions),
                        type: 'bar',
                        stacked: false,
                        normalizedTo: 100,
                    },
                ],
            } satisfies AgCartesianChartOptions,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'number'],
                seriesTypes: repeat('bar', 1),
            }),
        },
        STACKED_BAR_NUMBER_X_AXIS_NEGATIVE_NUMBER_Y_AXIS: {
            options: examples.STACKED_BAR_NUMBER_X_AXIS_NEGATIVE_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: ['category', 'number'],
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.GROUPED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'number'],
                seriesTypes: repeat('bar', 4),
            }),
        },
        COLUMN_CATEGORY_X_AXIS_POSITIVE_LOG_Y_AXIS: buildLogAxisTestCase(DATA_POSITIVE_LOG_AXIS),
        COLUMN_CATEGORY_X_AXIS_NEGATIVE_LOG_Y_AXIS: buildLogAxisTestCase(DATA_NEGATIVE_LOG_AXIS),
        COLUMN_CATEGORY_X_AXIS_FRACTIONAL_LOG_Y_AXIS: buildLogAxisTestCase(DATA_FRACTIONAL_LOG_AXIS),
        COLUMN_CATEGORY_X_AXIS_ZERO_EXTENT_LOG_Y_AXIS: buildLogAxisTestCase(DATA_ZERO_EXTENT_LOG_AXIS, {
            warnings: [
                'AG Charts - The log axis domain contains a value of 0, the chart data cannot be rendered. See log axis documentation for more information.',
            ],
            skipWarningsReversed: false,
        }),
        COLUMN_SINGLE_DATE_CATEGORY_AXIS: {
            options: examples.COLUMN_SINGLE_DATE_CATEGORY_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['bar'] }),
        },
        COLUMN_SINGLE_DATE_TIME_AXIS: {
            options: examples.COLUMN_SINGLE_DATE_TIME_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: ['unit-time', 'number'], seriesTypes: ['bar'] }),
        },
        GROUPED_COLUMN_CATEGORY_DATA_PER_SERIES: {
            options: examples.GROUPED_COLUMN_CATEGORY_DATA_PER_SERIES,
            assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: repeat('bar', 5) }),
        },
        STACKED_COLUMN_CATEGORY_DATA_PER_SERIES: {
            options: examples.STACKED_COLUMN_CATEGORY_DATA_PER_SERIES,
            assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: repeat('bar', 5) }),
        },
        STACKED_COLUMN_CATEGORY_DATA_PER_SERIES_CLASHING: {
            options: examples.STACKED_COLUMN_CATEGORY_DATA_PER_SERIES_CLASHING,
            assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: repeat('bar', 5) }),
        },
        GROUPED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES: {
            options: examples.GROUPED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES,
            assertions: cartesianChartAssertions({ axisTypes: ['number', 'category'], seriesTypes: repeat('bar', 2) }),
        },
        STACKED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES: {
            options: examples.STACKED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES,
            assertions: cartesianChartAssertions({ axisTypes: ['number', 'category'], seriesTypes: repeat('bar', 2) }),
        },
        STACKED_NORMALIZED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES: {
            options: examples.STACKED_NORMALIZED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES,
            assertions: cartesianChartAssertions({ axisTypes: ['number', 'category'], seriesTypes: repeat('bar', 4) }),
        },
        STACKED_COLUMN_GRADIENT_FILL: {
            options: examples.STACKED_COLUMN_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'category'],
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_COLUMN_HORIZONTAL_GRADIENT_FILL: {
            options: examples.STACKED_COLUMN_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'category'],
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_COLUMN_SERIES_BOUND_VERTICAL_GRADIENT_FILL: {
            options: examples.STACKED_COLUMN_SERIES_BOUND_VERTICAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'category'],
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_COLUMN_SERIES_BOUND_HORIZONTAL_GRADIENT_FILL: {
            options: examples.STACKED_COLUMN_SERIES_BOUND_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'category'],
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_COLUMN_AXES_BOUND_VERTICAL_GRADIENT_FILL: {
            options: examples.STACKED_COLUMN_AXES_BOUND_VERTICAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'category'],
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_COLUMN_AXES_BOUND_HORIZONTAL_GRADIENT_FILL: {
            options: examples.STACKED_COLUMN_AXES_BOUND_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'category'],
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_GRADIENT_FILL: {
            options: examples.GROUPED_COLUMN_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'category'],
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_HORIZONTAL_GRADIENT_FILL: {
            options: examples.GROUPED_COLUMN_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'category'],
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_SERIES_BOUND_VERTICAL_GRADIENT_FILL: {
            options: examples.GROUPED_COLUMN_SERIES_BOUND_VERTICAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'category'],
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_SERIES_BOUND_HORIZONTAL_GRADIENT_FILL: {
            options: examples.GROUPED_COLUMN_SERIES_BOUND_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'category'],
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_AXES_BOUND_VERTICAL_GRADIENT_FILL: {
            options: examples.GROUPED_COLUMN_AXES_BOUND_VERTICAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'category'],
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_AXES_BOUND_HORIZONTAL_GRADIENT_FILL: {
            options: examples.GROUPED_COLUMN_AXES_BOUND_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'category'],
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_COLUMN_PATTERN_FILL: {
            options: examples.STACKED_COLUMN_PATTERN_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'category'],
                seriesTypes: repeat('bar', 4),
            }),
            imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
        },
        GROUPED_COLUMN_PATTERN_FILL: {
            options: examples.GROUPED_COLUMN_PATTERN_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'category'],
                seriesTypes: repeat('bar', 4),
            }),
            imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
        },
        GROUPED_COLUMN_SMALL_PATTERN_FILL: {
            options: examples.GROUPED_COLUMN_SMALL_PATTERN_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'category'],
                seriesTypes: repeat('bar', 4),
            }),
            imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
        },
    }),
};

const INVALID_DATA_EXAMPLES: Record<string, CartesianOrPolarTestCase> = {
    COLUMN_CATEGORY_X_AXIS_INVALID_DOMAIN_LOG_Y_AXIS: buildLogAxisTestCase(DATA_INVALID_DOMAIN_LOG_AXIS),
};

describe('BarSeries', () => {
    setupMockConsole();

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        jest.restoreAllMocks();
    });

    const ctx = setupMockCanvas();

    const compare = async (defaults = IMAGE_SNAPSHOT_DEFAULTS) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(defaults);
    };

    describe('#create', () => {
        beforeEach(() => {
            console.warn = jest.fn();
        });

        test('no data', async () => {
            chart = AgCharts.create(prepareTestOptions({ data: [], series: [{ type: 'bar', xKey: 'x', yKey: 'y' }] }));
            await compare();
        });

        it.each(Object.entries(EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await example.assertions(chart);

                example.warnings?.forEach((message, index) => {
                    expect(console.warn).toHaveBeenNthCalledWith(
                        index + 1,
                        ...(Array.isArray(message) ? message : [message])
                    );
                });
                if (!example.warnings?.length) {
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
                await compare(example.imageSnapshotDefaults);

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare(example.imageSnapshotDefaults);
                }
            }
        );
    });

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for COLUMN_TIME_X_AXIS_NUMBER_Y_AXIS should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = { ...examples.COLUMN_TIME_X_AXIS_NUMBER_Y_AXIS };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await compare();
            });
        }

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = { ...examples.BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('remove animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for COLUMN_TIME_X_AXIS_NUMBER_Y_AXIS should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = { ...examples.COLUMN_TIME_X_AXIS_NUMBER_Y_AXIS };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({
                    data: [...options.data!.slice(2, 4), ...options.data!.slice(6, -2)],
                });

                await waitForChartStability(chart);
                await compare();
            });
        }

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = { ...examples.BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({
                    data: options.data!.slice(0, options.data!.length / 2),
                });

                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('add animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for COLUMN_TIME_X_AXIS_NUMBER_Y_AXIS should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = { ...examples.COLUMN_TIME_X_AXIS_NUMBER_Y_AXIS };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                await chart.updateDelta({
                    data: [...options.data!.slice(2, 4), ...options.data!.slice(6, -2)],
                });
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.update(options);

                await waitForChartStability(chart);
                await compare();
            });
        }

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = { ...examples.BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                await chart.updateDelta({
                    data: options.data!.slice(0, options.data!.length / 2),
                });
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.update(options);

                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('update animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for COLUMN_TIME_X_AXIS_NUMBER_Y_AXIS should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = { ...examples.COLUMN_TIME_X_AXIS_NUMBER_Y_AXIS };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({
                    data: [...options.data!.map((d, i) => (i % 2 === 0 ? { ...d, value: d.value * 2 } : d))],
                });

                await waitForChartStability(chart);
                await compare();
            });
        }

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = { ...examples.BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({
                    data: [...options.data!.map((d, i) => (i % 2 === 0 ? { ...d, value: d.value * 2 } : d))],
                });

                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('legend toggle animation', () => {
        const animate = spyOnAnimationManager();

        let options: AgChartOptions;

        beforeEach(() => {
            options = { ...examples.BAR_CHART_WITH_LABELS_EXAMPLE };
            prepareTestOptions(options);
            options.series = [options.series![0], { ...options.series![0], visible: true }];
            options.data = options.data?.slice(0, 3);
        });

        it('should render to canvas as expected', async () => {
            animate(1200, 1);
            chart = AgCharts.create(options);
            await compare();
        });

        for (const ratio of [0, 0.2, 0.5, 0.8, 0.9, 1]) {
            it(`for BAR_CHART_WITH_LABELS_EXAMPLE should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                (options.series![1] as AgBarSeriesOptions).visible = false;
                await chart.update(options);

                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('invalid data domain', () => {
        it.each(Object.entries(INVALID_DATA_EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await example.assertions(chart);

                expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - The log axis domain crosses zero, the chart data cannot be rendered. See log axis documentation for more information.",
  ],
]
`);
            }
        );

        it.each(Object.entries(INVALID_DATA_EXAMPLES))(
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

                expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - The log axis domain crosses zero, the chart data cannot be rendered. See log axis documentation for more information.",
  ],
]
`);
            }
        );
    });

    describe('label placement', () => {
        describe.each(['inside-start', 'inside-end', 'outside-start', 'outside-end'] as const)(
            'renders label placement %s',
            (placement) => {
                it.each(['horizontal', 'vertical'] as const)('direction %s', async (direction) => {
                    const options: AgChartOptions = {
                        data: [
                            { x: 'a', y: 100 },
                            { x: 'b', y: -100 },
                            { x: 'c', y: 200 },
                            { x: 'd', y: -200 },
                        ],
                        series: [
                            {
                                type: 'bar',
                                direction,
                                xKey: 'x',
                                yKey: 'y',
                                label: {
                                    placement,
                                    padding: 10,
                                    color: 'black',
                                },
                            },
                        ],
                    };

                    prepareTestOptions(options);

                    chart = AgCharts.create(options);
                    await compare();
                });
            }
        );
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
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        itemStyler: (params) => {
                            if (params.first) return { fill: 'red' };
                            if (params.min) return { fill: 'yellow' };
                            if (params.max) return { fill: 'green' };
                            if (params.last) return { fill: 'blue' };
                        },
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('complex fills', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 'a', y: 100 },
                    { x: 'b', y: -100 },
                    { x: 'c', y: 200 },
                    { x: 'd', y: 100 },
                    { x: 'e', y: 150 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        itemStyler: (params) => {
                            if (params.first) return { fill: { type: 'gradient' } };
                            if (params.min) return { fill: { type: 'pattern' } };
                            if (params.max) return { fill: { type: 'pattern', pattern: 'squares' } };
                            if (params.last) {
                                return {
                                    fill: { type: 'gradient', colorStops: [{ color: 'red' }, { color: 'blue' }] },
                                };
                            }
                            return { fill: { type: 'gradient' } };
                        },
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('complex fills over default fill', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 'a', y: 100 },
                    { x: 'b', y: -100 },
                    { x: 'c', y: 200 },
                    { x: 'd', y: 100 },
                    { x: 'e', y: 150 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        fill: 'red',
                        itemStyler: (params) => {
                            if (params.first) return { fill: { type: 'gradient' } };
                            if (params.min) return { fill: { type: 'pattern' } };
                            if (params.max) return { fill: { type: 'pattern', pattern: 'squares' } };
                            if (params.last) {
                                return {
                                    fill: { type: 'gradient', colorStops: [{ color: 'red' }, { color: 'blue' }] },
                                };
                            }
                            return { fill: { type: 'gradient' } };
                        },
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('AG-8290', () => {
        async function testCase(
            labelOpts: { placement: AgBarSeriesLabelPlacement; padding?: number; spacing?: number },
            name: string
        ) {
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { x: '1', y: 140 },
                        { x: '2', y: 124 },
                        { x: '3', y: 112 },
                        { x: '4', y: 118 },
                    ],
                    series: [{ type: 'bar', xKey: 'x', yKey: 'y', label: { ...labelOpts } }],
                })
            );
            await compare({ failureThreshold: 0, failureThresholdType: 'percent', customSnapshotIdentifier: name });
        }
        describe('padding backward compatibility', () => {
            test('inside-start', async () => {
                await testCase({ placement: 'inside-start', padding: 30 }, 'AG-8290-bar-label-spacing-inside-start');
            });
            test('inside-end', async () => {
                await testCase({ placement: 'inside-end', padding: 30 }, 'AG-8290-bar-label-spacing-inside-end');
            });
            test('outside-start', async () => {
                await testCase({ placement: 'outside-start', padding: 30 }, 'AG-8290-bar-label-spacing-outside-start');
            });
            test('outside-end', async () => {
                await testCase({ placement: 'outside-end', padding: 30 }, 'AG-8290-bar-label-spacing-outside-end');
            });
        });
        describe('spacing backward compatibility', () => {
            test('inside-start', async () => {
                await testCase({ placement: 'inside-start', spacing: 30 }, 'AG-8290-bar-label-spacing-inside-start');
            });
            test('inside-end', async () => {
                await testCase({ placement: 'inside-end', spacing: 30 }, 'AG-8290-bar-label-spacing-inside-end');
            });
            test('outside-start', async () => {
                await testCase({ placement: 'outside-start', spacing: 30 }, 'AG-8290-bar-label-spacing-outside-start');
            });
            test('outside-end', async () => {
                await testCase({ placement: 'outside-end', spacing: 30 }, 'AG-8290-bar-label-spacing-outside-end');
            });
        });
    });

    describe('AG-15448', () => {
        const DATA1 = [
            { year: '2016', visitors: 46636720, status: 1 },
            { year: '2017', visitors: 48772922, status: 1 },
            { year: '2018', visitors: 50800193, status: 1 },
            { year: '2019', visitors: 48023342, status: 2 },
            { year: '2022', visitors: 49441678, status: 2 }, // This overlaps with the DATA2 dataset and can render in the wrong color.
            { year: '2023', visitors: 50368190, status: 1 },
        ];

        const DATA2 = [
            { year: '2020', visitors: 48772922, status: 2 },
            { year: '2021', visitors: 47155093, status: 1 },
            { year: '2022', visitors: 48772982, status: 2 },
        ];

        const EXAMPLE_OPTIONS: AgCartesianChartOptions<
            { year: string; visitors: number; status: number },
            { colors: Record<number, string> }
        > = {
            context: { colors: { 1: 'orange', 2: 'green' } },
            data: DATA1,
            series: [
                {
                    type: 'bar',
                    xKey: 'year',
                    yKey: 'visitors',
                    label: { formatter: ({ datum, context }) => context?.colors[datum.status] ?? 'none' },
                    itemStyler: ({ datum, context }) => ({
                        fill: context?.colors[datum.status] ?? 'none',
                    }),
                },
            ],
        };

        it('should render updated data in the itemStyler specified colors', async () => {
            const options = { ...EXAMPLE_OPTIONS };
            prepareTestOptions(options);

            chart = AgCharts.create(options) as AgChartInstance;
            await waitForChartStability(chart);
            await chart.updateDelta({ data: DATA2 });
            await compare();
        });
    });

    describe('AG-11673 styler', () => {
        type D = unknown;
        type C = unknown;
        type M = MockBarStyler<D, C>;
        let styler: ReturnType<typeof newFreezableMock<D, C, M>>;
        const data = [
            { month: 'January', sales: 1200, expenses: 800 },
            { month: 'February', sales: 1500, expenses: 950 },
            { month: 'March', sales: 1700, expenses: 1100 },
        ];
        beforeEach(() => {
            styler = newFreezableMock<D, C, M>(
                (params: AgBarSeriesStylerParams<D, C>): AgBarSeriesStyle | undefined => {
                    if (params.yKey === 'sales')
                        return {
                            fill: 'cyan',
                            lineDash: [3, 3],
                            lineDashOffset: 5,
                            stroke: 'blue',
                            strokeWidth: 7,
                        };
                    else if (params.yKey === 'expenses')
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
                c1 = { name: 'sales context' };
                c2 = { name: 'expenses context' };
                chart = AgCharts.create(
                    prepareTestOptions({
                        data,
                        series: [
                            { type: 'bar', xKey: 'month', yKey: 'sales', styler: styler.frozen, context: c1 },
                            { type: 'bar', xKey: 'month', yKey: 'expenses', styler: styler.frozen, context: c2 },
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
                    styler.expect().nthCalledWithContext(2, c1);
                    styler.expect().nthCalledWithContext(3, c1);
                    styler.expect().nthCalledWithContext(4, c1);
                    styler.expect().nthCalledWithContext(5, c1);
                    styler.expect().nthCalledWithContext(6, c1);
                    styler.expect().nthCalledWithContext(7, c1);
                    styler.expect().nthCalledWithContext(8, c2);
                    styler.expect().nthCalledWithContext(9, c2);
                    styler.expect().nthCalledWithContext(10, c2);
                    styler.expect().nthCalledWithContext(11, c2);
                    styler.expect().nthCalledWithContext(12, c2);
                    styler.expect().nthCalledWithContext(13, c2);
                    styler.expect().toHaveBeenCalledTimes(14);
                });
                test('params', () => {
                    const defaults = {
                        cornerRadius: 0,
                        fillOpacity: 1,
                        highlighted: false,
                        lineDash: [0],
                        lineDashOffset: 0,
                        stackGroup: undefined,
                        strokeOpacity: 1,
                        strokeWidth: 0,
                        xKey: 'month',
                    } as const;
                    const params1 = {
                        ...defaults,
                        fill: '#f3622d',
                        seriesId: 'BarSeries-1',
                        stroke: '#aa4520',
                        yKey: 'sales',
                        context: c1,
                    } as const;
                    const params2 = {
                        ...defaults,
                        fill: '#fba71b',
                        seriesId: 'BarSeries-2',
                        stroke: '#b07513',
                        yKey: 'expenses',
                        context: { name: 'expenses context' },
                    };
                    const { mock } = styler;
                    expect(mock).nthCalledWith(1, { ...params1, highlightState: 'none' });
                    expect(mock).nthCalledWith(2, { ...params2, highlightState: 'none' });
                    expect(mock).nthCalledWith(3, { ...params1, highlightState: 'none' });
                    expect(mock).nthCalledWith(4, { ...params1, highlightState: 'none' });
                    expect(mock).nthCalledWith(5, { ...params1, highlightState: 'highlighted-item' });
                    expect(mock).nthCalledWith(6, { ...params1, highlightState: 'highlighted-series' });
                    expect(mock).nthCalledWith(7, { ...params1, highlightState: 'unhighlighted-series' });
                    expect(mock).nthCalledWith(8, { ...params1, highlightState: 'unhighlighted-item' });
                    expect(mock).nthCalledWith(9, { ...params2, highlightState: 'none' });
                    expect(mock).nthCalledWith(10, { ...params2, highlightState: 'none' });
                    expect(mock).nthCalledWith(11, { ...params2, highlightState: 'highlighted-item' });
                    expect(mock).nthCalledWith(12, { ...params2, highlightState: 'highlighted-series' });
                    expect(mock).nthCalledWith(13, { ...params2, highlightState: 'unhighlighted-series' });
                    expect(mock).nthCalledWith(14, { ...params2, highlightState: 'unhighlighted-item' });
                });
            });
        });
        describe('priorities', () => {
            beforeEach(async () => {
                const itemStyler = (params: AgBarSeriesItemStylerParams<D, C>): AgBarSeriesStyle => {
                    if (params.xValue === 'February') {
                        if (params.yKey === 'sales') {
                            return { fill: 'gold', cornerRadius: 0 };
                        } else {
                            return { fill: 'grey', cornerRadius: 0 };
                        }
                    }
                    return {};
                };
                chart = AgCharts.create(
                    prepareTestOptions({
                        data,
                        series: [
                            {
                                type: 'bar',
                                xKey: 'month',
                                yKey: 'sales',
                                fill: 'lime', // ignored
                                cornerRadius: 45, // ignored only for February
                                itemStyler,
                                styler: styler.frozen,
                            },
                            {
                                type: 'bar',
                                xKey: 'month',
                                yKey: 'expenses',
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
    });

    describe('segmentation', () => {
        it('should render bar series with segmentation styling on x-axis', async () => {
            const options: AgCartesianChartOptions = {
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
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 'A', stop: 'C', fill: 'red', stroke: 'darkred', strokeWidth: 2 },
                                { start: 'C', stop: 'E', fill: 'blue', stroke: 'darkblue', strokeWidth: 2 },
                                { start: 'E', fill: 'green', stroke: 'darkgreen', strokeWidth: 2 },
                            ],
                        },
                    },
                ],
                axes: [
                    { type: 'category', position: 'bottom' },
                    { type: 'number', position: 'left' },
                ],
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bar series with segmentation styling on y-axis', async () => {
            const options: AgCartesianChartOptions = {
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
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'y',
                            segments: [
                                {
                                    start: 10,
                                    stop: 20,
                                    fill: 'orange',
                                    stroke: 'darkorange',
                                    strokeWidth: 1,
                                },
                                {
                                    start: 20,
                                    stop: 30,
                                    fill: 'purple',
                                    stroke: 'indigo',
                                    strokeWidth: 1,
                                },
                                {
                                    start: 30,
                                    fill: 'cyan',
                                    stroke: 'teal',
                                    strokeWidth: 1,
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

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render grouped bar series with segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Q1', y1: 100, y2: 150 },
                    { x: 'Q2', y1: 200, y2: 180 },
                    { x: 'Q3', y1: 150, y2: 220 },
                    { x: 'Q4', y1: 250, y2: 200 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y1',
                        segmentation: {
                            key: 'y',
                            segments: [
                                { start: 100, stop: 200, fill: 'lightcoral', stroke: 'red', strokeWidth: 1 },
                                { start: 200, fill: 'lightblue', stroke: 'blue', strokeWidth: 1 },
                            ],
                        },
                    },
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y2',
                        segmentation: {
                            key: 'y',
                            segments: [
                                { start: 150, stop: 200, fill: 'lightgreen', stroke: 'green', strokeWidth: 1 },
                                { start: 200, fill: 'lightyellow', stroke: 'gold', strokeWidth: 1 },
                            ],
                        },
                    },
                ],
                axes: [
                    { type: 'category', position: 'bottom' },
                    { type: 'number', position: 'left' },
                ],
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render stacked bar series with segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Q1', y1: 50, y2: 30 },
                    { x: 'Q2', y1: 70, y2: 40 },
                    { x: 'Q3', y1: 60, y2: 50 },
                    { x: 'Q4', y1: 80, y2: 35 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y1',
                        stacked: true,
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'Q1',
                                    stop: 'Q3',
                                    fill: 'pink',
                                    stroke: 'red',
                                    strokeWidth: 1,
                                },
                                { start: 'Q3', fill: 'purple', stroke: 'blue', strokeWidth: 1 },
                            ],
                        },
                    },
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y2',
                        stacked: true,
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'Q1',
                                    stop: 'Q2',
                                    fill: 'green',
                                    stroke: 'green',
                                    strokeWidth: 1,
                                },
                                {
                                    start: 'Q2',
                                    fill: 'lavender',
                                    stroke: 'purple',
                                    strokeWidth: 1,
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

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render horizontal bar series with segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Category A', y: 100 },
                    { x: 'Category B', y: 150 },
                    { x: 'Category C', y: 120 },
                    { x: 'Category D', y: 180 },
                ],
                series: [
                    {
                        type: 'bar',
                        direction: 'horizontal',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'y',
                            segments: [
                                { start: 100, stop: 140, fill: 'gold', stroke: 'orange', strokeWidth: 2 },
                                { start: 140, fill: 'mediumpurple', stroke: 'purple', strokeWidth: 2 },
                            ],
                        },
                    },
                ],
                axes: [
                    { type: 'category', position: 'left' },
                    { type: 'number', position: 'bottom' },
                ],
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bar series with pattern fill segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'A', y: 25 },
                    { x: 'B', y: 35 },
                    { x: 'C', y: 30 },
                    { x: 'D', y: 40 },
                    { x: 'E', y: 45 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'y',
                            segments: [
                                {
                                    start: 25,
                                    stop: 35,
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'forward-slanted-lines',
                                    },
                                    stroke: 'red',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 35,
                                    stop: 42,
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'squares',
                                    },
                                    stroke: 'blue',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 42,
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'stars',
                                    },
                                    stroke: 'green',
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

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should render Apple revenue by product with gradient fill segmentation', async () => {
            const options: AgCartesianChartOptions = {
                title: {
                    text: "Apple's Revenue by Product Category",
                },
                subtitle: {
                    text: 'In Billion U.S. Dollars',
                },
                data: [
                    {
                        quarter: "Q1'18",
                        iphone: 140,
                        mac: 16,
                        ipad: 14,
                        wearables: 12,
                        services: 20,
                    },
                    {
                        quarter: "Q2'18",
                        iphone: 124,
                        mac: 20,
                        ipad: 14,
                        wearables: 12,
                        services: 30,
                    },
                    {
                        quarter: "Q3'18",
                        iphone: 112,
                        mac: 20,
                        ipad: 18,
                        wearables: 14,
                        services: 36,
                    },
                    {
                        quarter: "Q4'18",
                        iphone: 118,
                        mac: 24,
                        ipad: 14,
                        wearables: 14,
                        services: 36,
                    },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'quarter',
                        yKey: 'iphone',
                        yName: 'iPhone',
                        fill: { type: 'gradient' },
                        segmentation: {
                            key: 'y',
                            segments: [
                                {
                                    start: 50,
                                    stop: 100,
                                    fillOpacity: 0.8,
                                },
                                {
                                    start: 100,
                                    fillOpacity: 0.5,
                                },
                            ],
                        },
                    },
                ],
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render Apple revenue single quarter bar chart with segmentation', async () => {
            const options: AgCartesianChartOptions = {
                title: {
                    text: "Apple's Revenue by Product Category",
                },
                subtitle: {
                    text: 'In Billion U.S. Dollars',
                },
                data: [
                    {
                        quarter: "Q1'18",
                        iphone: 140,
                        mac: 16,
                        ipad: 14,
                        wearables: 12,
                        services: 20,
                    },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'quarter',
                        yKey: 'iphone',
                        yName: 'iPhone',
                        fill: { type: 'gradient' },
                        strokeWidth: 10,
                        stroke: 'yellow',
                        segmentation: {
                            key: 'y',
                            segments: [
                                {
                                    start: 100,
                                    fillOpacity: 0.6,
                                },
                            ],
                        },
                    },
                ],
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });
    });
});
