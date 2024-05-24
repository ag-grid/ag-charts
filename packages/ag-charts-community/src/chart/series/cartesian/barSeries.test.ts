import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { AgCharts } from '../../../api/agChart';
import type { AgChartOptions } from '../../../options/agChartOptions';
import type { Chart } from '../../chart';
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
    expectWarningMessages,
    extractImageData,
    mixinReversedAxesCases,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    waitForChartStability,
} from '../../test/utils';

const buildLogAxisTestCase = (data: any[]): CartesianOrPolarTestCase => {
    return {
        options: examples.CARTESIAN_CATEGORY_X_AXIS_LOG_Y_AXIS(data, 'bar'),
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'log'], seriesTypes: ['bar'] }),
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
            assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: ['bar'] }),
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
            assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: ['bar'] }),
        },
        STACKED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.STACKED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'number'],
                seriesTypes: repeat('bar', 4),
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
        COLUMN_CATEGORY_X_AXIS_ZERO_EXTENT_LOG_Y_AXIS: buildLogAxisTestCase(DATA_ZERO_EXTENT_LOG_AXIS),
        COLUMN_SINGLE_DATE_CATEGORY_AXIS: {
            options: examples.COLUMN_SINGLE_DATE_CATEGORY_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['bar'] }),
        },
        COLUMN_SINGLE_DATE_TIME_AXIS: {
            options: examples.COLUMN_SINGLE_DATE_TIME_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: ['bar'] }),
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
    }),
};

const INVALID_DATA_EXAMPLES: Record<string, CartesianOrPolarTestCase> = {
    COLUMN_CATEGORY_X_AXIS_INVALID_DOMAIN_LOG_Y_AXIS: buildLogAxisTestCase(DATA_INVALID_DOMAIN_LOG_AXIS),
};

describe('BarSeries', () => {
    setupMockConsole();

    let chart: Chart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        jest.restoreAllMocks();
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('#create', () => {
        test('no data', async () => {
            chart = AgCharts.create(
                prepareTestOptions({ data: [], series: [{ type: 'bar', xKey: 'x', yKey: 'y' }] })
            ) as Chart;
            await compare();
        });

        it.each(Object.entries(EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options) as Chart;
                await waitForChartStability(chart);
                await example.assertions(chart);
            }
        );

        it.each(Object.entries(EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options) as Chart;
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
            it(`for COLUMN_TIME_X_AXIS_NUMBER_Y_AXIS should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = { ...examples.COLUMN_TIME_X_AXIS_NUMBER_Y_AXIS };
                prepareTestOptions(options);

                chart = AgCharts.create(options) as Chart;
                await waitForChartStability(chart);
                await compare();
            });
        }

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = { ...examples.BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS };
                prepareTestOptions(options);

                chart = AgCharts.create(options) as Chart;
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

                chart = AgCharts.create(options) as Chart;
                await waitForChartStability(chart);

                chart.updateDelta({
                    data: [...options.data!.slice(2, 4), ...options.data!.slice(6, -2)],
                });
                animate(1200, ratio);

                await waitForChartStability(chart);
                await compare();
            });
        }

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = { ...examples.BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS };
                prepareTestOptions(options);

                chart = AgCharts.create(options) as Chart;
                await waitForChartStability(chart);

                chart.updateDelta({
                    data: options.data!.slice(0, options.data!.length / 2),
                });
                animate(1200, ratio);

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

                chart = AgCharts.create(options) as Chart;
                await waitForChartStability(chart);

                chart.updateDelta({
                    data: [...options.data!.slice(2, 4), ...options.data!.slice(6, -2)],
                });
                await waitForChartStability(chart);

                chart.update(options);
                animate(1200, ratio);

                await waitForChartStability(chart);
                await compare();
            });
        }

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = { ...examples.BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS };
                prepareTestOptions(options);

                chart = AgCharts.create(options) as Chart;
                await waitForChartStability(chart);

                chart.updateDelta({
                    data: options.data!.slice(0, options.data!.length / 2),
                });
                await waitForChartStability(chart);

                chart.update(options);
                animate(1200, ratio);

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

                chart = AgCharts.create(options) as Chart;
                await waitForChartStability(chart);

                chart.updateDelta({
                    data: [...options.data!.map((d, i) => (i % 2 === 0 ? { ...d, value: d.value * 2 } : d))],
                });
                animate(1200, ratio);

                await waitForChartStability(chart);
                await compare();
            });
        }

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = { ...examples.BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS };
                prepareTestOptions(options);

                chart = AgCharts.create(options) as Chart;
                await waitForChartStability(chart);

                chart.updateDelta({
                    data: [...options.data!.map((d, i) => (i % 2 === 0 ? { ...d, value: d.value * 2 } : d))],
                });
                animate(1200, ratio);

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

                chart = AgCharts.create(options) as Chart;
                await waitForChartStability(chart);
                await example.assertions(chart);

                expectWarningMessages(
                    'AG Charts - the data domain crosses zero, the chart data cannot be rendered. See log axis documentation for more information.',
                    'AG Charts - the data domain crosses zero, the chart data cannot be rendered. See log axis documentation for more information.'
                );
            }
        );

        it.each(Object.entries(INVALID_DATA_EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options) as Chart;
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }

                expectWarningMessages(
                    'AG Charts - the data domain crosses zero, the chart data cannot be rendered. See log axis documentation for more information.',
                    'AG Charts - the data domain crosses zero, the chart data cannot be rendered. See log axis documentation for more information.'
                );
            }
        );
    });
});
