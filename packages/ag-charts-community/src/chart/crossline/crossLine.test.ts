import { afterEach, describe, it } from 'vitest';

import { mapValues } from 'ag-charts-core';
import type {
    AgCartesianChartOptions,
    AgCartesianCrossLineOptions,
    AgChartInstance,
    AgCrossLineLabelPosition,
} from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import { expectPixelIdenticalAcrossUpdate } from '../test/bigintExamples';
import type { CartesianTestCase } from '../test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    compareImageSnapshot,
    createChart,
    expectWarningMessages,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';
import * as examples from './test/examples';

const labelPositions: AgCrossLineLabelPosition[] = [
    'top',
    'left',
    'right',
    'bottom',
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
    'inside',
    'inside-left',
    'inside-right',
    'inside-top',
    'inside-bottom',
    'inside-top-left',
    'inside-bottom-left',
    'inside-top-right',
    'inside-bottom-right',
];

const flipCrossLinesRange = (crossLineOptions: AgCartesianCrossLineOptions): AgCartesianCrossLineOptions => {
    const range = (crossLineOptions as { range?: [any, any] }).range;
    return {
        ...crossLineOptions,
        range: [range?.[1], range?.[0]],
    } as AgCartesianCrossLineOptions;
};

const applyCrossLinesLabelPosition = (
    crossLineOptions: AgCartesianCrossLineOptions,
    position: AgCrossLineLabelPosition
): AgCartesianCrossLineOptions => {
    return {
        ...crossLineOptions,
        label: {
            ...crossLineOptions.label,
            position,
        },
    };
};

const applyCrossLinesLabelPositionFilled = (
    crossLineOptions: AgCartesianCrossLineOptions,
    position: AgCrossLineLabelPosition
): AgCartesianCrossLineOptions => {
    return {
        ...crossLineOptions,
        label: {
            ...crossLineOptions.label,
            position,
            fill: 'red',
            padding: { top: 10, right: 10, bottom: 30, left: 30 },
        },
    };
};

const mixinFlippedRangeCases = (
    baseRangeCases: Record<string, CartesianTestCase>
): Record<string, CartesianTestCase> => {
    const result: Record<string, CartesianTestCase> = { ...baseRangeCases };

    const examplesToFlip = Object.entries(baseRangeCases).slice(0, -2);

    for (const [name, example] of examplesToFlip) {
        const prefix = name.substring(0, name.indexOf('_'));
        const suffix = name.substring(name.indexOf('_'));
        result[`${prefix}_FLIPPED${suffix}`] = {
            ...example,
            options: {
                ...example.options,
                axes: mapValues(example.options.axes ?? {}, (axis: any) =>
                    axis.crossLines ? { ...axis, crossLines: axis.crossLines.map(flipCrossLinesRange) } : axis
                ),
            },
        };
    }

    return result;
};

const mixinLabelPositionCases = (example: CartesianTestCase): Record<string, CartesianTestCase> => {
    const result: Record<string, CartesianTestCase> = { DEFAULT_LABEL_POSITION_CROSSLINES: { ...example } };

    for (const position of labelPositions) {
        result[`${position}_LABEL_POSITION_CROSSLINES`] = {
            ...example,
            options: {
                ...example.options,
                axes: mapValues(example.options.axes ?? {}, (axis: any) =>
                    axis.crossLines
                        ? {
                              ...axis,
                              crossLines: axis.crossLines.map((c: AgCartesianCrossLineOptions) =>
                                  applyCrossLinesLabelPosition(c, position)
                              ),
                          }
                        : axis
                ),
            },
        };
    }

    for (const position of ['top', 'right', 'bottom', 'left'] as const) {
        result[`${position}_filled_LABEL_POSITION_CROSSLINES`] = {
            ...example,
            options: {
                ...example.options,
                axes: mapValues(example.options.axes ?? {}, (axis: any) =>
                    axis.crossLines
                        ? {
                              ...axis,
                              crossLines: axis.crossLines.map((c: AgCartesianCrossLineOptions) =>
                                  applyCrossLinesLabelPositionFilled(c, position)
                              ),
                          }
                        : axis
                ),
            },
        };
    }

    return result;
};

const CROSSLINES_LABEL_POSITION_EXAMPLES: Record<string, CartesianTestCase> = mixinLabelPositionCases({
    options: examples.DEFAULT_LABEL_POSITION_CROSSLINES,
    assertions: cartesianChartAssertions({
        axisTypes: { x: 'unit-time', y: 'number' },
        seriesTypes: repeat('line', 2),
    }),
});

