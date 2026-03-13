import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ChartAxisDirection, deepClone } from 'ag-charts-core';
import type {
    AgAreaSeriesMarkerItemStylerParams,
    AgAreaSeriesOptions,
    AgAreaSeriesStylerParams,
    AgAreaSeriesStylerResult,
    AgCartesianChartOptions,
    AgChartInstance,
    AgChartOptions,
    AgColorRepeat,
    AgImageFillFit,
    AgPatternName,
    AgSeriesMarkerStyle,
    AgUnitTimeAxisOptions,
} from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import { Transformable } from '../../../scene/transformable';
import { LegendMarkerLabel } from '../../legend/legendMarkerLabel';
import { CUSTOM_SVG_PATHS, INVALID_CUSTOM_SVG_PATHS } from '../../test/customSvgPaths';
import {
    DATA_FRACTIONAL_LOG_AXIS,
    DATA_INVALID_DOMAIN_LOG_AXIS,
    DATA_NEGATIVE_LOG_AXIS,
    DATA_POSITIVE_LOG_AXIS,
    DATA_ZERO_EXTENT_LOG_AXIS,
} from '../../test/data';
import * as examples from '../../test/examples';
import { type MockAreaStyler, newFreezableMock } from '../../test/freezableMock';
import { testLegendItemName } from '../../test/legendItemName';
import type { CartesianOrPolarTestCase, ChartTestCase } from '../../test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    PATTERN_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    clickAction,
    deproxy,
    doubleClickAction,
    doubleTapAction,
    expectWarningsCalls,
    extractImageData,
    hoverAction,
    mixinReversedAxesCases,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    tapAction,
    waitForChartStability,
} from '../../test/utils';
import { AreaSeries } from './areaSeries';

const buildLogAxisTestCase = (
    data: any[],
    extra?: { warnings?: string[]; skipWarningsReversed?: boolean }
): CartesianOrPolarTestCase => {
    return {
        options: examples.CARTESIAN_CATEGORY_X_AXIS_LOG_Y_AXIS(data, 'area'),
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'log' }, seriesTypes: ['area'] }),
        ...extra,
    };
};

const EXAMPLES: Record<
    string,
    CartesianOrPolarTestCase & { skip?: boolean; imageSnapshotDefaults?: typeof IMAGE_SNAPSHOT_DEFAULTS }
