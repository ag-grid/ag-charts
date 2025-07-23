import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type {
    AgBarSeriesLabelPlacement,
    AgBarSeriesOptions,
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
});