const CROSSLINES_RANGE_EXAMPLES: Record<string, CartesianTestCase> = mixinFlippedRangeCases({
    VALID_RANGE_CROSSLINES: {
        options: examples.VALID_RANGE_CROSSLINES,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
    },
    RANGE_OUTSIDE_DOMAIN_MAX_CROSSLINES: {
        options: examples.RANGE_OUTSIDE_DOMAIN_MAX_CROSSLINES,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
    },
    RANGE_OUTSIDE_DOMAIN_MIN_CROSSLINES: {
        options: examples.RANGE_OUTSIDE_DOMAIN_MIN_CROSSLINES,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
    },
    RANGE_OUTSIDE_DOMAIN_MIN_MAX_CROSSLINES: {
        options: examples.RANGE_OUTSIDE_DOMAIN_MIN_MAX_CROSSLINES,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
    },
    RANGE_OUTSIDE_DOMAIN_CROSSLINES: {
        options: examples.RANGE_OUTSIDE_DOMAIN_CROSSLINES,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
    },
});

const EXAMPLES: Record<string, CartesianTestCase> = {
    ...CROSSLINES_RANGE_EXAMPLES,
    ...CROSSLINES_LABEL_POSITION_EXAMPLES,
    SCATTER_CROSSLINES: {
        options: examples.SCATTER_CROSSLINES,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'number' }, seriesTypes: ['scatter'] }),
    },
    LINE_CROSSLINES: {
        options: examples.LINE_CROSSLINES,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number' },
            seriesTypes: repeat('line', 16),
        }),
    },
    AREA_CROSSLINES: {
        options: examples.AREA_CROSSLINES,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number' },
            seriesTypes: repeat('area', 5),
        }),
    },
    COLUMN_CROSSLINES: {
        options: examples.COLUMN_CROSSLINES,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number' },
            seriesTypes: repeat('bar', 7),
        }),
    },
    BAR_CROSSLINES: {
        options: examples.BAR_CROSSLINES,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'number', y: 'category' },
            seriesTypes: repeat('bar', 2),
        }),
    },
    DUAL_LEFT_AXES_CROSSLINE_LINE: {
        options: examples.DUAL_LEFT_AXES_CROSSLINE_LINE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number', __AXIS_ID_2: 'number' },
            seriesTypes: repeat('line', 2),
        }),
    },
    DUAL_LEFT_AXES_CROSSLINE_RANGE: {
        options: examples.DUAL_LEFT_AXES_CROSSLINE_RANGE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number', __AXIS_ID_2: 'number' },
            seriesTypes: repeat('line', 2),
        }),
    },
    LEFT_RIGHT_AXES_CROSSLINE: {
        options: examples.LEFT_RIGHT_AXES_CROSSLINE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number', __AXIS_ID_2: 'number' },
            seriesTypes: repeat('line', 2),
        }),
    },
    DUAL_RIGHT_AXES_CROSSLINE: {
        options: examples.DUAL_RIGHT_AXES_CROSSLINE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number', __AXIS_ID_2: 'number' },
            seriesTypes: repeat('line', 2),
        }),
    },
    DUAL_BOTTOM_AXES_CROSSLINE: {
        options: examples.DUAL_BOTTOM_AXES_CROSSLINE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number', __AXIS_ID_2: 'unit-time' },
            seriesTypes: repeat('line', 2),
        }),
    },
};

const INVALID_EXAMPLES: Record<string, CartesianTestCase & { warningMessages: string[] }> = {
    INVALID_RANGE_CROSSLINES: {
        options: examples.INVALID_RANGE_VALUE_CROSSLINE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
        warningMessages: [
            'AG Charts - Option `axes.y.crossLines[0][type=range].range` cannot be set to `[null,134]`; expecting a number or bigint array and an array of exactly 2 items, ignoring.',
        ],
    },
    INVALID_RANGE_LENGTH_CROSSLINE: {
        options: examples.INVALID_RANGE_LENGTH_CROSSLINE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
        warningMessages: [
            'AG Charts - Option `axes.y.crossLines[0][type=range].range` cannot be set to `[128,134,135]`; expecting a number or bigint array and an array of exactly 2 items, ignoring.',
        ],
    },
    INVALID_RANGE_WITHOUT_TYPE_CROSSLINE: {
        options: examples.INVALID_RANGE_WITHOUT_TYPE_CROSSLINE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
        warningMessages: [
            "AG Charts - Option `axes.y.crossLines[0].type` is required and has not been provided; expecting a keyword such as 'line' or 'range', ignoring.",
        ],
    },
    INVALID_LINE_VALUE_CROSSLINES: {
        options: examples.INVALID_LINE_VALUE_CROSSLINES,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
        warningMessages: [
            'AG Charts - Option `axes.y.crossLines[0][type=line].value` cannot be set to `"a string instead of number"`; expecting a number or bigint, ignoring.',
        ],
    },
    INVALID_RANGE_WITH_LINE_TYPE_CROSSLINE: {
        options: examples.INVALID_RANGE_WITH_LINE_TYPE_CROSSLINE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
        warningMessages: [
            'AG Charts - Option `axes.y.crossLines[0][type=line].value` is required and has not been provided; expecting a number or bigint, ignoring.',
            'AG Charts - Unknown option `axes.y.crossLines[0][type=line].range`; Did you mean `value`? Ignoring.',
        ],
    },
    INVALID_LINE_WITHOUT_TYPE_CROSSLINE: {
        options: examples.INVALID_LINE_WITHOUT_TYPE_CROSSLINE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
        warningMessages: [
            "AG Charts - Option `axes.y.crossLines[0].type` is required and has not been provided; expecting a keyword such as 'line' or 'range', ignoring.",
        ],
    },
    INVALID_LINE_WITH_RANGE_TYPE_CROSSLINE: {
        options: examples.INVALID_LINE_WITH_RANGE_TYPE_CROSSLINE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
        warningMessages: [
            'AG Charts - Option `axes.y.crossLines[0][type=range].range` is required and has not been provided; expecting a number or bigint array and an array of exactly 2 items, ignoring.',
            'AG Charts - Unknown option `axes.y.crossLines[0][type=range].value`; Did you mean `range`? Ignoring.',
        ],
    },
};