> = {
    ...mixinReversedAxesCases({
        AREA_MISSING_Y_DATA_EXAMPLE: {
            options: examples.AREA_MISSING_Y_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        },
        STACKED_AREA_MISSING_Y_DATA_EXAMPLE: {
            options: examples.STACKED_AREA_MISSING_Y_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('area', 4),
            }),
        },
        STACKED_AREA_MISSING_Y_DATA_WITH_INTERPOLATION_EXAMPLE: {
            options: {
                ...examples.STACKED_AREA_MISSING_Y_DATA_EXAMPLE,
                series: (examples.STACKED_AREA_MISSING_Y_DATA_EXAMPLE.series ?? []).map((series) => ({
                    ...series,
                    interpolation: { type: 'smooth' },
                })),
            },
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('area', 4),
            }),
        },
        STACKED_AREA_MISSING_Y_DATA_PER_SERIES_EXAMPLE: {
            options: examples.STACKED_AREA_MISSING_Y_DATA_PER_SERIES_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('area', 4),
            }),
        },
        AREA_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE: {
            options: examples.AREA_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'number' }, seriesTypes: ['area'] }),
            warnings: [
                ['AG Charts - invalid value of type [undefined] for [AreaSeries-1 / xValue] ignored:', '[undefined]'],
            ],
            skipWarningsReversed: false,
        },
        AREA_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE: {
            options: examples.AREA_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'unit-time', y: 'number' }, seriesTypes: ['area'] }),
            warnings: [['AG Charts - invalid value of type [object] for [AreaSeries-1 / xValue] ignored:', '[null]']],
            skipWarningsReversed: false,
        },
        STACKED_AREA_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE: {
            options: examples.STACKED_AREA_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: repeat('area', 2),
            }),
            warnings: [
                [
                    'AG Charts - invalid value of type [undefined] for [AreaSeries-1,AreaSeries-2 / xValue] ignored:',
                    '[undefined]',
                ],
            ],
            skipWarningsReversed: false,
        },
        STACKED_AREA_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE: {
            options: examples.STACKED_AREA_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'unit-time', y: 'number' },
                seriesTypes: repeat('area', 2),
            }),
            warnings: [
                [
                    'AG Charts - invalid value of type [object] for [AreaSeries-1,AreaSeries-2 / xValue] ignored:',
                    '[null]',
                ],
            ],
            skipWarningsReversed: false,
        },
        AREA__TIME_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.AREA_TIME_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'unit-time', y: 'number' },
                seriesTypes: repeat('area', 2),
            }),
        },
        AREA_NUMBER_X_AXIS_TIME_Y_AXIS: {
            options: examples.AREA_NUMBER_X_AXIS_TIME_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'unit-time' },
                seriesTypes: repeat('area', 2),
            }),
            skip: true,
        },
        AREA_NUMBER_AXES_0_X_DOMAIN: {
            options: examples.AREA_NUMBER_AXES_0_X_DOMAIN,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: repeat('area', 2),
            }),
        },
        AREA_NUMBER_AXES_0_Y_DOMAIN: {
            options: examples.AREA_NUMBER_AXES_0_Y_DOMAIN,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: repeat('area', 2),
            }),
        },
        STACKED_AREA_STROKE_MARKER_LABEL_RENDERING: {
            options: {
                ...examples.STACKED_AREA_MISSING_Y_DATA_EXAMPLE,
                series: (examples.STACKED_AREA_MISSING_Y_DATA_EXAMPLE.series ?? []).map((s) => ({
                    ...s,
                    strokeWidth: 20,
                    marker: { size: 15 },
                    label: {},
                })),
            },
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('area', 4),
            }),
        },
        STACKED_AREA_MISSING_FIRST_Y_DATA_EXAMPLE: {
            options: examples.STACKED_AREA_MISSING_FIRST_Y_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('area', 2),
            }),
        },
        AREA_CATEGORY_X_AXIS_POSITIVE_LOG_Y_AXIS: buildLogAxisTestCase(DATA_POSITIVE_LOG_AXIS),
        AREA_CATEGORY_X_AXIS_NEGATIVE_LOG_Y_AXIS: buildLogAxisTestCase(DATA_NEGATIVE_LOG_AXIS),
        AREA_CATEGORY_X_AXIS_FRACTIONAL_LOG_Y_AXIS: buildLogAxisTestCase(DATA_FRACTIONAL_LOG_AXIS),
        AREA_CATEGORY_X_AXIS_ZERO_EXTENT_LOG_Y_AXIS: buildLogAxisTestCase(DATA_ZERO_EXTENT_LOG_AXIS, {
            warnings: [
                'AG Charts - The log axis domain contains a value of 0, the chart data cannot be rendered. See log axis documentation for more information.',
            ],
            skipWarningsReversed: false,
        }),
        NORMALISED_AREA_STACKED: {
            options: examples.NORMALISED_STACKED_AREA,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('area', 4),
            }),
        },
        AREA_SERIES_VERTICAL_GRADIENT_FILL: {
            options: examples.AREA_SERIES_VERTICAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        },
        AREA_SERIES_HORIZONTAL_GRADIENT_FILL: {
            options: examples.AREA_SERIES_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        },
        AREA_SERIES_DEFAULT_GRADIENT_FILL: {
            options: examples.AREA_SERIES_DEFAULT_GRADIENT_FILL,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        },
        AREA_SERIES_GRADIENT_FILL_AXES_BOUNDS: {
            options: examples.AREA_SERIES_GRADIENT_FILL_AXES_BOUNDS,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('area', 2),
            }),
        },
    }),
    AREA_SERIES_DEFAULT_PATTERN_FILL: {
        options: examples.AREA_SERIES_DEFAULT_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_VERTICAL_LINES_PATTERN_FILL: {
        options: examples.AREA_SERIES_VERTICAL_LINES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_HORIZONTAL_LINES_PATTERN_FILL: {
        options: examples.AREA_SERIES_HORIZONTAL_LINES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
    },
    AREA_SERIES_FORWARD_SLANTED_LINES_PATTERN_FILL: {
        options: examples.AREA_SERIES_FORWARD_SLANTED_LINES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_BACKWARD_SLANTED_LINES_PATTERN_FILL: {
        options: examples.AREA_SERIES_BACKWARD_SLANTED_LINES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_CIRCLES_PATTERN_FILL: {
        options: examples.AREA_SERIES_CIRCLES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_SQUARES_PATTERN_FILL: {
        options: examples.AREA_SERIES_SQUARES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_TRIANGLES_PATTERN_FILL: {
        options: examples.AREA_SERIES_TRIANGLES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_DIAMONDS_PATTERN_FILL: {
        options: examples.AREA_SERIES_DIAMONDS_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_STARS_PATTERN_FILL: {
        options: examples.AREA_SERIES_STARS_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_HEARTS_PATTERN_FILL: {
        options: examples.AREA_SERIES_HEARTS_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_CROSSES_PATTERN_FILL: {
        options: examples.AREA_SERIES_CROSSES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_CUSTOM_SVG_PATH_PATTERN_FILL: {
        options: examples.AREA_SERIES_CUSTOM_SVG_PATH_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_CUSTOMISED_PATTERN_FILL: {
        options: examples.AREA_SERIES_CUSTOMISED_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_NULL_CATEGORY_KEY: {
        options: examples.AREA_NULL_CATEGORY_KEY_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        warnings: [['AG Charts - invalid value of type [object] for [AreaSeries-1 / xValue] ignored:', '[null]']],
    },
    AREA_NULL_CATEGORY_KEY_ALLOWED: {
        options: examples.AREA_NULL_CATEGORY_KEY_ALLOWED_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
    },
    AREA_UNDEFINED_CATEGORY_KEY: {
        options: examples.AREA_UNDEFINED_CATEGORY_KEY_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        warnings: [
            ['AG Charts - invalid value of type [undefined] for [AreaSeries-1 / xValue] ignored:', '[undefined]'],
        ],
    },
    AREA_UNDEFINED_CATEGORY_KEY_ALLOWED: {
        options: examples.AREA_UNDEFINED_CATEGORY_KEY_ALLOWED_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
    },
    AREA_NULL_AND_UNDEFINED_KEYS: {
        options: examples.AREA_NULL_AND_UNDEFINED_KEYS_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
    },
    STACKED_AREA_SERIES_STACK_GROUPS: {
        options: examples.STACKED_AREA_SERIES_STACK_GROUPS,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number' },
            seriesTypes: repeat('area', 4),
        }),
    },
};

const INVALID_DATA_EXAMPLES: Record<string, ChartTestCase> = {
    AREA_CATEGORY_X_AXIS_INVALID_DOMAIN_LOG_Y_AXIS: buildLogAxisTestCase(DATA_INVALID_DOMAIN_LOG_AXIS),
};

describe('AreaSeries', () => {
    setupMockConsole();
    const compare = async (defaults = IMAGE_SNAPSHOT_DEFAULTS) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(defaults);
    };

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        jest.resetAllMocks();
    });

    const ctx = setupMockCanvas();

    describe('#create', () => {
        beforeEach(() => {
            console.warn = jest.fn();
        });

        test('no data', async () => {
            chart = AgCharts.create(prepareTestOptions({ data: [], series: [{ type: 'area', xKey: 'x', yKey: 'y' }] }));
            await compare();
        });

        for (const [exampleName, example] of Object.entries(EXAMPLES)) {
            if (example.skip === true) {
                // Support skipping.
                it.skip(`for ${exampleName} it should create chart instance as expected`, async () => {});
                // Support skipping.
                it.skip(`for ${exampleName} it should render to canvas as expected`, async () => {});
            } else {
                it(`for ${exampleName} it should create chart instance as expected`, async () => {
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
                });

                it(`for ${exampleName} it should render to canvas as expected`, async () => {
                    const options: AgChartOptions = { ...example.options };
                    prepareTestOptions(options);

                    chart = AgCharts.create(options);
                    await compare(example.imageSnapshotDefaults);

                    if (example.extraScreenshotActions) {
                        await example.extraScreenshotActions(chart);
                        await compare(example.imageSnapshotDefaults);
                    }
                });
            }
        }
    });

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for AREA_CATEGORY_X_AXIS_FRACTIONAL_LOG_Y_AXIS should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = examples.CARTESIAN_CATEGORY_X_AXIS_LOG_Y_AXIS(
                    DATA_FRACTIONAL_LOG_AXIS,
                    'area'
                );
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('add/update/remove animation', () => {
        const animate = spyOnAnimationManager();

        const EXAMPLE = deepClone(examples.STACKED_AREA_GRAPH_EXAMPLE);
        (EXAMPLE.axes!.x as AgUnitTimeAxisOptions).label!.format = '%b %Y';

        const mutateData = (count: number) => {
            return ({ date: inputDate, ...d }: any) => {
                const date = new Date(inputDate);
                date.setFullYear(date.getFullYear() + count);
                return { date, ...d };
            };
        };

        const updatedData = [...EXAMPLE.data!];
        updatedData.splice(0, 0, ...EXAMPLE.data!.map(mutateData(-1)));
        updatedData.push(...EXAMPLE.data!.map(mutateData(+1)));

        describe('add', () => {
            for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
                it(`for STACKED_AREA_GRAPH_EXAMPLE should animate at ${ratio * 100}%`, async () => {
                    animate(1200, 1);

                    const options: AgChartOptions = { ...EXAMPLE };
                    prepareTestOptions(options);

                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);

                    animate(1200, ratio);
                    await chart.update({ ...options, data: updatedData });

                    await compare();
                });
            }
        });

        describe('remove', () => {
            for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
                it(`for STACKED_AREA_GRAPH_EXAMPLE should animate at ${ratio * 100}%`, async () => {
                    animate(1200, 1);

                    const options: AgChartOptions = { ...EXAMPLE, data: updatedData };
                    prepareTestOptions(options);

                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);

                    animate(1200, ratio);
                    await chart.update({ ...options, data: EXAMPLE.data });

                    await compare();
                });
            }
        });
    });

    describe('undefined data animation', () => {
        const animate = spyOnAnimationManager();

        const EXAMPLE = deepClone(examples.STACKED_AREA_GRAPH_EXAMPLE);
        if (EXAMPLE.series) {
            for (const series of EXAMPLE.series) {
                (series as any).interpolation = { type: 'smooth' };
            }
        }

        const updatedData = deepClone(EXAMPLE.data)!;
        updatedData[4]['Science Museum'] = undefined;

        describe('set to undefined', () => {
            for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
                it(`for STACKED_AREA_GRAPH_EXAMPLE should animate at ${ratio * 100}%`, async () => {
                    animate(1200, 1);

                    const options: AgChartOptions = { ...EXAMPLE };
                    prepareTestOptions(options);

                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);

                    animate(1200, ratio);
                    await chart.update({ ...options, data: updatedData });

                    await compare();
                });
            }
        });

        describe('unset from undefined', () => {
            for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
                it(`for STACKED_AREA_GRAPH_EXAMPLE should animate at ${ratio * 100}%`, async () => {
                    animate(1200, 1);

                    const options: AgChartOptions = { ...EXAMPLE, data: updatedData };
                    prepareTestOptions(options);

                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);

                    animate(1200, ratio);
                    await chart.update({ ...options, data: EXAMPLE.data });

                    await compare();
                });
            }
        });
    });

    describe('legend toggle animation', () => {
        const animate = spyOnAnimationManager();

        const EXAMPLE = deepClone(examples.STACKED_AREA_GRAPH_EXAMPLE);
        if (EXAMPLE.series)
            for (const s of EXAMPLE.series) {
                (s as AgAreaSeriesOptions).strokeWidth = 2;
            }

        describe('hide', () => {
            for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
                it(`for STACKED_AREA_GRAPH_EXAMPLE should animate at ${ratio * 100}%`, async () => {
                    animate(1200, 1);

                    const options: AgChartOptions = deepClone(EXAMPLE);
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
            for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
                it(`for STACKED_AREA_GRAPH_EXAMPLE should animate at ${ratio * 100}%`, async () => {
                    animate(1200, 1);

                    const options: AgChartOptions = deepClone(EXAMPLE);
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

    describe('invalid data domain', () => {
        beforeEach(() => {
            console.warn = jest.fn();
        });

        it.each(Object.entries(INVALID_DATA_EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await example.assertions(chart);
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

                expect(console.warn).toHaveBeenCalled();
            }
        );
    });

    describe('multiple overlapping areas', () => {
        beforeEach(() => {
            console.warn = jest.fn();
        });

        it('should render area series with the correct relative Z-index', async () => {
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
                    type: 'area',
                    xKey: `x${i}`,
                    yKey: `y${i}`,
                    strokeWidth: 2,
                })),
                legend: { enabled: false },
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    // AG-12350 - nodeClick triggered on legend item click.
    describe('nodeClick', () => {
        const clicks: string[] = [];
        const doubleClicks: string[] = [];
        const legendClicks: (string | number)[] = [];

        const nodeClickOptions: AgCartesianChartOptions = {
            data: [
                { asset: 'Stocks', amount: 5 },
                { asset: 'Cash', amount: 5 },
                { asset: 'Bonds', amount: 0 },
                { asset: 'Real Estate', amount: 5 },
                { asset: 'Commodities', amount: 5 },
            ],
            series: [
                {
                    type: 'area',
                    xKey: 'asset',
                    yKey: 'amount',
                    marker: { size: 5 },
                    listeners: {
                        seriesNodeClick: (event) => {
                            clicks.push(event.datum.asset);
                        },
                        seriesNodeDoubleClick: (event) => {
                            doubleClicks.push(event.datum.asset);
                        },
                    },
                },
            ],
            legend: {
                listeners: {
                    legendItemClick: (event) => {
                        legendClicks.push(event.itemId);
                    },
                },
            },
        };

        beforeEach(async () => {
            const options = { ...nodeClickOptions };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            clicks.splice(0, clicks.length);
            doubleClicks.splice(0, doubleClicks.length);
            legendClicks.splice(0, legendClicks.length);
        });

        function* iterAreaSectors(myChart: AgChartInstance) {
            const areaSeries = deproxy(myChart).series[0] as AreaSeries;
            for (const nodeData of areaSeries.getNodeData() ?? []) {
                const { x = 0, y = 0 } = nodeData.point ?? {};
                yield Transformable.toCanvasPoint(areaSeries.contentGroup, x, y);
            }
        }

        function* iterLegendMarkerLabels(myChart: AgChartInstance) {
            for (const { legend } of deproxy(myChart).modulesManager.legends()) {
                const markerLabels = (legend as any).itemSelection?._nodes as LegendMarkerLabel[];
                for (const label of markerLabels) {
                    yield Transformable.toCanvas(label).computeCenter();
                }
            }
        }

        describe('should fire a nodeClick event for each node', () => {
            test('mouse', async () => {
                for (const { x, y } of iterAreaSectors(chart)) {
                    await waitForChartStability(chart);
                    await clickAction(x, y)(chart);
                }
            });
            test('touch', async () => {
                // Faulty because of AG-14228
                for (const { x, y } of iterAreaSectors(chart)) {
                    await waitForChartStability(chart);
                    await tapAction(x, y)(chart);
                }
            });

            afterEach(() => {
                expect(clicks).toEqual(['Stocks', 'Cash', 'Bonds', 'Real Estate', 'Commodities']);
                expect(doubleClicks).toHaveLength(0);
                expect(legendClicks).toHaveLength(0);
            });
        });

        describe('should fire a nodeDoubleClick event for each node', () => {
            test('mouse', async () => {
                for (const { x, y } of iterAreaSectors(chart)) {
                    await waitForChartStability(chart);
                    await doubleClickAction(x, y)(chart);
                }
            });
            test('touch', async () => {
                for (const { x, y } of iterAreaSectors(chart)) {
                    await waitForChartStability(chart);
                    await doubleTapAction(x, y)(chart);
                }
            });

            afterEach(() => {
                expect(doubleClicks).toEqual(['Stocks', 'Cash', 'Bonds', 'Real Estate', 'Commodities']);
                expect(clicks).toHaveLength(10);
                expect(legendClicks).toHaveLength(0);
            });
        });

        describe('should not fire series events for legend clicks', () => {
            test('mouse', async () => {
                for (const { x, y } of iterLegendMarkerLabels(chart)) {
                    await clickAction(x, y)(chart);
                    await waitForChartStability(chart);

                    await clickAction(x, y)(chart);
                    await waitForChartStability(chart);
                }
            });
            test('touch', async () => {
                for (const { x, y } of iterLegendMarkerLabels(chart)) {
                    await tapAction(x, y)(chart);
                    await waitForChartStability(chart);

                    await tapAction(x, y)(chart);
                    await waitForChartStability(chart);
                }
            });

            afterEach(() => {
                expect(legendClicks).toEqual(['amount', 'amount']);
                expect(doubleClicks).toHaveLength(0);
                expect(clicks).toHaveLength(0);
            });
        });
    });

    describe('pattern fill', () => {
        const EXAMPLE = deepClone(examples.SIMPLE_AREA_GRAPH_EXAMPLE);

        if (EXAMPLE.series)
            for (const s of EXAMPLE.series) {
                (s as AgAreaSeriesOptions).normalizedTo = 100;
            }

        it.each([
            'vertical-lines',
            'horizontal-lines',
            'forward-slanted-lines',
            'backward-slanted-lines',
            'circles',
            'squares',
            'triangles',
            'diamonds',
            'stars',
            'hearts',
            'crosses',
        ] as AgPatternName[])('it should create a chart with %s pattern', async (pattern) => {
            const series = EXAMPLE.series as AgAreaSeriesOptions[];
            const options: AgChartOptions = {
                ...EXAMPLE,
                series: series.map(
                    (s) =>
                        ({
                            ...s,
                            fill: {
                                type: 'pattern',
                                pattern,
                            },
                        }) as AgAreaSeriesOptions
                ),
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it.each(CUSTOM_SVG_PATHS)(
            'it should create a chart with custom svg pattern',
            async ({ path, width, height }) => {
                const series = EXAMPLE.series as AgAreaSeriesOptions[];

                const options: AgChartOptions = {
                    ...EXAMPLE,
                    series: series.map(
                        (s) =>
                            ({
                                ...s,
                                fill: {
                                    type: 'pattern',
                                    path,
                                    width,
                                    height,
                                    strokeWidth: 0,
                                },
                            }) as AgAreaSeriesOptions
                    ),
                };
                prepareTestOptions(options);

                chart = AgCharts.create(options);

                await waitForChartStability(chart);
                await compare(PATTERN_SNAPSHOT_DEFAULTS);
            }
        );

        it.each(INVALID_CUSTOM_SVG_PATHS)(
            'it should create a chart with custom svg pattern',
            async ({ path, warningMessage }) => {
                const series = EXAMPLE.series as AgAreaSeriesOptions[];

                const options: AgChartOptions = {
                    ...EXAMPLE,
                    series: series.map(
                        (s) =>
                            ({
                                ...s,
                                fill: {
                                    type: 'pattern',
                                    path,
                                },
                            }) as AgAreaSeriesOptions
                    ),
                };
                prepareTestOptions(options);

                chart = AgCharts.create(options);

                await waitForChartStability(chart);
                await compare(PATTERN_SNAPSHOT_DEFAULTS);

                expect(console.warn).toHaveBeenCalledWith(warningMessage);
            }
        );
    });

    describe('image fill', () => {
        const EXAMPLE = deepClone(examples.SIMPLE_AREA_GRAPH_EXAMPLE);

        it.each(['repeat', 'no-repeat'] as AgColorRepeat[])(
            'it should create a chart with repeat %s image',
            async (repetition) => {
                const series = (EXAMPLE.series as AgAreaSeriesOptions[])[0];
                const options: AgChartOptions = {
                    ...EXAMPLE,
                    series: [
                        {
                            ...series,
                            normalizedTo: 100,
                            fillOpacity: 1,
                            fill: {
                                type: 'image',
                                url: `${process.cwd()}/packages/ag-charts-website/public/example-assets/docs-images/brandColorsTile.png`,
                                width: 50,
                                height: 50,
                                repeat: repetition,
                            },
                        },
                    ] as AgAreaSeriesOptions[],
                };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare(PATTERN_SNAPSHOT_DEFAULTS);
            }
        );

        it.each(['contain', 'cover', 'stretch', 'none'] as AgImageFillFit[])(
            'it should create a chart with fit %s image',
            async (fit) => {
                const series = (EXAMPLE.series as AgAreaSeriesOptions[])[0];
                const options: AgChartOptions = {
                    ...EXAMPLE,
                    series: [
                        {
                            ...series,
                            normalizedTo: 100,
                            fillOpacity: 1,
                            fill: {
                                type: 'image',
                                url: `${process.cwd()}/packages/ag-charts-website/public/example-assets/docs-images/ag-grid-logomark.png`,
                                fit,
                            },
                        },
                    ] as AgAreaSeriesOptions[],
                };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare(PATTERN_SNAPSHOT_DEFAULTS);
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
                        type: 'area',
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

        it('complex fills', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 'a', y: 100 },
                    { x: 'b', y: -100 },
                    { x: 'c', y: 200 },
                    { x: 'd', y: 100 },
                ],
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        marker: {
                            size: 40,
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
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('CRT-859', () => {
        it('should render undefined points correctly', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: -6 },
                    { x: 1, y: 0 },
                    { x: 2, y: undefined },
                    { x: 3, y: -2 },
                    { x: 4, y: -6 },
                ],
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        strokeWidth: 2,
                        marker: {
                            enabled: true,
                        },
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('Stacked cases', () => {
        const data = [
            { month: 'Jan', subscriptions: 222, services: 250, products: 200 },
            { month: 'Feb', subscriptions: 240, services: 255, products: 210 },
            { month: 'Mar', subscriptions: 280, services: 245, products: null },
            { month: 'Apr', subscriptions: 300, services: 260, products: 205 },
            { month: 'May', subscriptions: 350, services: 235, products: 215 },
            { month: 'Jun', subscriptions: 420, services: Infinity, products: 200 },
            { month: 'Jul', subscriptions: 300, services: 255, products: 100 },
            { month: 'Aug', subscriptions: 270, services: 305, products: 210 },
            { month: 'Sep', subscriptions: 260, services: 280, products: 250 },
            { month: 'Oct', subscriptions: 385, services: 250, products: Number.NaN },
            { month: 'Nov', subscriptions: 320, services: 265, products: 215 },
            { month: 'Dec', subscriptions: 330, services: 255, products: 220 },
        ];

        const createAreaExample = (overrides: Partial<AgAreaSeriesOptions> = {}): AgChartOptions => ({
            data,
            series: [
                {
                    type: 'area',
                    xKey: 'month',
                    yKey: 'subscriptions',
                    yName: 'Subscriptions',
                    strokeWidth: 1,
                    stacked: true,
                    interpolation: { type: 'smooth' },
                    marker: { enabled: true },
                    ...overrides,
                },
                {
                    type: 'area',
                    xKey: 'month',
                    yKey: 'services',
                    yName: 'Services',
                    strokeWidth: 1,
                    stacked: true,
                    interpolation: { type: 'step', position: 'middle' },
                    marker: { enabled: true },
                    ...overrides,
                },
                {
                    type: 'area',
                    xKey: 'month',
                    yKey: 'products',
                    yName: 'Products',
                    strokeWidth: 1,
                    stacked: true,
                    interpolation: { type: 'smooth' },
                    marker: { enabled: true },
                    ...overrides,
                },
            ],
        });

        it('handles multiple stacked areas', async () => {
            const options = createAreaExample({});

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('handles missing data', async () => {
            const options = createAreaExample({ connectMissingData: true });

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('AG-11673 styler', () => {
        type D = unknown;
        type C = unknown;
        type M = MockAreaStyler<D, C>;
        let styler: ReturnType<typeof newFreezableMock<D, C, M>>;
        const data = [
            { month: 'January', sales: 1200, expenses: 800 },
            { month: 'February', sales: 1500, expenses: 950 },
            { month: 'March', sales: 1700, expenses: 1100 },
        ];
        beforeEach(() => {
            styler = newFreezableMock<D, C, M>(
                (params: AgAreaSeriesStylerParams<D, C>): AgAreaSeriesStylerResult | undefined => {
                    if (params.yKey === 'sales')
                        return {
                            marker: {
                                fill: 'cyan',
                                shape: 'triangle',
                                size: 50,
                            },
                            fill: 'skyblue',
                            fillOpacity: 0.7,
                            lineDash: [3, 3],
                            lineDashOffset: 5,
                            stroke: 'blue',
                            strokeWidth: 7,
                        };
                    else if (params.yKey === 'expenses' || params.yKey === 'expenses2')
                        return {
                            marker: {
                                fill: 'magenta',
                                fillOpacity: 0.5,
                                shape: 'star',
                                size: 40,
                            },
                            fill: 'navy',
                            fillOpacity: 0.4,
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
                            { type: 'area', xKey: 'month', yKey: 'sales', styler: styler.frozen, context: c1 },
                            { type: 'area', xKey: 'month', yKey: 'expenses', styler: styler.frozen, context: c2 },
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
        describe('deriveMarkerEnabledFromStyler', () => {
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareTestOptions({
                        data: [
                            { month: 'January', sales: 1200, sales2: 2400, expenses: 800, expenses2: 400 },
                            { month: 'February', sales: 1500, sales2: 3000, expenses: 950, expenses2: 475 },
                            { month: 'March', sales: 1700, sales2: 3400, expenses: 1100, expenses2: 550 },
                        ],
                        series: [
                            {
                                type: 'area',
                                xKey: 'month',
                                yKey: 'sales',
                                // Do not draw markers, despite `styler` enabling markers.
                                marker: { enabled: false },
                                styler: styler.frozen,
                            },
                            {
                                type: 'area',
                                xKey: 'month',
                                yKey: 'sales2',
                                // Draw default markers, despite `styler` not enabling markers.
                                marker: { enabled: true },
                                styler: () => undefined,
                            },
                            {
                                type: 'area',
                                xKey: 'month',
                                yKey: 'expenses',
                                // Draw markers, both `marker` and `styler` enable markers.
                                marker: { enabled: true },
                                styler: styler.frozen,
                            },
                            {
                                type: 'area',
                                xKey: 'month',
                                yKey: 'expenses2',
                                // Draw markers, despite the `marker.enabled: false` default.
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
        describe('fill gradient stars', () => {
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareTestOptions({
                        data: [
                            { x: '1', y: 1200 },
                            { x: '2', y: 1500 },
                            { x: '3', y: 1700 },
                        ],
                        legend: {},
                        series: [
                            {
                                type: 'area',
                                xKey: 'x',
                                yKey: 'y',
                                styler: () => {
                                    return {
                                        marker: {
                                            fill: {
                                                type: 'gradient',
                                                colorStops: [
                                                    { color: 'dodgerblue', stop: 0.1 },
                                                    { color: 'lightcyan' },
                                                ],
                                            },
                                            size: 75,
                                            shape: 'star',
                                        },
                                    };
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
        describe('priorities', () => {
            beforeEach(async () => {
                const itemStyler = (params: AgAreaSeriesMarkerItemStylerParams<D, C>): AgSeriesMarkerStyle => {
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
                                type: 'area',
                                xKey: 'month',
                                yKey: 'sales',
                                marker: {
                                    fill: 'lime', // ignored
                                    shape: 'square', // ignored
                                    strokeWidth: 3, // ignored only for February
                                    itemStyler,
                                },
                                fill: 'limegreen', // ignored
                                styler: styler.frozen,
                            },
                            {
                                type: 'area',
                                xKey: 'month',
                                yKey: 'expenses',
                                marker: {
                                    fill: 'olive', // ignored
                                    shape: 'square', // ignored
                                    itemStyler,
                                },
                                fill: 'olivedrab', // ignored
                                stroke: 'green', // ignored
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
    });

    describe('segmentation', () => {
        it('should render area series with segmentation styling on x-axis', async () => {
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
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
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

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render area series with segmentation styling on y-axis', async () => {
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
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'y',
                            segments: [
                                {
                                    start: 10,
                                    stop: 20,
                                    fill: 'rgba(255, 165, 0, 0.4)',
                                    stroke: 'orange',
                                    strokeWidth: 2,
                                    lineDash: [5, 5],
                                },
                                {
                                    start: 20,
                                    stop: 30,
                                    fill: 'rgba(128, 0, 128, 0.4)',
                                    stroke: 'purple',
                                    strokeWidth: 3,
                                },
                                {
                                    start: 30,
                                    fill: 'rgba(0, 255, 255, 0.4)',
                                    stroke: 'cyan',
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
            await compare();
        });

        it('should render stacked area series with segmentation', async () => {
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
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y1',
                        stacked: true,
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 0, stop: 2.5, fill: 'rgba(255, 0, 0, 0.5)', stroke: 'red', strokeWidth: 1 },
                                { start: 2.5, fill: 'rgba(0, 0, 255, 0.5)', stroke: 'blue', strokeWidth: 1 },
                            ],
                        },
                    },
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y2',
                        stacked: true,
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 0, stop: 3, fill: 'rgba(0, 255, 0, 0.4)', stroke: 'green', strokeWidth: 2 },
                                { start: 3, fill: 'rgba(128, 0, 128, 0.4)', stroke: 'purple', strokeWidth: 2 },
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

        it('should render area series with pattern fill segmentation', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: 20 },
                    { x: 1, y: 30 },
                    { x: 2, y: 25 },
                    { x: 3, y: 35 },
                    { x: 4, y: 40 },
                    { x: 5, y: 45 },
                ],
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 0,
                                    stop: 2,
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'vertical-lines',
                                    },
                                    stroke: 'red',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 2,
                                    stop: 4,
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'horizontal-lines',
                                    },
                                    stroke: 'blue',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 4,
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'circles',
                                    },
                                    stroke: 'green',
                                    strokeWidth: 2,
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

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should render area series with gradient fill segmentation', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: 20 },
                    { x: 1, y: 30 },
                    { x: 2, y: 25 },
                    { x: 3, y: 35 },
                    { x: 4, y: 40 },
                    { x: 5, y: 45 },
                ],
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 0,
                                    stop: 2,
                                    fill: {
                                        type: 'gradient',
                                    },
                                    stroke: 'red',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 2,
                                    stop: 4,
                                    fill: {
                                        type: 'gradient',
                                    },
                                    stroke: 'blue',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 4,
                                    fill: {
                                        type: 'gradient',
                                    },
                                    stroke: 'green',
                                    strokeWidth: 2,
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

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should render area series with inherited gradient fill segmentation', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: 20 },
                    { x: 1, y: 30 },
                    { x: 2, y: 25 },
                    { x: 3, y: 35 },
                    { x: 4, y: 40 },
                    { x: 5, y: 45 },
                ],

                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        fill: {
                            type: 'gradient',
                        },
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 0,
                                    stop: 2,
                                    stroke: 'red',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 2,
                                    stop: 4,
                                    stroke: 'blue',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 4,
                                    stroke: 'green',
                                    strokeWidth: 2,
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

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should use cutout on dimmed non-highlight markers to mask the line for area', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 1, y: 5 },
                    { x: 2, y: 15 },
                    { x: 3, y: 10 },
                    { x: 4, y: 20 },
                ],
                highlight: {
                    drawingMode: 'cutout',
                },
                series: [
                    {
                        type: 'area',
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

        it('should render area series with positive/negative segmentation', async () => {
            const options: AgChartOptions = {
                title: { text: 'Total PnL' },
                data: [
                    { key: '2019-04-05', pnl: 60 },
                    { key: '2019-04-10', pnl: -110 },
                    { key: '2019-04-15', pnl: -240 },
                    { key: '2019-04-18', pnl: -585 },
                    { key: '2019-04-21', pnl: -210 },
                    { key: '2019-04-24', pnl: -595 },
                    { key: '2020-03-17', pnl: -320 },
                    { key: '2020-03-18', pnl: -165 },
                    { key: '2020-03-19', pnl: -95 },
                    { key: '2020-03-20', pnl: 15 },
                    { key: '2020-03-26', pnl: 40 },
                    { key: '2020-04-05', pnl: 90 },
                    { key: '2020-04-12', pnl: 180 },
                    { key: '2020-04-19', pnl: 420 },
                    { key: '2020-05-03', pnl: 150 },
                    { key: '2020-05-22', pnl: 170 },
                ],
                series: [
                    {
                        type: 'area',
                        interpolation: {
                            type: 'smooth',
                        },
                        xKey: 'key',
                        xName: 'Date',
                        yKey: 'pnl',
                        yName: 'PnL',
                        marker: {
                            enabled: true,
                            itemStyler: ({ datum, yKey }) => {
                                const v = datum[yKey];
                                return {
                                    fill: v >= 0 ? 'green' : 'red',
                                    stroke: v >= 0 ? 'green' : 'red',
                                };
                            },
                        },
                        segmentation: {
                            key: 'y',
                            segments: [
                                {
                                    start: 0,
                                    fill: 'green',
                                    fillOpacity: 0.2,
                                    stroke: 'green',
                                    strokeWidth: 3,
                                },
                                {
                                    stop: 0,
                                    fill: 'red',
                                    fillOpacity: 0.3,
                                    stroke: 'red',
                                    strokeWidth: 3,
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

        it('should render Apple revenue area chart with segmentation', async () => {
            const options: AgChartOptions = {
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
                        type: 'area',
                        xKey: 'quarter',
                        yKey: 'iphone',
                        yName: 'iPhone',
                        segmentation: {
                            key: 'y',
                            segments: [
                                {
                                    stroke: 'red',
                                    strokeWidth: 25,
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

        it('should render area series with missing start values in segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Jan', y: 10 },
                    { x: 'Feb', y: 15 },
                    { x: 'Mar', y: 12 },
                    { x: 'Apr', y: 18 },
                    { x: 'May', y: 22 },
                    { x: 'Jun', y: 16 },
                ],
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'Jan',
                                    stop: 'Feb',
                                    fill: 'rgba(255, 0, 0, 0.6)',
                                    stroke: 'red',
                                    strokeWidth: 2,
                                },
                                { stop: 'Apr', fill: 'rgba(0, 0, 255, 0.6)', stroke: 'blue', strokeWidth: 2 }, // Missing start - should use 'Feb'
                                { stop: 'Jun', fill: 'rgba(0, 255, 0, 0.6)', stroke: 'green', strokeWidth: 2 }, // Missing start - should use 'Apr'
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

        it('should render area series with missing stop values in segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Q1', y: 100 },
                    { x: 'Q2', y: 120 },
                    { x: 'Q3', y: 110 },
                    { x: 'Q4', y: 140 },
                ],
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 'Q1', fill: 'rgba(255, 100, 100, 0.7)', stroke: '#ff4444', strokeWidth: 3 }, // Missing stop - should use 'Q2'
                                { start: 'Q2', fill: 'rgba(100, 100, 255, 0.7)', stroke: '#4444ff', strokeWidth: 3 }, // Missing stop - should use 'Q4'
                                {
                                    start: 'Q4',
                                    stop: 'Q4',
                                    fill: 'rgba(100, 255, 100, 0.7)',
                                    stroke: '#44ff44',
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
            await compare();
        });

        it('should render area series with Y-axis segmentation and missing values', async () => {
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
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'y',
                            segments: [
                                {
                                    start: 0,
                                    stop: 20,
                                    fill: 'rgba(220, 20, 60, 0.5)',
                                    stroke: 'crimson',
                                    strokeWidth: 2,
                                },
                                { stop: 40, fill: 'rgba(0, 100, 200, 0.5)', stroke: 'mediumblue', strokeWidth: 2 }, // Missing start - should use 20
                                { start: 40, fill: 'rgba(34, 139, 34, 0.5)', stroke: 'forestgreen', strokeWidth: 2 }, // Missing stop - should extend to max
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

        it('should render stacked area series with missing segmentation values', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 1, y1: 10, y2: 5 },
                    { x: 2, y1: 15, y2: 8 },
                    { x: 3, y1: 12, y2: 6 },
                    { x: 4, y1: 18, y2: 10 },
                    { x: 5, y1: 22, y2: 12 },
                ],
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y1',
                        yName: 'Series 1',
                        stackGroup: 'stack1',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 1, stop: 2, fill: 'rgba(255, 0, 0, 0.7)', stroke: 'red' },
                                { fill: 'rgba(0, 255, 0, 0.7)', stroke: 'green' }, // Missing both - should bridge from 2 to 4
                                { start: 4, fill: 'rgba(0, 0, 255, 0.7)', stroke: 'blue' }, // Missing stop - should extend to end
                            ],
                        },
                    },
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y2',
                        yName: 'Series 2',
                        stackGroup: 'stack1',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { stop: 3, fill: 'rgba(255, 165, 0, 0.7)', stroke: 'orange' }, // Missing start - should start from beginning
                                { start: 3, fill: 'rgba(128, 0, 128, 0.7)', stroke: 'purple' }, // Missing stop - should extend to end
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

        it('should render area series with pattern fills and missing segmentation values', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Mon', y: 20 },
                    { x: 'Tue', y: 25 },
                    { x: 'Wed', y: 18 },
                    { x: 'Thu', y: 30 },
                    { x: 'Fri', y: 35 },
                ],
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'Mon',
                                    stop: 'Tue',
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'vertical-lines',
                                        stroke: 'darkred',
                                        strokeWidth: 1,
                                    },
                                    stroke: 'darkred',
                                    strokeWidth: 2,
                                },
                                {
                                    stop: 'Thu', // Missing start - should use 'Tue'
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'horizontal-lines',
                                        stroke: 'darkblue',
                                        strokeWidth: 1,
                                    },
                                    stroke: 'darkblue',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 'Thu', // Missing stop - should extend to end
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'circles',
                                        stroke: 'darkgreen',
                                        strokeWidth: 1,
                                    },
                                    stroke: 'darkgreen',
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
            await compare();
        });
    });

    describe('predict axes', () => {
        it('number', async () => {
            const options: AgChartOptions = {
                data: [
                    {
                        quarter: 1,
                        iphone: 140,
                    },
                    {
                        quarter: 2,
                        iphone: 124,
                    },
                    {
                        quarter: 3,
                        iphone: 112,
                    },
                    {
                        quarter: 4,
                        iphone: 118,
                    },
                ],
                series: [{ type: 'area', xKey: 'quarter', yKey: 'iphone' }],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('category', async () => {
            const options: AgChartOptions = {
                data: [
                    {
                        quarter: "Q1'18",
                        iphone: 140,
                    },
                    {
                        quarter: "Q2'18",
                        iphone: 124,
                    },
                    {
                        quarter: "Q3'18",
                        iphone: 112,
                    },
                    {
                        quarter: "Q4'18",
                        iphone: 118,
                    },
                ],
                series: [{ type: 'area', xKey: 'quarter', yKey: 'iphone' }],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('time', async () => {
            const options: AgChartOptions = {
                data: [
                    {
                        quarter: new Date('2018-01-01'),
                        iphone: 140,
                    },
                    {
                        quarter: new Date('2018-04-01'),
                        iphone: 124,
                    },
                    {
                        quarter: new Date('2018-07-01'),
                        iphone: 112,
                    },
                    {
                        quarter: new Date('2018-10-01'),
                        iphone: 118,
                    },
                ],
                series: [{ type: 'area', xKey: 'quarter', yKey: 'iphone' }],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('AG-15743 legendItemName', () => {
        testLegendItemName({
            create: (o) => (chart = AgCharts.create(prepareTestOptions(o))),
            compare,
            chartOptions: {
                data: [
                    { x: 'Start', s1: 0, s2: 0, s3: 0 },
                    { x: 'End', s1: 100, s2: 200, s3: 300 },
                ],
                series: [
                    { type: 'area', xKey: 'x', yKey: 's1', yName: 'series 1' },
                    { type: 'area', xKey: 'x', yKey: 's2', yName: 'series 2' },
                    { type: 'area', xKey: 'x', yKey: 's3', yName: 'series 3' },
                ],
            },
        });
    });

    describe('null category key', () => {
        it('should reject null category key with warning', async () => {
            const options: AgChartOptions = examples.AREA_NULL_CATEGORY_KEY_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [AreaSeries-1 / xValue] ignored:",
    "[null]",
  ],
]
`);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = examples.AREA_NULL_CATEGORY_KEY_ALLOWED_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = examples.AREA_UNDEFINED_CATEGORY_KEY_ALLOWED_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });

        it('should treat null and undefined as distinct categories when allowNullKeys is true', async () => {
            const options: AgChartOptions = examples.AREA_NULL_AND_UNDEFINED_KEYS_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });
    });

    describe('axis min/max clipping', () => {
        it('should clip area series when x-axis min/max is set', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 0, y: 5 },
                    { x: 1, y: 30 },
                    { x: 2, y: 10 },
                    { x: 3, y: 25 },
                    { x: 4, y: 15 },
                    { x: 5, y: 35 },
                ],
                series: [{ type: 'area', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'number', position: 'bottom', min: 1, max: 4 },
                    y: { type: 'number', position: 'left' },
                },
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();

            // Verify Y-domain is computed from all visible data within X range [1..4]
            // (visible y values: 30, 10, 25, 15; area baseline at 0),
            // not from a single point (the pre-fix bug).
            const { axes } = deproxy(chart);
            const yAxis = axes.find((a: any) => a.direction === ChartAxisDirection.Y);
            expect(yAxis!.dataDomain.domain).toEqual([0, 30]);
        });

        it('should clip area series when y-axis min/max is set', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 0, y: 5 },
                    { x: 1, y: 30 },
                    { x: 2, y: 10 },
                    { x: 3, y: 25 },
                    { x: 4, y: 15 },
                    { x: 5, y: 35 },
                ],
                series: [{ type: 'area', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left', nice: false, min: 10, max: 25 },
                },
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('crossfiltering', () => {
        it('selectedKey with one selected item sets crossFiltering on contextNodeData', async () => {
            const data = [
                { x: 'Jan', y: 10, selected: true },
                { x: 'Feb', y: 20, selected: false },
                { x: 'Mar', y: 15, selected: false },
            ];
            const options = prepareTestOptions({
                data,
                series: [{ type: 'area', xKey: 'x', yKey: 'y', selectedKey: 'selected' } as any],
            });
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            await compare();
        });
    });
});
