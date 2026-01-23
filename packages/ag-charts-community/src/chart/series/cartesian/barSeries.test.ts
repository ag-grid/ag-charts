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
import { type MockBarStyler, newFreezableMock } from '../../test/freezableMock';
import { testLegendItemName } from '../../test/legendItemName';
import type { CartesianOrPolarTestCase } from '../../test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    PATTERN_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    deproxy,
    expectWarningsCalls,
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
        options: examples.CARTESIAN_CATEGORY_X_AXIS_LOG_Y_AXIS(data, 'bar'),
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'log' }, seriesTypes: ['bar'] }),
        ...extra,
    };
};

const EXAMPLES: Record<string, CartesianOrPolarTestCase> = {
    ...mixinReversedAxesCases({
        COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'number' }, seriesTypes: ['bar'] }),
        },
        COLUMN_TIME_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.COLUMN_TIME_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'unit-time', y: 'number' }, seriesTypes: ['bar'] }),
        },
        STACKED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.STACKED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.GROUPED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'number' }, seriesTypes: ['bar'] }),
        },
        BAR_TIME_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.BAR_TIME_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'unit-time' }, seriesTypes: ['bar'] }),
        },
        STACKED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.STACKED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
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
                axisTypes: { x: 'number', y: 'number' },
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
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: repeat('bar', 1),
            }),
        },
        STACKED_BAR_NUMBER_X_AXIS_NEGATIVE_NUMBER_Y_AXIS: {
            options: examples.STACKED_BAR_NUMBER_X_AXIS_NEGATIVE_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.GROUPED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
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
            assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['bar'] }),
        },
        COLUMN_SINGLE_DATE_TIME_AXIS: {
            options: examples.COLUMN_SINGLE_DATE_TIME_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'unit-time', y: 'number' }, seriesTypes: ['bar'] }),
        },
        GROUPED_COLUMN_CATEGORY_DATA_PER_SERIES: {
            options: examples.GROUPED_COLUMN_CATEGORY_DATA_PER_SERIES,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 5),
            }),
        },
        STACKED_COLUMN_CATEGORY_DATA_PER_SERIES: {
            options: examples.STACKED_COLUMN_CATEGORY_DATA_PER_SERIES,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 5),
            }),
        },
        STACKED_COLUMN_CATEGORY_DATA_PER_SERIES_CLASHING: {
            options: examples.STACKED_COLUMN_CATEGORY_DATA_PER_SERIES_CLASHING,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 5),
            }),
        },
        GROUPED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES: {
            options: examples.GROUPED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 2),
            }),
        },
        STACKED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES: {
            options: examples.STACKED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 2),
            }),
        },
        STACKED_NORMALIZED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES: {
            options: examples.STACKED_NORMALIZED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_COLUMN_GRADIENT_FILL: {
            options: examples.STACKED_COLUMN_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_COLUMN_HORIZONTAL_GRADIENT_FILL: {
            options: examples.STACKED_COLUMN_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_COLUMN_SERIES_BOUND_VERTICAL_GRADIENT_FILL: {
            options: examples.STACKED_COLUMN_SERIES_BOUND_VERTICAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_COLUMN_SERIES_BOUND_HORIZONTAL_GRADIENT_FILL: {
            options: examples.STACKED_COLUMN_SERIES_BOUND_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_COLUMN_AXES_BOUND_VERTICAL_GRADIENT_FILL: {
            options: examples.STACKED_COLUMN_AXES_BOUND_VERTICAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_COLUMN_AXES_BOUND_HORIZONTAL_GRADIENT_FILL: {
            options: examples.STACKED_COLUMN_AXES_BOUND_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_GRADIENT_FILL: {
            options: examples.GROUPED_COLUMN_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_HORIZONTAL_GRADIENT_FILL: {
            options: examples.GROUPED_COLUMN_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_SERIES_BOUND_VERTICAL_GRADIENT_FILL: {
            options: examples.GROUPED_COLUMN_SERIES_BOUND_VERTICAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_SERIES_BOUND_HORIZONTAL_GRADIENT_FILL: {
            options: examples.GROUPED_COLUMN_SERIES_BOUND_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_AXES_BOUND_VERTICAL_GRADIENT_FILL: {
            options: examples.GROUPED_COLUMN_AXES_BOUND_VERTICAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_AXES_BOUND_HORIZONTAL_GRADIENT_FILL: {
            options: examples.GROUPED_COLUMN_AXES_BOUND_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_COLUMN_PATTERN_FILL: {
            options: examples.STACKED_COLUMN_PATTERN_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
            imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
        },
        GROUPED_COLUMN_PATTERN_FILL: {
            options: examples.GROUPED_COLUMN_PATTERN_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
            imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
        },
        GROUPED_COLUMN_SMALL_PATTERN_FILL: {
            options: examples.GROUPED_COLUMN_SMALL_PATTERN_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
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

                if (example.warnings) {
                    for (const [index, message] of example.warnings.entries()) {
                        expect(console.warn).toHaveBeenNthCalledWith(
                            index + 1,
                            ...(Array.isArray(message) ? message : [message])
                        );
                    }
                }
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

        it('should handle missing values in stacked bar charts without rendering spurious bars', async () => {
            const options: AgCartesianChartOptions = {
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
                        services: null, // Missing value - should not render a bar
                    },
                    {
                        quarter: "Q4'18",
                        iphone: 118,
                        mac: 24,
                        ipad: 14,
                        wearables: null, // Missing value - should not render a bar
                        services: 36,
                    },
                ],
                series: [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', yName: 'iPhone', stacked: true },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', yName: 'Mac', stacked: true },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', yName: 'iPad', stacked: true },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables', yName: 'Wearables', stacked: true },
                    { type: 'bar', xKey: 'quarter', yKey: 'services', yName: 'Services', stacked: true },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Visual snapshot to ensure no spurious bars are rendered
            await compare();
        });

        it('should handle missing properties in stacked bar charts without rendering spurious bars', async () => {
            const options: AgCartesianChartOptions = {
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
                        // services: null, // Missing property - should not render a bar
                    },
                    {
                        quarter: "Q4'18",
                        iphone: 118,
                        mac: 24,
                        ipad: 14,
                        // wearables: null, // Missing property - should not render a bar
                        services: 36,
                    },
                ],
                series: [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', yName: 'iPhone', stacked: true },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', yName: 'Mac', stacked: true },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', yName: 'iPad', stacked: true },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables', yName: 'Wearables', stacked: true },
                    { type: 'bar', xKey: 'quarter', yKey: 'services', yName: 'Services', stacked: true },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Visual snapshot to ensure no spurious bars are rendered
            await compare();
        });
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

        for (const ratio of [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]) {
            it(`for BAR_STACKED_AND_GROUPED_NUMBER_CRT_950 should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = { ...examples.BAR_STACKED_AND_GROUPED_NUMBER_CRT_950 };
                prepareTestOptions(options);
                const optionsSeries = options.series;
                const reducedSeries = [...(optionsSeries?.slice(0, 2) ?? [])];

                if (ratio > 1) {
                    options.series = reducedSeries;
                }

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                const testRatio = ratio > 1 ? ratio - 1 : ratio;
                animate(1200, testRatio);

                if (ratio > 1) {
                    options.series = optionsSeries;
                } else {
                    options.series = reducedSeries;
                }

                await chart.update(options);

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
                    styler.expect().toHaveBeenCalledTimes(2);
                });
                test('params', () => {
                    expect(styler.mock.mock.calls).toMatchSnapshot();
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
        describe('gradient-pattern', () => {
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareTestOptions({
                        data,
                        series: [
                            {
                                type: 'bar',
                                xKey: 'month',
                                yKey: 'sales',
                                styler: () => {
                                    return { fill: { type: 'gradient' } };
                                },
                            },
                            {
                                type: 'bar',
                                xKey: 'month',
                                yKey: 'expenses',
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
                    prepareTestOptions({
                        data,
                        series: [
                            {
                                type: 'bar',
                                xKey: 'month',
                                yKey: 'sales',
                                styler: () => {
                                    // check that default `strokeWidth: 2` is resolved.
                                    return { stroke: 'lime' };
                                },
                            },
                            {
                                type: 'bar',
                                xKey: 'month',
                                yKey: 'expenses',
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
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareTestOptions({
                        data,
                        series: [
                            {
                                type: 'bar',
                                xKey: 'month',
                                yKey: 'sales',
                                highlight: { highlightedSeries: { fill: 'yellow' } },
                                styler: styler.frozen,
                            },
                            {
                                type: 'bar',
                                xKey: 'month',
                                yKey: 'expenses',
                                styler: styler.frozen,
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });

            const miss = { x: 300, y: 150 } as const;
            const series0datum0 = { x: 133, y: 333 } as const;
            const series0datum2 = { x: 620, y: 333 } as const;
            const series1datum0 = { x: 222, y: 400 } as const;
            const legendItem0 = { x: 360, y: 570 } as const;
            const legendItem1 = { x: 440, y: 570 } as const;

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
                    expect(styler.mock.mock.calls).toMatchSnapshot();
                });
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
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
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
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
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
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
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
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
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
                axes: {
                    x: { type: 'category', position: 'left' },
                    y: { type: 'number', position: 'bottom' },
                },
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
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
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

        it('should render bar series with missing start values in segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Q1', y: 150 },
                    { x: 'Q2', y: 200 },
                    { x: 'Q3', y: 180 },
                    { x: 'Q4', y: 220 },
                    { x: 'Q5', y: 250 },
                    { x: 'Q6', y: 275 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 'Q1', stop: 'Q2', fill: 'crimson', stroke: 'darkred', strokeWidth: 2 },
                                { stop: 'Q4', fill: 'royalblue', stroke: 'darkblue', strokeWidth: 3 }, // Missing start - should use 'Q2'
                                { stop: 'Q6', fill: 'forestgreen', stroke: 'darkgreen', strokeWidth: 2 }, // Missing start - should use 'Q4'
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

        it('should render bar series with missing stop values in segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Jan', y: 100 },
                    { x: 'Feb', y: 120 },
                    { x: 'Mar', y: 110 },
                    { x: 'Apr', y: 140 },
                    { x: 'May', y: 160 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 'Jan', fill: '#ff6b6b', stroke: '#e55555', strokeWidth: 2 }, // Missing stop - should use 'Feb'
                                { start: 'Feb', fill: '#4ecdc4', stroke: '#3db5ac', strokeWidth: 2 }, // Missing stop - should use 'May'
                                { start: 'May', stop: 'May', fill: '#45b7d1', stroke: '#3a9bc1', strokeWidth: 2 },
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

        it('should render bar series with Y-axis segmentation and missing values', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Product A', y: 50 },
                    { x: 'Product B', y: 150 },
                    { x: 'Product C', y: 250 },
                    { x: 'Product D', y: 350 },
                    { x: 'Product E', y: 450 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'y',
                            segments: [
                                { start: 0, stop: 200, fill: 'orange', stroke: 'darkorange', strokeWidth: 1 },
                                { stop: 400, fill: 'purple', stroke: 'darkmagenta', strokeWidth: 2 }, // Missing start - should use 200
                                { start: 400, fill: 'gold', stroke: 'darkgoldenrod', strokeWidth: 1 }, // Missing stop - should extend to max
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

        it('should render bar series with complex missing values pattern', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Week 1', y: 80 },
                    { x: 'Week 2', y: 120 },
                    { x: 'Week 3', y: 100 },
                    { x: 'Week 4', y: 140 },
                    { x: 'Week 5', y: 160 },
                    { x: 'Week 6', y: 180 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'Week 1',
                                    stop: 'Week 2',
                                    fill: 'lightcoral',
                                    stroke: 'indianred',
                                    strokeWidth: 2,
                                },
                                { fill: 'lightblue', stroke: 'steelblue', strokeWidth: 2 }, // Missing both start/stop - should bridge from 'Week 2' to 'Week 4'
                                { start: 'Week 4', fill: 'lightgreen', stroke: 'forestgreen', strokeWidth: 2 }, // Missing stop - should extend to end
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

        it('should render horizontal bar series with missing segmentation values', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Alpha', y: 85 },
                    { x: 'Beta', y: 125 },
                    { x: 'Gamma', y: 105 },
                    { x: 'Delta', y: 145 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        direction: 'horizontal',
                        segmentation: {
                            key: 'y',
                            segments: [
                                { start: 80, stop: 110, fill: 'mediumorchid', stroke: 'darkorchid', strokeWidth: 2 },
                                { stop: 150, fill: 'mediumseagreen', stroke: 'seagreen', strokeWidth: 2 }, // Missing start - should use 110
                            ],
                        },
                    },
                ],
                axes: {
                    x: { type: 'category', position: 'left' },
                    y: { type: 'number', position: 'bottom' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render grouped bar series with missing segmentation values', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'A', y1: 30, y2: 50 },
                    { x: 'B', y1: 40, y2: 60 },
                    { x: 'C', y1: 35, y2: 55 },
                    { x: 'D', y1: 45, y2: 65 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y1',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 'A', stop: 'B', fill: 'tomato', stroke: 'darkred', strokeWidth: 1 },
                                { stop: 'D', fill: 'dodgerblue', stroke: 'darkblue', strokeWidth: 1 }, // Missing start - should use 'B'
                            ],
                        },
                    },
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y2',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 'A', fill: 'limegreen', stroke: 'darkgreen', strokeWidth: 1 }, // Missing stop - should extend to end
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
    });

    describe('cutout drawing mode', () => {
        it('should render bar series with cutout highlight drawing mode', async () => {
            const highlight = {
                highlightedItem: {
                    fillOpacity: 0.1,
                    stroke: 'black',
                    fill: 'black',
                },
            };
            const options: AgCartesianChartOptions = {
                data: [
                    { quarter: 'Q1', sales: 120, expenses: 80 },
                    { quarter: 'Q2', sales: 100, expenses: 70 },
                    { quarter: 'Q3', sales: 140, expenses: 90 },
                    { quarter: 'Q4', sales: 160, expenses: 110 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'quarter',
                        yKey: 'sales',
                        yName: 'Sales',
                        highlight,
                    },
                    {
                        type: 'bar',
                        xKey: 'quarter',
                        yKey: 'expenses',
                        yName: 'Expenses',
                        highlight,
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
            await hoverAction(135, 330)(chart);
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
                    { type: 'bar', xKey: 'x', yKey: 's1', yName: 'series 1' },
                    { type: 'bar', xKey: 'x', yKey: 's2', yName: 'series 2' },
                    { type: 'bar', xKey: 'x', yKey: 's3', yName: 'series 3' },
                ],
            },
        });
    });

    describe('horizontal bar with property-based formatter', () => {
        it('should apply correct formatter to axis labels based on series orientation', async () => {
            const options: AgCartesianChartOptions = {
                title: {
                    text: "Apple's Revenue by Product Category",
                },
                subtitle: {
                    text: 'In Billion U.S. Dollars',
                },
                data: [
                    { quarter: 'Q1', iphone: 140.01 },
                    { quarter: 'Q2', iphone: 124.32 },
                    { quarter: 'Q3', iphone: 112.12 },
                    { quarter: 'Q4', iphone: 96.39 },
                ],
                series: [
                    {
                        type: 'bar',
                        direction: 'horizontal',
                        xKey: 'quarter',
                        yKey: 'iphone',
                        yName: 'iPhone',
                    },
                ],
                formatter: {
                    x: ({ value }) => `x${value}x`,
                    y: ({ value }) => `y${value}y`,
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            await compare();
        });

        it('should apply correct formatter in combo chart with horizontal bars and line series', async () => {
            const options: AgCartesianChartOptions = {
                title: {
                    text: 'Revenue and Growth',
                },
                data: [
                    { quarter: 'Q1', revenue: 140.01, growth: 15.5 },
                    { quarter: 'Q2', revenue: 124.32, growth: 12.3 },
                    { quarter: 'Q3', revenue: 112.12, growth: 8.7 },
                    { quarter: 'Q4', revenue: 96.39, growth: 5.2 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'growth',
                        yKey: 'quarter',
                        yName: 'Growth %',
                    },
                    {
                        type: 'bar',
                        direction: 'horizontal',
                        xKey: 'quarter',
                        yKey: 'revenue',
                        yName: 'Revenue',
                    },
                ],
                formatter: {
                    x: ({ value }) => `x${value}x`,
                    y: ({ value }) => `y${value}y`,
                },
                axes: {
                    x: {
                        type: 'number',
                    },
                    y: {
                        type: 'category',
                    },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            await compare();
        });
    });

    describe('incremental updates with aggregation', () => {
        it('should enable incremental updates when aggregation is active', async () => {
            // Create data with >1000 points to trigger aggregation (MAX_ANIMATABLE_NODES = 1000)
            const largeData = Array.from({ length: 1500 }, (_, i) => ({
                x: i,
                y: Math.random() * 100,
            }));

            const options: AgChartOptions = {
                data: largeData,
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                    },
                ],
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Get initial node data references
            const chartInstance = deproxy(chart);
            const series = chartInstance.series[0] as any;
            const initialNodeData = series.contextNodeData?.nodeData;
            expect(initialNodeData).toBeDefined();
            expect(initialNodeData!.length).toBeGreaterThan(0);

            // Store references to some nodes
            const firstNode = initialNodeData![0];
            const middleNode = initialNodeData![Math.floor(initialNodeData!.length / 2)];

            // Update data (same structure, different values) - this should trigger incremental update
            const updatedData = largeData.map((d) => ({
                ...d,
                y: d.y * 1.1, // Slight change to values
            }));

            await chart.update({
                ...options,
                data: updatedData,
            });
            await waitForChartStability(chart);

            // Verify nodes were reused (same object references)
            const updatedChartInstance = deproxy(chart);
            const updatedSeries = updatedChartInstance.series[0] as any;
            const updatedNodeData = updatedSeries.contextNodeData?.nodeData;
            expect(updatedNodeData).toBeDefined();
            expect(updatedNodeData!.length).toBe(initialNodeData!.length);

            // With aggregation active, incremental updates should reuse node objects
            // Check that at least some nodes are reused (they should be the same references)
            expect(updatedNodeData![0]).toBe(firstNode);
            expect(updatedNodeData![Math.floor(updatedNodeData!.length / 2)]).toBe(middleNode);

            chart.destroy();
        });
    });

    describe('fixed width', () => {
        const data = [
            { quarter: "Q1'18", iphone: 40, mac: 16, ipad: 14, wearables: 12 },
            { quarter: "Q2'18", iphone: 24, mac: 20, ipad: 14, wearables: 12 },
            { quarter: "Q3'18", iphone: 12, mac: 20, ipad: 18, wearables: 14 },
            { quarter: "Q4'18", iphone: 18, mac: 24, ipad: 14, wearables: 14 },
        ];

        const zeroPadding = { paddingInner: 0, paddingOuter: 0, groupPaddingInner: 0 };

        const cases: [string, any, any][] = [
            ['single series', [{ type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20 }], zeroPadding],
            [
                'grouped series',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20 },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 40 },
                ],
                zeroPadding,
            ],
            [
                'grouped series with groupPaddingInner',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20 },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 40 },
                ],
                { ...zeroPadding, groupPaddingInner: 0.5 },
            ],
            [
                'grouped series with unfixed width at start',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone' },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 40 },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', width: 30 },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables', width: 20 },
                ],
                zeroPadding,
            ],
            [
                'grouped series with unfixed width in middle',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20 },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac' },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', width: 30 },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables', width: 20 },
                ],
                zeroPadding,
            ],
            [
                'grouped series with unfixed width at end',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20 },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 40 },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', width: 30 },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables' },
                ],
                zeroPadding,
            ],
            [
                'grouped series with unfixed widths and groupPaddingInner',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20 },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac' },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', width: 30 },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables' },
                ],
                { ...zeroPadding, groupPaddingInner: 0.5 },
            ],
            [
                'grouped series with unfixed widths and default padding',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20 },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac' },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', width: 30 },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables' },
                ],
                {},
            ],
            [
                'stacked series',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20, stackGroup: 'one' },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 40, stackGroup: 'one' },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', width: 30, stackGroup: 'two' },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables', width: 20, stackGroup: 'two' },
                ],
                {},
            ],
            [
                'stacked series with unfixed widths',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20, stackGroup: 'one' },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', stackGroup: 'one' },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', stackGroup: 'two' },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables', width: 20, stackGroup: 'two' },
                ],
                {},
            ],
            [
                'stacked series with one unfixed width',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20, stackGroup: 'one' },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 10, stackGroup: 'one' },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', stackGroup: 'two' },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables', width: 30, stackGroup: 'two' },
                ],
                {},
            ],
        ];

        it.each(cases)('%s', async (_, seriesOptions, axisOptions) => {
            const options: AgCartesianChartOptions = {
                data: data,
                series: seriesOptions,
                axes: {
                    x: axisOptions,
                },
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('changing width', async () => {
            const options: AgCartesianChartOptions = {
                data: data,
                series: [
                    { type: 'bar' as const, xKey: 'quarter', yKey: 'iphone', width: 20 },
                    { type: 'bar' as const, xKey: 'quarter', yKey: 'mac' },
                    { type: 'bar' as const, xKey: 'quarter', yKey: 'ipad', width: 30 },
                    { type: 'bar' as const, xKey: 'quarter', yKey: 'wearables' },
                ],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            (options.series as any)[0].width = 40;
            await chart.update(options);
            await compare();
        });
    });
});
