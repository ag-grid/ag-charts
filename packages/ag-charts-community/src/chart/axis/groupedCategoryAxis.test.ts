import { afterEach, describe, expect, it, test } from '@jest/globals';

import { mapValues } from 'ag-charts-core';
import type {
    AgBaseChartOptions,
    AgCartesianAxisPosition,
    AgCartesianAxisType,
    AgCartesianChartOptions,
    AgPolarChartOptions,
} from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import {
    DATA_GROUPED_MULTIPLE_NULLS,
    DATA_GROUPED_NULL_FIRST_LEVEL,
    DATA_GROUPED_NULL_LAST_LEVEL,
    DATA_GROUPED_NULL_MIDDLE_LEVEL,
    DATA_GROUPED_NULL_VS_STRING_NULL,
} from '../test/data';
import * as examples from '../test/examples';
import * as axesExamples from '../test/examples-axes';
import type { ChartOrProxy } from '../test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    createChart,
    extractImageData,
    prepareTestOptions,
    repeat,
    reverseAxes,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

const EXAMPLE_GRID_LINE = {
    width: 2,
    style: [
        { fill: 'red', fillOpacity: 0.1, stroke: 'red' },
        { fill: 'blue', fillOpacity: 0.1, stroke: 'blue' },
        { fill: 'green', fillOpacity: 0.1, stroke: 'green' },
        { fill: 'yellow', fillOpacity: 0.1, stroke: 'yellow' },
    ],
};

function applyRotation<T extends AgCartesianChartOptions | AgPolarChartOptions>(opts: T, rotation: number): T {
    return {
        ...opts,
        axes: mapValues(opts.axes ?? {}, (axis) => ({
            ...axis,
            label: { ...axis.label, rotation, avoidCollisions: false },
        })),
    };
}

function disableLabelsDepth0<T extends AgCartesianChartOptions | AgPolarChartOptions>(opts: T): T {
    return {
        ...opts,
        axes: mapValues(opts.axes ?? {}, (axis) =>
            axis.type === 'grouped-category'
                ? {
                      ...axis,
                      depthOptions: axis.depthOptions?.map((depthOpts, i) =>
                          i ? depthOpts : { ...depthOpts, label: { enabled: false } }
                      ),
                  }
                : axis
        ),
    };
}

function applyAxesFlip<T extends AgCartesianChartOptions>(opts: T): T {
    const positionFlip = (position?: AgCartesianAxisPosition) => {
        switch (position) {
            case 'top':
                return 'bottom';
            case 'left':
                return 'right';
            case 'bottom':
                return 'top';
            case 'right':
                return 'left';
            default:
                return position;
        }
    };

    return {
        ...opts,
        axes: mapValues(opts.axes ?? {}, (axis) => ({ ...axis, position: positionFlip(axis.position) })) ?? undefined,
    };
}

function applyGridLineStyle<T extends AgCartesianChartOptions>(opts: T): T {
    return {
        ...opts,
        axes:
            mapValues(opts.axes ?? {}, (axis) =>
                axis.type === 'grouped-category'
                    ? {
                          ...axis,
                          gridLine: EXAMPLE_GRID_LINE,
                      }
                    : axis
            ) ?? undefined,
    };
}

type TestCase<T extends AgBaseChartOptions = AgCartesianChartOptions> = {
    options: T;
    assertions: (chart: ChartOrProxy) => Promise<void> | void;
    extraScreenshotActions?: (chart: ChartOrProxy) => Promise<void>;
    compare?: AgCartesianAxisType[];
};

const EXAMPLES: Record<string, TestCase> = {
    ...mixinDerivedCases({
        GROUPED_CATEGORY_AXIS: {
            options: axesExamples.GROUPED_CATEGORY_AXIS_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'grouped-category', y: 'number' },
                seriesTypes: ['bar'],
            }),
            compare: ['grouped-category'],
        },
        INTEGRATED_CHARTS_GROUPED_CATEGORY_AXIS_EXAMPLE: {
            options: examples.INTEGRATED_CHARTS_GROUPED_CATEGORY_AXIS_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'grouped-category', y: 'number' },
                seriesTypes: repeat('bar', 3),
            }),
            compare: ['grouped-category'],
        },
        GROUPED_CATEGORY_AXIS_DEPTH_OPTIONS_EXAMPLE: {
            options: examples.GROUPED_CATEGORY_CHART_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'grouped-category', y: 'number' },
                seriesTypes: repeat('bar', 3),
            }),
            compare: ['grouped-category'],
        },
        GROUPED_CATEGORY_AXIS_DEPTH_OPTIONS_EXAMPLE_LABELS_DISABLED: {
            options: disableLabelsDepth0(examples.GROUPED_CATEGORY_CHART_EXAMPLE),
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'grouped-category', y: 'number' },
                seriesTypes: repeat('bar', 3),
            }),
            compare: ['grouped-category'],
        },
        GROUPED_CATEGORY_AXIS_WITH_CROSSLINES: {
            options: axesExamples.GROUPED_CATEGORY_AXIS_EXAMPLE_WITH_CROSSLINES,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'grouped-category', y: 'number' },
                seriesTypes: ['bar'],
            }),
            compare: ['grouped-category'],
        },
    }),
    INTEGRATED_CHARTS_OVERLAPPING_GROUPED_CATEGORY_AXIS_EXAMPLE: {
        options: examples.INTEGRATED_CHARTS_OVERLAPPING_GROUPED_CATEGORY_AXIS_EXAMPLE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'grouped-category', y: 'number' },
            seriesTypes: repeat('bar', 21),
        }),
        compare: ['grouped-category'],
    },
    GROUPED_CATEGORY_AXIS_FILLS: {
        options: applyGridLineStyle(axesExamples.GROUPED_CATEGORY_AXIS_EXAMPLE),
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'grouped-category', y: 'number' },
            seriesTypes: ['bar'],
        }),
        compare: ['grouped-category'],
    },
};

