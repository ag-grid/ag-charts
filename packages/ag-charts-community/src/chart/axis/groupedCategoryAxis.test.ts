import { afterEach, describe, expect, it } from '@jest/globals';

import type {
    AgBaseChartOptions,
    AgCartesianAxisPosition,
    AgCartesianAxisType,
    AgCartesianChartOptions,
    AgPolarChartOptions,
} from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
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

function applyRotation<T extends AgCartesianChartOptions | AgPolarChartOptions>(opts: T, rotation: number): T {
    return {
        ...opts,
        axes: opts.axes?.map((axis) => ({ ...axis, label: { ...axis.label, rotation, avoidCollisions: false } })),
    };
}

function disableLabelsDepth0<T extends AgCartesianChartOptions | AgPolarChartOptions>(opts: T): T {
    return {
        ...opts,
        axes: opts.axes?.map((axis) =>
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
        axes: opts.axes?.map((axis) => ({ ...axis, position: positionFlip(axis.position) })) ?? undefined,
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
                axisTypes: ['grouped-category', 'number'],
                seriesTypes: ['bar'],
            }),
            compare: ['grouped-category'],
        },
        INTEGRATED_CHARTS_GROUPED_CATEGORY_AXIS_EXAMPLE: {
            options: examples.INTEGRATED_CHARTS_GROUPED_CATEGORY_AXIS_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: ['grouped-category', 'number'],
                seriesTypes: repeat('bar', 3),
            }),
            compare: ['grouped-category'],
        },
        GROUPED_CATEGORY_AXIS_DEPTH_OPTIONS_EXAMPLE: {
            options: examples.GROUPED_CATEGORY_CHART_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: ['grouped-category', 'number'],
                seriesTypes: repeat('bar', 3),
            }),
            compare: ['grouped-category'],
        },
        GROUPED_CATEGORY_AXIS_DEPTH_OPTIONS_EXAMPLE_LABELS_DISABLED: {
            options: disableLabelsDepth0(examples.GROUPED_CATEGORY_CHART_EXAMPLE),
            assertions: cartesianChartAssertions({
                axisTypes: ['grouped-category', 'number'],
                seriesTypes: repeat('bar', 3),
            }),
            compare: ['grouped-category'],
        },
        GROUPED_CATEGORY_AXIS_WITH_CROSSLINES: {
            options: axesExamples.GROUPED_CATEGORY_AXIS_EXAMPLE_WITH_CROSSLINES,
            assertions: cartesianChartAssertions({
                axisTypes: ['grouped-category', 'number'],
                seriesTypes: ['bar'],
            }),
            compare: ['grouped-category'],
        },
    }),
    INTEGRATED_CHARTS_OVERLAPPING_GROUPED_CATEGORY_AXIS_EXAMPLE: {
        options: examples.INTEGRATED_CHARTS_OVERLAPPING_GROUPED_CATEGORY_AXIS_EXAMPLE,
        assertions: cartesianChartAssertions({
            axisTypes: ['grouped-category', 'number'],
            seriesTypes: repeat('bar', 21),
        }),
        compare: ['grouped-category'],
    },
};

const EXAMPLES_CLIPPING: Record<string, TestCase> = {
    ...mixinDerivedCases({
        GROUPED_CATEGORY_AXIS_GRIDLINE_TICKLINE_CLIPPING: {
            options: axesExamples.GROUPED_CATEGORY_AXIS_GRIDLINE_TICKLINE_CLIPPING,
            assertions: cartesianChartAssertions({
                axisTypes: ['grouped-category', 'number'],
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

    Object.entries(baseCases).forEach(([name, baseCase]) => {
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
    });

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
                axes: [
                    {
                        type: 'time',
                        position: 'bottom',
                    },
                    {
                        type: 'grouped-category',
                        position: 'left',
                    },
                ],
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
                { dataGroup: ['PGM1', 'IR'], actualStartDateMs: 1658289600000.0 },
                { dataGroup: ['PGM1', 'IR'], actualStartDateMs: 1681358400000.0 },
                { dataGroup: ['PGM1', 'IR'], actualStartDateMs: 1607576400000.0 },
                { dataGroup: ['PGM1', 'IR'], actualStartDateMs: 1656561600000.0 },
                { dataGroup: ['PGM1', 'IR'], actualStartDateMs: 1718856000000.0 },
                { dataGroup: ['PGM1', 'IR'], actualStartDateMs: 1747195200000.0 },
                { dataGroup: ['PGM1', 'IR'], actualStartDateMs: 1742443200000.0 },
                { dataGroup: ['PGM1', 'IR'], actualStartDateMs: 1798434000000.0 },
            ];

            await chart.updateDelta({ data });
            await waitForChartStability(chart);

            await compare();
        });
    });
});
