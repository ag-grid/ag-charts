import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type {
    AgAreaSeriesOptions,
    AgCartesianChartOptions,
    AgChartInstance,
    AgChartOptions,
    AgColorRepeat,
    AgImageFillFit,
    AgPatternName,
    AgUnitTimeAxisOptions,
} from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import { Transformable } from '../../../scene/transformable';
import { deepClone } from '../../../util/json';
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
import type { CartesianOrPolarTestCase, TestCase } from '../../test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    clickAction,
    deproxy,
    doubleClickAction,
    doubleTapAction,
    extractImageData,
    mixinReversedAxesCases,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
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
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'log'], seriesTypes: ['area'] }),
        ...extra,
    };
};

const EXAMPLES: Record<string, CartesianOrPolarTestCase & { skip?: boolean }> = {
    ...mixinReversedAxesCases({
        AREA_MISSING_Y_DATA_EXAMPLE: {
            options: examples.AREA_MISSING_Y_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['area'] }),
        },
        STACKED_AREA_MISSING_Y_DATA_EXAMPLE: {
            options: examples.STACKED_AREA_MISSING_Y_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: ['category', 'number'],
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
                axisTypes: ['category', 'number'],
                seriesTypes: repeat('area', 4),
            }),
        },
        STACKED_AREA_MISSING_Y_DATA_PER_SERIES_EXAMPLE: {
            options: examples.STACKED_AREA_MISSING_Y_DATA_PER_SERIES_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: ['category', 'number'],
                seriesTypes: repeat('area', 4),
            }),
        },
        AREA_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE: {
            options: examples.AREA_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['area'] }),
            warnings: [
                ['AG Charts - invalid value of type [undefined] for [AreaSeries-1 / xValue] ignored:', '[undefined]'],
            ],
        },
        AREA_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE: {
            options: examples.AREA_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: ['unit-time', 'number'], seriesTypes: ['area'] }),
            warnings: [['AG Charts - invalid value of type [object] for [AreaSeries-1 / xValue] ignored:', '[null]']],
        },
        STACKED_AREA_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE: {
            options: examples.STACKED_AREA_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'number'],
                seriesTypes: repeat('area', 2),
            }),
            warnings: [
                [
                    'AG Charts - invalid value of type [undefined] for [AreaSeries-1,AreaSeries-2 / xValue] ignored:',
                    '[undefined]',
                ],
            ],
        },
        STACKED_AREA_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE: {
            options: examples.STACKED_AREA_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: ['unit-time', 'number'],
                seriesTypes: repeat('area', 2),
            }),
            warnings: [
                [
                    'AG Charts - invalid value of type [object] for [AreaSeries-1,AreaSeries-2 / xValue] ignored:',
                    '[null]',
                ],
            ],
        },
        AREA__TIME_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.AREA_TIME_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: ['unit-time', 'number'],
                seriesTypes: repeat('area', 2),
            }),
        },
        AREA_NUMBER_X_AXIS_TIME_Y_AXIS: {
            options: examples.AREA_NUMBER_X_AXIS_TIME_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'unit-time'],
                seriesTypes: repeat('area', 2),
            }),
            skip: true,
        },
        AREA_NUMBER_AXES_0_X_DOMAIN: {
            options: examples.AREA_NUMBER_AXES_0_X_DOMAIN,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'number'],
                seriesTypes: repeat('area', 2),
            }),
        },
        AREA_NUMBER_AXES_0_Y_DOMAIN: {
            options: examples.AREA_NUMBER_AXES_0_Y_DOMAIN,
            assertions: cartesianChartAssertions({
                axisTypes: ['number', 'number'],
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
                axisTypes: ['category', 'number'],
                seriesTypes: repeat('area', 4),
            }),
        },
        STACKED_AREA_MISSING_FIRST_Y_DATA_EXAMPLE: {
            options: examples.STACKED_AREA_MISSING_FIRST_Y_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: ['category', 'number'],
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
            assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: repeat('area', 4) }),
        },
        AREA_SERIES_VERTICAL_GRADIENT_FILL: {
            options: examples.AREA_SERIES_VERTICAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['area'] }),
        },
        AREA_SERIES_HORIZONTAL_GRADIENT_FILL: {
            options: examples.AREA_SERIES_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['area'] }),
        },
        AREA_SERIES_DEFAULT_GRADIENT_FILL: {
            options: examples.AREA_SERIES_DEFAULT_GRADIENT_FILL,
            assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['area'] }),
        },
        AREA_SERIES_GRADIENT_FILL_AXES_BOUNDS: {
            options: examples.AREA_SERIES_GRADIENT_FILL_AXES_BOUNDS,
            assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: repeat('area', 2) }),
        },
    }),
    AREA_SERIES_DEFAULT_PATTERN_FILL: {
        options: examples.AREA_SERIES_DEFAULT_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['area'] }),
    },
    AREA_SERIES_VERTICAL_LINES_PATTERN_FILL: {
        options: examples.AREA_SERIES_VERTICAL_LINES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['area'] }),
    },
    AREA_SERIES_HORIZONTAL_LINES_PATTERN_FILL: {
        options: examples.AREA_SERIES_HORIZONTAL_LINES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['area'] }),
    },
    AREA_SERIES_FORWARD_SLANTED_LINES_PATTERN_FILL: {
        options: examples.AREA_SERIES_FORWARD_SLANTED_LINES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['area'] }),
    },
    AREA_SERIES_BACKWARD_SLANTED_LINES_PATTERN_FILL: {
        options: examples.AREA_SERIES_BACKWARD_SLANTED_LINES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['area'] }),
    },
    AREA_SERIES_CIRCLES_PATTERN_FILL: {
        options: examples.AREA_SERIES_CIRCLES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['area'] }),
    },
    AREA_SERIES_SQUARES_PATTERN_FILL: {
        options: examples.AREA_SERIES_SQUARES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['area'] }),
    },
    AREA_SERIES_TRIANGLES_PATTERN_FILL: {
        options: examples.AREA_SERIES_TRIANGLES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['area'] }),
    },
    AREA_SERIES_DIAMONDS_PATTERN_FILL: {
        options: examples.AREA_SERIES_DIAMONDS_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['area'] }),
    },
    AREA_SERIES_STARS_PATTERN_FILL: {
        options: examples.AREA_SERIES_STARS_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['area'] }),
    },
    AREA_SERIES_HEARTS_PATTERN_FILL: {
        options: examples.AREA_SERIES_HEARTS_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['area'] }),
    },
    AREA_SERIES_CROSSES_PATTERN_FILL: {
        options: examples.AREA_SERIES_CROSSES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['area'] }),
    },
    AREA_SERIES_CUSTOM_SVG_PATH_PATTERN_FILL: {
        options: examples.AREA_SERIES_CUSTOM_SVG_PATH_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['area'] }),
    },
    AREA_SERIES_CUSTOMISED_PATTERN_FILL: {
        options: examples.AREA_SERIES_CUSTOMISED_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['area'] }),
    },
};

