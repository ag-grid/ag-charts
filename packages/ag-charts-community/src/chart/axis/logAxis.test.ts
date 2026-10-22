import { afterEach, describe, it } from 'vitest';

import type { AgBaseChartOptions, AgCartesianAxisType, AgCartesianChartOptions } from 'ag-charts-types';

import type { Chart } from '../chart';
import { compareAxisSnapshots, mixinDerivedCases } from '../test/axisTestCases';
import * as axesExamples from '../test/examples-axes';
import { cartesianChartAssertions, createChart, deproxy, setupMockCanvas, setupMockConsole } from '../test/utils';

type TestCase<T extends AgBaseChartOptions = AgCartesianChartOptions> = {
    options: T;
    assertions: (chart: Chart) => Promise<void> | void;
    extraScreenshotActions?: (chart: Chart) => Promise<void>;
    compare?: AgCartesianAxisType[];
};
const EXAMPLES: Record<string, TestCase> = {
    ...mixinDerivedCases<TestCase>({
        NUMBER_AXIS_LOG2_EXAMPLE: {
            options: axesExamples.NUMBER_AXIS_LOG2_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'log' }, seriesTypes: ['line'] }),
            compare: ['log'],
        },
        NUMBER_AXIS_LOG10_EXAMPLE: {
            options: axesExamples.NUMBER_AXIS_LOG10_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'log' }, seriesTypes: ['line'] }),
            compare: ['log'],
        },
        LOG10_SMALL_DOMAIN_NICE_FALSE_EXAMPLE: {
            options: axesExamples.LOG10_SMALL_DOMAIN_NICE_FALSE_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'log' }, seriesTypes: ['line'] }),
            compare: ['log'],
        },
        LOG_AXIS_TICK_VALUES: {
            options: axesExamples.LOG_AXIS_TICK_VALUES,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'log' }, seriesTypes: ['line'] }),
        },
    }),
};

describe('Log Axis Examples', () => {
    setupMockConsole();

    let chart: Chart;

    afterEach(() => {
        if (chart != null) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    for (const [exampleName, example] of Object.entries(EXAMPLES)) {
        it(`for ${exampleName} it should create chart instance as expected`, async () => {
            chart = deproxy(await createChart(example.options));
            await example.assertions(chart);
        });

        it(`for ${exampleName} it should render to canvas as expected`, async () => {
            const axisCompare = () => compareAxisSnapshots(chart, ctx, { types: example.compare });

            chart = deproxy(await createChart(example.options));
            await axisCompare();

            if (example.extraScreenshotActions) {
                await example.extraScreenshotActions(chart);
                await axisCompare();
            }
        });
    }
});

describe('Log Axis interval property handling', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;

    afterEach(() => {
        if (chart != null) {
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

        const apiChart = await createChart(options);
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
    });
});
