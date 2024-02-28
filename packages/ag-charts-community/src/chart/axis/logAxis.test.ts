import { afterEach, describe, expect, it } from '@jest/globals';

import type {
    AgBaseChartOptions,
    AgCartesianAxisPosition,
    AgCartesianAxisType,
    AgCartesianChartOptions,
    AgPolarChartOptions,
} from '../../options/agChartOptions';
import type { Chart } from '../chart';
import type { ChartAxis } from '../chartAxis';
import * as axesExamples from '../test/examples-axes';
import { setupMockConsole } from '../test/mockConsole';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    createChart,
    extractImageData,
    reverseAxes,
    setupMockCanvas,
} from '../test/utils';

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
    assertions: (chart: Chart) => Promise<void>;
    extraScreenshotActions?: (chart: Chart) => Promise<void>;
    compare?: AgCartesianAxisType[];
};
const EXAMPLES: Record<string, TestCase> = {
    ...mixinDerivedCases({
        NUMBER_AXIS_LOG2_EXAMPLE: {
            options: axesExamples.NUMBER_AXIS_LOG2_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: ['number', 'log'], seriesTypes: ['line'] }),
            compare: ['log'],
        },
        NUMBER_AXIS_LOG10_EXAMPLE: {
            options: axesExamples.NUMBER_AXIS_LOG10_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: ['number', 'log'], seriesTypes: ['line'] }),
            compare: ['log'],
        },
        LOG10_SMALL_DOMAIN_NICE_FALSE_EXAMPLE: {
            options: axesExamples.LOG10_SMALL_DOMAIN_NICE_FALSE_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: ['number', 'log'], seriesTypes: ['line'] }),
            compare: ['log'],
        },
        LOG_AXIS_TICK_VALUES: {
            options: axesExamples.LOG_AXIS_TICK_VALUES,
            assertions: cartesianChartAssertions({ axisTypes: ['number', 'log'], seriesTypes: ['line'] }),
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

describe('Log Axis Examples', () => {
    setupMockConsole();

    let chart: Chart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    for (const [exampleName, example] of Object.entries(EXAMPLES)) {
        it(`for ${exampleName} it should create chart instance as expected`, async () => {
            chart = await createChart(example.options);
            await example.assertions(chart);
        });

        it(`for ${exampleName} it should render to canvas as expected`, async () => {
            const axisCompare = async () => {
                for (const axis of chart.axes) {
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
});