const INVALID_DATA_EXAMPLES: Record<string, TestCase> = {
    AREA_CATEGORY_X_AXIS_INVALID_DOMAIN_LOG_Y_AXIS: buildLogAxisTestCase(DATA_INVALID_DOMAIN_LOG_AXIS),
};

describe('AreaSeries', () => {
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

                    warnings.forEach((message, index) => {
                        expect(console.warn).toHaveBeenNthCalledWith(
                            index + 1,
                            ...(Array.isArray(message) ? message : [message])
                        );
                    });
                    if (warnings.length === 0) {
                        expect(console.warn).not.toHaveBeenCalled();
                    }
                });

                it(`for ${exampleName} it should render to canvas as expected`, async () => {
                    const options: AgChartOptions = { ...example.options };
                    prepareTestOptions(options);

                    chart = AgCharts.create(options);
                    await compare();

                    if (example.extraScreenshotActions) {
                        await example.extraScreenshotActions(chart);
                        await compare();
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
        (EXAMPLE.axes![0] as AgUnitTimeAxisOptions).label!.format = '%b %Y';

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
                    await chart.update({ ...EXAMPLE });

                    await compare();
                });
            }
        });
    });

    describe('undefined data animation', () => {
        const animate = spyOnAnimationManager();

        const EXAMPLE = deepClone(examples.STACKED_AREA_GRAPH_EXAMPLE);
        EXAMPLE.series?.forEach((series: any) => {
            series.interpolation = { type: 'smooth' };
        });

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
        EXAMPLE.series?.forEach((s) => {
            (s as AgAreaSeriesOptions).strokeWidth = 2;
        });

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
        const legendClicks: string[] = [];

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

        EXAMPLE.series?.forEach((s) => {
            (s as AgAreaSeriesOptions).normalizedTo = 100;
        });

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
            await compare();
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
                await compare();
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
                await compare();

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
                await compare();
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
                await compare();
            }
        );
    });
});