const EXAMPLES_CLIPPING: Record<string, TestCase> = {
    ...mixinDerivedCases({
        GROUPED_CATEGORY_AXIS_GRIDLINE_TICKLINE_CLIPPING: {
            options: axesExamples.GROUPED_CATEGORY_AXIS_GRIDLINE_TICKLINE_CLIPPING,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'grouped-category', y: 'number' },
                seriesTypes: ['bar'],
            }),
            compare: ['grouped-category'],
        },
    }),
};

function mixinDerivedCases<T extends AgBaseChartOptions>(
    baseCases: Record<string, TestCase<T>>
): Record<string, TestCase<T>> {
    const result = { ...baseCases };

    for (const [name, baseCase] of Object.entries(baseCases)) {
        // Add manual rotation.
        result[name + '_MANUAL_ROTATION'] = {
            ...baseCase,
            options: applyRotation(baseCase.options, -30),
        };

        // Add flipped axes.
        result[name + '_FLIP'] = {
            ...baseCase,
            options: applyAxesFlip(baseCase.options),
        };

        result[name + '_REVERSED_AXES'] = {
            ...baseCase,
            options: reverseAxes(baseCase.options, true),
        };
    }

    return result;
}

describe('Grouped Category Axis Examples', () => {
    setupMockConsole();

    let chart: ChartOrProxy;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await waitForChartStability(chart);

        const newImageData = extractImageData(ctx);
        expect(newImageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    for (const [exampleName, example] of Object.entries(EXAMPLES)) {
        it(`for ${exampleName} it should create chart instance as expected`, async () => {
            chart = await createChart(example.options);
            await example.assertions(chart);
        });

        it(`for ${exampleName} it should render to canvas as expected`, async () => {
            chart = await createChart(example.options);
            expect(extractImageData(ctx)).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });
    }

    describe('grid and tick line clipping cases', () => {
        for (const [exampleName, example] of Object.entries(EXAMPLES_CLIPPING)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                chart = await createChart(example.options);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                chart = await createChart(example.options);
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            });
        }
    });

    describe('when toggling all series off', () => {
        it('should render correctly', async () => {
            const options = prepareTestOptions({ ...axesExamples.GROUPED_CATEGORY_AXIS_EXAMPLE });
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            await chart.updateDelta({ series: options.series?.map((s) => ({ ...s, visible: false })) });
            await compare();
        });
    });

    describe('AG-15223', () => {
        it('handles lazy data', async () => {
            const options: AgCartesianChartOptions = {
                axes: {
                    x: {
                        type: 'time',
                        position: 'bottom',
                    },
                    y: {
                        type: 'grouped-category',
                        position: 'left',
                    },
                },
                series: [
                    {
                        type: 'scatter',
                        xKey: 'actualStartDateMs',
                        yKey: 'dataGroup',
                    },
                ],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const data = [
                { dataGroup: ['PGM1', 'IR'], actualStartDateMs: 1658289600000 },
                { dataGroup: ['PGM1', 'IR'], actualStartDateMs: 1681358400000 },
                { dataGroup: ['PGM1', 'IR'], actualStartDateMs: 1607576400000 },
                { dataGroup: ['PGM1', 'IR'], actualStartDateMs: 1656561600000 },
                { dataGroup: ['PGM1', 'IR'], actualStartDateMs: 1718856000000 },
                { dataGroup: ['PGM1', 'IR'], actualStartDateMs: 1747195200000 },
                { dataGroup: ['PGM1', 'IR'], actualStartDateMs: 1742443200000 },
                { dataGroup: ['PGM1', 'IR'], actualStartDateMs: 1798434000000 },
            ];

            await chart.updateDelta({ data });
            await waitForChartStability(chart);

            await compare();
        });
    });

    test('provides full text for truncated labels', async () => {
        const longLabel = 'Extremely long grouped-category axis label that forces truncation';
        const data = Array.from({ length: 6 }, (_, index) => ({
            grouping: [`${longLabel} ${index}`, `Inner ${index}`],
            totalWinnings: 500 + index * 10,
        }));

        const options: AgCartesianChartOptions = {
            data,
            axes: {
                x: {
                    type: 'grouped-category',
                    position: 'bottom',
                    label: {
                        avoidCollisions: true,
                    },
                    depthOptions: [
                        { label: { truncate: true, wrapping: 'never' } },
                        { label: { truncate: true, wrapping: 'never' } },
                    ],
                },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'bar',
                    xKey: 'grouping',
                    yKey: 'totalWinnings',
                    grouped: true,
                },
            ],
        };

        chart = await createChart(options);

        const chartInstance = chart as any;
        const groupedAxis = chartInstance.axes.find((axis: any) => axis.type === 'grouped-category');
        expect(groupedAxis).toBeDefined();

        const layout = (groupedAxis?.computedLayout?.tickLabelLayout ?? []) as { textUntruncated?: string }[];
        expect(layout.some((datum) => datum.textUntruncated?.includes(longLabel))).toBe(true);
    });

    test('AG-14639 label boxing', async () => {
        const options = prepareTestOptions({
            data: [
                { location: ['Europe', 'United Kingdom', 'London'], gold: 27, silver: 23, bronze: 17 },
                { location: ['Europe', 'United Kingdom', 'Manchester'], gold: 12, silver: 8, bronze: 10 },
                { location: ['Europe', 'Germany', 'Berlin'], gold: 17, silver: 10, bronze: 15 },
                { location: ['Asia', 'China', 'Beijing'], gold: 38, silver: 32, bronze: 18 },
                { location: ['Asia', 'China', 'Shanghai'], gold: 20, silver: 15, bronze: 12 },
                { location: ['Asia', 'Japan', 'Tokyo'], gold: 27, silver: 14, bronze: 17 },
                { location: ['North America', 'United States', 'Los Angeles'], gold: 46, silver: 37, bronze: 38 },
                { location: ['North America', 'United States', 'New York'], gold: 30, silver: 28, bronze: 25 },
                { location: ['North America', 'Canada', 'Toronto'], gold: 8, silver: 6, bronze: 10 },
                { location: ['South America', 'Brazil', 'Rio de Janeiro'], gold: 7, silver: 6, bronze: 6 },
                { location: ['Africa', 'South Africa', 'Cape Town'], gold: 4, silver: 4, bronze: 6 },
                { location: ['Oceania', 'Australia', 'Sydney'], gold: 17, silver: 7, bronze: 22 },
                { location: ['Oceania', 'New Zealand', 'Auckland'], gold: 10, silver: 5, bronze: 8 },
            ],
            axes: {
                x: {
                    type: 'grouped-category',
                    position: 'bottom',
                    label: {
                        color: 'purple',
                        border: { strokeWidth: 2, stroke: 'red' },
                        fill: 'pink',
                    },
                    depthOptions: [
                        {},
                        { label: { fontWeight: 'bold', fill: 'cyan' } },
                        { label: { fontSize: 10, fill: 'lime' } },
                    ],
                },
                y: { type: 'number', position: 'left' },
            },
            series: [
                { type: 'bar', xKey: 'location', yKey: 'gold' },
                { type: 'bar', xKey: 'location', yKey: 'silver' },
                { type: 'bar', xKey: 'location', yKey: 'bronze' },
            ],
        });
        chart = AgCharts.create(options);
        await compare();
    });

    describe('AG-16613 null values in grouped categories', () => {
        test('handles null at first level of grouped category', async () => {
            const options = prepareTestOptions({
                data: DATA_GROUPED_NULL_FIRST_LEVEL,
                axes: {
                    x: { type: 'grouped-category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'bar', xKey: 'grouping', yKey: 'value' }],
            });
            chart = AgCharts.create(options);
            await compare();
        });

        test('handles null at middle level of grouped category', async () => {
            const options = prepareTestOptions({
                data: DATA_GROUPED_NULL_MIDDLE_LEVEL,
                axes: {
                    x: { type: 'grouped-category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'bar', xKey: 'grouping', yKey: 'value' }],
            });
            chart = AgCharts.create(options);
            await compare();
        });

        test('handles null at last level of grouped category', async () => {
            const options = prepareTestOptions({
                data: DATA_GROUPED_NULL_LAST_LEVEL,
                axes: {
                    x: { type: 'grouped-category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'bar', xKey: 'grouping', yKey: 'value' }],
            });
            chart = AgCharts.create(options);
            await compare();
        });

        test('handles multiple nulls in same grouping', async () => {
            const options = prepareTestOptions({
                data: DATA_GROUPED_MULTIPLE_NULLS,
                axes: {
                    x: { type: 'grouped-category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'bar', xKey: 'grouping', yKey: 'value' }],
            });
            chart = AgCharts.create(options);
            await compare();
        });

        test('distinguishes null from "null" string in grouped categories', async () => {
            const options = prepareTestOptions({
                data: DATA_GROUPED_NULL_VS_STRING_NULL,
                axes: {
                    x: { type: 'grouped-category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'bar', xKey: 'grouping', yKey: 'value' }],
            });
            chart = AgCharts.create(options);
            await compare();
        });
    });
});