// The cross-line itself is valid and renders; only the extra unknown options are stripped with a warning.
const UNKNOWN_OPTION_EXAMPLES: Record<string, CartesianTestCase & { warningMessages: string[] }> = {
    INVALID_FILL_ON_LINE_TYPE_CROSSLINE: {
        options: examples.INVALID_FILL_ON_LINE_TYPE_CROSSLINE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
        warningMessages: [
            'AG Charts - Unknown option `axes.y.crossLines[0][type=line].fill`, ignoring.',
            'AG Charts - Unknown option `axes.y.crossLines[0][type=line].fillOpacity`, ignoring.',
        ],
    },
};

describe('CrossLine', () => {
    setupMockConsole();

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('#create', () => {
        it.each(Object.entries(EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgCartesianChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await example.assertions(chart);
            }
        );

        it.each(Object.entries(EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                const options: AgCartesianChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare();
            }
        );
    });

    describe('#invalid options', () => {
        it.each(Object.entries(INVALID_EXAMPLES))(
            'for %s it should render to canvas without crossLines and show warning',
            async (_exampleName, example) => {
                const options: AgCartesianChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare();

                expectWarningMessages(example.warningMessages);
            }
        );
    });

    describe('#unknown options', () => {
        it.each(Object.entries(UNKNOWN_OPTION_EXAMPLES))(
            'for %s it should render to canvas with crossLines and show warning',
            async (_exampleName, example) => {
                const options: AgCartesianChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare();

                expectWarningMessages(example.warningMessages);
            }
        );
    });

    describe('#disabled options', () => {
        // Regression (AG-14484): a valid crossline disabled via `enabled: false` is stripped to
        // `{ enabled: false }` before the second validation pass, which must not warn about the
        // removed `type`/`value`. `setupMockConsole`'s afterEach fails on any unexpected warning.
        it('does not warn for crosslines disabled via enabled: false', async () => {
            const options: AgCartesianChartOptions = {
                ...examples.LINE_CROSSLINES,
                axes: mapValues(examples.LINE_CROSSLINES.axes ?? {}, (axis: any) =>
                    axis.crossLines
                        ? { ...axis, crossLines: axis.crossLines.map((c: any) => ({ ...c, enabled: false })) }
                        : axis
                ),
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);
        });
    });

    // Value-preserving widening checks: the same cross-line value supplied as `number`
    // and as `bigint` must render pixel-identically and without validation warnings.
    describe('#bigint values (AG-16608)', () => {
        const buildOptions = (crossLines: AgCartesianCrossLineOptions[]): AgCartesianChartOptions => ({
            data: [
                { x: 0, y: 10 },
                { x: 1, y: 60 },
                { x: 2, y: 35 },
                { x: 3, y: 90 },
            ],
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            axes: {
                x: { type: 'number', position: 'bottom' },
                y: { type: 'number', position: 'left', crossLines },
            },
        });

        const compareVariants = (
            numberCrossLines: AgCartesianCrossLineOptions[],
            bigintCrossLines: AgCartesianCrossLineOptions[]
        ) =>
            expectPixelIdenticalAcrossUpdate(
                ctx,
                createChart,
                buildOptions(numberCrossLines),
                buildOptions(bigintCrossLines)
            );

        it('renders a bigint line value identically to a number value', async () => {
            await compareVariants(
                [{ type: 'line', value: 50, label: { text: 'th' } }],
                [{ type: 'line', value: 50n, label: { text: 'th' } }]
            );
        });

        it('renders a bigint range identically to a number range', async () => {
            await compareVariants([{ type: 'range', range: [30, 70] }], [{ type: 'range', range: [30n, 70n] }]);
        });
    });
});
