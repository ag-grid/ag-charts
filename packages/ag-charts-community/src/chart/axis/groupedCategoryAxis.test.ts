import { afterEach, describe, expect, it } from '@jest/globals';

import type {
    AgBaseChartOptions,
    AgCartesianAxisPosition,
    AgCartesianAxisType,
    AgCartesianChartOptions,
    AgPolarChartOptions,
} from 'ag-charts-types';

import type { ChartAxis } from '../chartAxis';
import * as examples from '../test/examples';
import * as axesExamples from '../test/examples-axes';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    createChart,
    deproxy,
    extractImageData,
    repeat,
    reverseAxes,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';
import type { ChartOrProxy } from '../test/utils';

function applyRotation<T extends AgCartesianChartOptions | AgPolarChartOptions>(opts: T, rotation: number): T {
    return {
        ...opts,
        axes: opts.axes?.map((axis) => ({ ...axis, label: { ...axis.label, rotation } })),
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
    assertions: (chart: ChartOrProxy) => Promise<void>;
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

function calculateAxisBBox(axis: ChartAxis): { x: number; y: number; width: number; height: number } {
    const bbox = axis.computeBBox();

    const { x, y, width, height } = bbox;
    return { x, y, width, height };
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
            const axisCompare = async () => {
                for (const axis of deproxy(chart).axes) {
                    if (example.compare != null && !example.compare.includes(axis.type as AgCartesianAxisType)) {
                        continue;
                    }

                    const axesBBox = calculateAxisBBox(axis);
                    const imageData = extractImageData({ ...ctx, bbox: axesBBox });

                    expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                }
            };

            chart = await createChart(example.options);
            await axisCompare();

            if (example.extraScreenshotActions) {
                await example.extraScreenshotActions(chart);
                await axisCompare();
            }
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
});
