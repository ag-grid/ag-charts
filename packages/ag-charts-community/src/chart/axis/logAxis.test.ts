import { afterEach, describe, expect, it } from '@jest/globals';

import type {
    AgBaseChartOptions,
    AgCartesianAxisPosition,
    AgCartesianAxisType,
    AgCartesianChartOptions,
    AgPolarChartOptions,
} from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import type { Chart } from '../chart';
import * as axesExamples from '../test/examples-axes';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    createChart,
    deproxy,
    extractImageData,
    mapValues,
    prepareTestOptions,
    reverseAxes,
    setupMockCanvas,
    setupMockConsole,
} from '../test/utils';

function applyRotation<T extends AgCartesianChartOptions | AgPolarChartOptions>(opts: T, rotation: number): T {
    return {
        ...opts,
        axes: mapValues(opts.axes ?? {}, (axis) => ({ ...axis, label: { ...axis.label, rotation } })),
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

type TestCase<T extends AgBaseChartOptions = AgCartesianChartOptions> = {
    options: T;
    assertions: (chart: Chart) => Promise<void> | void;
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
            const axisCompare = () => {
                for (const axis of chart.axes) {
                    if (example.compare != null && !example.compare.includes(axis.type as AgCartesianAxisType)) {
                        continue;
                    }

                    const imageData = extractImageData({ ...ctx, bbox: axis.getBBox() });
                    expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                }
            };

            chart = await createChart(example.options);
            axisCompare();

            if (example.extraScreenshotActions) {
                await example.extraScreenshotActions(chart);
                axisCompare();
            }
        });
    }
});

describe('Log Axis interval property handling', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    it('should not warn when switching from axis with interval to axis without interval', async () => {
        const options: AgCartesianChartOptions = {
            data: [
                { os: 'A', share: 10 },
                { os: 'B', share: 100 },
                { os: 'C', share: 1000 },
            ],
            series: [
                {
                    type: 'line',
                    xKey: 'os',
                    yKey: 'share',
                },
            ],
            axes: {
                x: {
                    type: 'category',
                    position: 'bottom',
                },
                y: {
                    type: 'log',
                    position: 'left',
                    min: 10,
                    interval: {
                        minSpacing: 200,
                    },
                    label: {
                        format: '.0f',
                    },
                },
            },
        };

        prepareTestOptions(options);
        const apiChart = AgCharts.create(options);
        chart = deproxy(apiChart);

        // Update to log axis without interval property
        const updatedOptions: AgCartesianChartOptions = {
            ...options,
            axes: {
                x: {
                    type: 'category',
                    position: 'bottom',
                },
                y: {
                    type: 'log',
                    position: 'left',
                    min: 10,
                    label: {
                        format: '.0f',
                    },
                    base: 2,
                },
            },
        };

        // This should not produce any warnings
        await apiChart.update(updatedOptions);

        // Verify no warning was logged
        expect(console.warn).not.toHaveBeenCalled();
    });
});
