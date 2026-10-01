import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    ChartUpdateType,
    type CrossLineLabelOverflow,
    type DynamicContext,
    type NormalisedAxisCrossLineLabelOptions,
    type NormalisedAxisCrossLineOptions,
    cachedTextMeasurer,
    getDocument,
    mapValues,
} from 'ag-charts-core';
import { expectWarningsCalls } from 'ag-charts-test';
import type {
    AgCartesianChartOptions,
    AgCartesianCrossLineLabelOptions,
    AgCartesianCrossLineOptions,
    AgCrossLineClickEvent,
    AgCrossLineClickParams,
    AgCrossLineLabelPosition,
    AgCrossLineListeners,
    AgNumberAxisOptions,
} from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import type { ChartRegistry } from '../../module/moduleContext';
import { BBox } from '../../scene/bbox';
import { Transformable } from '../../scene/transformable';
import type { Chart } from '../chart';
import { expectPixelIdenticalAcrossUpdate } from '../test/bigintExamples';
import type { CartesianTestCase } from '../test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    clickAction,
    compareImageSnapshot,
    createChart,
    deproxy,
    doubleClickAction,
    expectWarningMessages,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';
import { CartesianCrossLine } from './cartesianCrossLine';
import type { CrossLineType } from './crossLine';
import { CROSS_LINE_TYPES } from './crossLinesModule';
import { getCrossLinesPlugin } from './getCrossLinesPlugin';
import * as examples from './test/examples';

type ViFn = ReturnType<typeof vi.fn>;

// `overflow` and `reserveSpace` are undocumented, so they are cast in rather than typed on the options.
const undocumentedLabel = (
    label: AgCartesianCrossLineLabelOptions & { overflow?: CrossLineLabelOverflow; reserveSpace?: boolean }
) => label as AgCartesianCrossLineLabelOptions;

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

// Every case but the default sets the deprecated `position`, pinning the rendering it keeps.
const LABEL_POSITION_EXAMPLES = mixinLabelPositionCases({
    options: examples.DEFAULT_LABEL_POSITION_CROSSLINES,
    assertions: cartesianChartAssertions({
        axisTypes: { x: 'unit-time', y: 'number' },
        seriesTypes: repeat('line', 2),
    }),
});

function positionDeprecations(options: AgCartesianChartOptions): string[] {
    return Object.entries(options.axes ?? {}).flatMap(([key, axis]) =>
        (axis?.crossLines ?? []).flatMap((crossLine, index) =>
            crossLine.label?.position == null
                ? []
                : [
                      `AG Charts - Option \`axes.${key}.crossLines[${index}].label.position\` is deprecated. Use \`placement\` instead.`,
                  ]
        )
    );
}

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
    ...LABEL_POSITION_EXAMPLES,
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
    DOMAIN_EXTREME_LINE_CROSSLINES: {
        options: examples.DOMAIN_EXTREME_LINE_CROSSLINES,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'time', y: 'number' }, seriesTypes: ['line'] }),
    },
    OUTSIDE_DOMAIN_LINE_CROSSLINES: {
        options: examples.OUTSIDE_DOMAIN_LINE_CROSSLINES,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'time', y: 'number' }, seriesTypes: ['line'] }),
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

// A cross line spanning the whole y domain covers the entire series area, so a click at the centre of
// the canvas is guaranteed to land on it without depending on the resolved axis layout.
const FULL_RANGE: [number, number] = [0, 10];

const CENTRE_X = 400;
const CENTRE_Y = 300;

function fullRangeOptions(overrides: Partial<AgCartesianChartOptions> = {}): AgCartesianChartOptions {
    return {
        data: [
            { x: 'Jan', y: 2 },
            { x: 'Feb', y: 8 },
        ],
        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
        axes: {
            x: { type: 'category' },
            y: { type: 'number', min: FULL_RANGE[0], max: FULL_RANGE[1] },
        },
        ...overrides,
    };
}

function rangeCrossLine(listeners?: AgCrossLineListeners, id?: string) {
    return { id, type: 'range' as const, range: FULL_RANGE, listeners };
}

/**
 * The label is positioned relative to the resolved axis layout, so its canvas position is read back
 * from the rendered node rather than hard-coded.
 */
function crossLineLabelCentre(chart: Chart, axisId: string): { x: number; y: number } {
    const axis = chart.axes.findById(axisId);
    const plugin = axis ? getCrossLinesPlugin(axis) : undefined;
    const [crossLine] = plugin?.getInstances() ?? [];
    const bbox = Transformable.toCanvas(crossLine.labelGroup);
    return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
}

/** The text the cross line actually rendered, which `'clip-text'` may have truncated. */
function crossLineLabelText(chart: Chart, axisId: string): string {
    const axis = chart.axes.findById(axisId);
    const plugin = axis ? getCrossLinesPlugin(axis) : undefined;
    const [crossLine] = plugin?.getInstances() ?? [];
    const [label] = crossLine.labelGroup.children() as any;
    return label?.text ?? '';
}

describe('CrossLine', () => {
    setupMockConsole();

    let chart: Chart;

    afterEach(() => {
        if (chart != null) {
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
                chart = await createChart({ ...example.options });
                await example.assertions(chart);
                expectWarningMessages(positionDeprecations(example.options));
            }
        );

        it.each(Object.entries(EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                chart = await createChart({ ...example.options });
                await compare();
                expectWarningMessages(positionDeprecations(example.options));
            }
        );
    });

    describe('#invalid options', () => {
        it.each(Object.entries(INVALID_EXAMPLES))(
            'for %s it should render to canvas without crossLines and show warning',
            async (_exampleName, example) => {
                chart = await createChart({ ...example.options });
                await compare();

                expectWarningMessages(example.warningMessages);
            }
        );
    });

    describe('#unknown options', () => {
        it.each(Object.entries(UNKNOWN_OPTION_EXAMPLES))(
            'for %s it should render to canvas with crossLines and show warning',
            async (_exampleName, example) => {
                chart = await createChart({ ...example.options });
                await compare();

                expectWarningMessages(example.warningMessages);
            }
        );
    });

    describe('#disabled options', () => {
        // A crossline disabled via `enabled: false` is stripped to `{ enabled: false }` before the second
        // validation pass; `setupMockConsole`'s afterEach fails on any warning about the removed keys.
        it('does not warn for crosslines disabled via enabled: false', async () => {
            const options: AgCartesianChartOptions = {
                ...examples.LINE_CROSSLINES,
                axes: mapValues(examples.LINE_CROSSLINES.axes ?? {}, (axis: any) =>
                    axis.crossLines
                        ? { ...axis, crossLines: axis.crossLines.map((c: any) => ({ ...c, enabled: false })) }
                        : axis
                ),
            };
            chart = await createChart(options);
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

    describe('cross-line level listeners', () => {
        test('AC1: clicking a cross line fires `click` with the cross-line params', async () => {
            const click = vi.fn();
            chart = await createChart(
                fullRangeOptions({
                    axes: {
                        x: { type: 'category' },
                        y: {
                            type: 'number',
                            min: FULL_RANGE[0],
                            max: FULL_RANGE[1],
                            crossLines: [rangeCrossLine({ click }, 'band')],
                        },
                    },
                })
            );

            await clickAction(CENTRE_X, CENTRE_Y)(chart);

            expect(click).toHaveBeenCalledTimes(1);
            expect(click).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'crossLineClick',
                    crossLineId: 'band',
                    axisId: 'y',
                    direction: 'y',
                    crossLineType: 'range',
                    value: undefined,
                    range: FULL_RANGE,
                }) satisfies AgCrossLineClickEvent
            );
        });

        test('AC2: double-clicking a cross line fires `doubleClick`', async () => {
            const click = vi.fn();
            const doubleClick = vi.fn();
            chart = await createChart(
                fullRangeOptions({
                    axes: {
                        x: { type: 'category' },
                        y: {
                            type: 'number',
                            min: FULL_RANGE[0],
                            max: FULL_RANGE[1],
                            crossLines: [rangeCrossLine({ click, doubleClick })],
                        },
                    },
                })
            );

            await doubleClickAction(CENTRE_X, CENTRE_Y)(chart);

            expect(doubleClick).toHaveBeenCalledTimes(1);
            expect(doubleClick).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'crossLineDoubleClick', crossLineType: 'range' })
            );
            // A double click is preceded by two single clicks, matching the chart-level click semantics.
            expect(click).toHaveBeenCalledTimes(2);
        });

        test('AC3: an unset `id` falls back to an internally generated identifier', async () => {
            const click = vi.fn();
            chart = await createChart(
                fullRangeOptions({
                    axes: {
                        x: { type: 'category' },
                        y: {
                            type: 'number',
                            min: FULL_RANGE[0],
                            max: FULL_RANGE[1],
                            crossLines: [rangeCrossLine({ click })],
                        },
                    },
                })
            );

            await clickAction(CENTRE_X, CENTRE_Y)(chart);

            expect(click).toHaveBeenCalledWith(
                expect.objectContaining({ crossLineId: expect.stringMatching(/^CrossLine-/) as string })
            );
        });

        test('AC5: overlapping cross lines each fire their own listener', async () => {
            const clickY = vi.fn();
            const clickX = vi.fn();
            chart = await createChart(
                fullRangeOptions({
                    axes: {
                        x: {
                            type: 'category',
                            crossLines: [
                                { id: 'x-band', type: 'range', range: ['Jan', 'Feb'], listeners: { click: clickX } },
                            ],
                        },
                        y: {
                            type: 'number',
                            min: FULL_RANGE[0],
                            max: FULL_RANGE[1],
                            crossLines: [rangeCrossLine({ click: clickY }, 'y-band')],
                        },
                    },
                })
            );

            await clickAction(CENTRE_X, CENTRE_Y)(chart);

            expect(clickX).toHaveBeenCalledWith(
                expect.objectContaining({ crossLineId: 'x-band', axisId: 'x', direction: 'x' })
            );
            expect(clickY).toHaveBeenCalledWith(
                expect.objectContaining({ crossLineId: 'y-band', axisId: 'y', direction: 'y' })
            );
        });

        test('AC6: with no listener registered the click falls through to the chart', async () => {
            const chartClick = vi.fn();
            chart = await createChart(
                fullRangeOptions({
                    listeners: { click: chartClick },
                    axes: {
                        x: { type: 'category' },
                        y: {
                            type: 'number',
                            min: FULL_RANGE[0],
                            max: FULL_RANGE[1],
                            crossLines: [rangeCrossLine()],
                        },
                    },
                })
            );

            await clickAction(CENTRE_X, CENTRE_Y)(chart);

            expect(chartClick).toHaveBeenCalledTimes(1);
        });

        test('AC4: clicking a cross line label fires `click`', async () => {
            const click = vi.fn();
            const build = (labelText?: string) =>
                fullRangeOptions({
                    axes: {
                        x: { type: 'category' },
                        y: {
                            type: 'number',
                            min: FULL_RANGE[0],
                            max: FULL_RANGE[1],
                            crossLines: [
                                {
                                    id: 'threshold',
                                    type: 'line',
                                    value: 5,
                                    label: { text: labelText, placement: 'top' },
                                    listeners: { click },
                                },
                            ],
                        },
                    },
                });

            chart = await createChart(build('Threshold'));

            const { x, y } = crossLineLabelCentre(chart, 'y');
            await clickAction(x, y)(chart);

            expect(click).toHaveBeenCalledTimes(1);
            expect(click).toHaveBeenCalledWith(
                expect.objectContaining({ crossLineId: 'threshold', crossLineType: 'line', value: 5 })
            );

            // Proves the hit came from the label rather than the line: without label text the same
            // point sits outside the cross line's hit region.
            click.mockClear();
            await chart.publicApi!.update(build());
            await waitForChartStability(chart);
            await clickAction(x, y)(chart);

            expect(click).not.toHaveBeenCalled();
        });

        test('AC4: clicking a cross line label outside the series-area fires `click`', async () => {
            const click = vi.fn();
            const build = (labelText?: string) =>
                fullRangeOptions({
                    axes: {
                        x: { type: 'category' },
                        y: {
                            type: 'number',
                            min: FULL_RANGE[0],
                            max: FULL_RANGE[1],
                            crossLines: [
                                {
                                    id: 'threshold',
                                    type: 'line',
                                    value: 5,
                                    label: { text: labelText, placement: 'right' },
                                    listeners: { click },
                                },
                            ],
                        },
                    },
                });

            chart = await createChart(build('Threshold'));

            const { x, y } = crossLineLabelCentre(chart, 'y');
            await clickAction(x, y)(chart);

            expect(click).toHaveBeenCalledTimes(1);
            expect(click).toHaveBeenCalledWith(
                expect.objectContaining({ crossLineId: 'threshold', crossLineType: 'line', value: 5 })
            );
        });

        test('a thick line widens its hit region to half the stroke width', async () => {
            const click = vi.fn();
            const build = (strokeWidth: number) =>
                fullRangeOptions({
                    axes: {
                        x: { type: 'category' },
                        y: {
                            type: 'number',
                            min: FULL_RANGE[0],
                            max: FULL_RANGE[1],
                            crossLines: [{ type: 'line', value: 5, strokeWidth, listeners: { click } }],
                        },
                    },
                });

            chart = await createChart(build(20));

            const axis = chart.axes.findById('y')!;
            const [crossLine] = getCrossLinesPlugin(axis)!.getInstances();
            const line = Transformable.toCanvas(crossLine.lineGroup);
            const y = line.y + line.height / 2 - 8;
            await clickAction(CENTRE_X, y)(chart);

            expect(click).toHaveBeenCalledTimes(1);

            click.mockClear();
            await chart.publicApi!.update(build(1));
            await waitForChartStability(chart);
            await clickAction(CENTRE_X, y)(chart);

            expect(click).not.toHaveBeenCalled();
        });

        test('clicking outside every cross line fires nothing', async () => {
            const click = vi.fn();
            chart = await createChart(
                fullRangeOptions({
                    axes: {
                        x: { type: 'category' },
                        y: {
                            type: 'number',
                            min: FULL_RANGE[0],
                            max: FULL_RANGE[1],
                            crossLines: [{ id: 'band', type: 'range', range: [0, 1], listeners: { click } }],
                        },
                    },
                })
            );

            await clickAction(CENTRE_X, 60)(chart);

            expect(click).not.toHaveBeenCalled();
        });

        describe('overlapping crosslines allMatchedParams', () => {
            let chartClick: ViFn;
            let chartCrossLineClick: ViFn;
            let chartCrossLineDoubleClick: ViFn;
            let chartSeriesNodeClick: ViFn;
            let seriesSeriesNodeClick: ViFn;
            beforeEach(async () => {
                chartClick = vi.fn();
                chartCrossLineClick = vi.fn();
                chartCrossLineDoubleClick = vi.fn();
                chartSeriesNodeClick = vi.fn();
                seriesSeriesNodeClick = vi.fn();
                chart = await createChart({
                    data: [
                        { x: 'Jan', y: 8 },
                        { x: 'Mar', y: 6 },
                        { x: 'May', y: 3 },
                        { x: 'Jul', y: 9 },
                    ],
                    series: [
                        { type: 'bar', xKey: 'x', yKey: 'y', listeners: { seriesNodeClick: seriesSeriesNodeClick } },
                    ],
                    axes: {
                        myX: {
                            type: 'category',
                            crossAt: { value: 0 },
                            crossLines: [
                                { id: 'blue-line', type: 'line', value: 'May', stroke: 'blue', strokeWidth: 2 },
                                { id: 'grey-range', type: 'range', range: ['Mar', 'Jul'], strokeWidth: 2 },
                            ],
                        },
                        myY: {
                            type: 'number',
                            // No user-option `id`; Use auto-generated id.
                            crossLines: [{ type: 'line', value: 8, stroke: 'lime', strokeWidth: 2 }],
                        },
                    },
                    listeners: {
                        click: chartClick,
                        crossLineClick: chartCrossLineClick,
                        crossLineDoubleClick: chartCrossLineDoubleClick,
                        seriesNodeClick: chartSeriesNodeClick,
                    },
                });
            });
            test('click where all 3 cross-lines overlap', async () => {
                await clickAction(505, 130)(chart);
                expect(chartCrossLineClick).toHaveBeenCalledWith(
                    expect.objectContaining({
                        crossLineId: 'blue-line',
                        axisId: 'myX',
                        direction: 'x',
                        value: 'May',
                        // TODO: add AG-17613 `coordinated`
                        allMatchedParams: [
                            expect.objectContaining({
                                type: 'crossLineClick',
                                crossLineId: 'blue-line',
                                axisId: 'myX',
                                direction: 'x',
                                value: 'May',
                            }),
                            expect.objectContaining({
                                type: 'crossLineClick',
                                crossLineId: 'grey-range',
                                axisId: 'myX',
                                direction: 'x',
                                range: ['Mar', 'Jul'],
                            }),
                            expect.objectContaining({
                                type: 'crossLineClick',
                                crossLineId: 'CrossLine-3',
                                axisId: 'myY',
                                direction: 'y',
                                value: 8,
                            }),
                        ],
                    })
                );
                expect(chartClick).toHaveBeenCalledTimes(0);
                expect(chartCrossLineClick).toHaveBeenCalledTimes(1);
                expect(chartSeriesNodeClick).toHaveBeenCalledTimes(0);
                expect(seriesSeriesNodeClick).toHaveBeenCalledTimes(0);
            });
            test('TC7: a double-click brands the root and every entry with the double-click type', async () => {
                await doubleClickAction(505, 130)(chart);
                expect(chartCrossLineDoubleClick).toHaveBeenCalledWith(
                    expect.objectContaining({
                        // Entries track `event.type`, so they read `crossLineDoubleClick` here, not `crossLineClick`.
                        type: 'crossLineDoubleClick',
                        crossLineId: 'blue-line',
                        allMatchedParams: [
                            expect.objectContaining({ type: 'crossLineDoubleClick', crossLineId: 'blue-line' }),
                            expect.objectContaining({ type: 'crossLineDoubleClick', crossLineId: 'grey-range' }),
                            expect.objectContaining({ type: 'crossLineDoubleClick', crossLineId: 'CrossLine-3' }),
                        ],
                    })
                );
            });
            test('a series node under the pointer wins over the cross lines it overlaps', async () => {
                // The May bar sits under the blue line and inside the grey range band.
                await clickAction(505, 470)(chart);
                const expected = expect.objectContaining({
                    type: 'seriesNodeClick',
                    datum: { x: 'May', y: 3 },
                    allMatchedParams: [
                        expect.objectContaining({ type: 'seriesNodeClick', datum: { x: 'May', y: 3 } }),
                        expect.objectContaining({ type: 'crossLineClick', crossLineId: 'blue-line', value: 'May' }),
                        expect.objectContaining({
                            type: 'crossLineClick',
                            crossLineId: 'grey-range',
                            range: ['Mar', 'Jul'],
                        }),
                    ],
                });
                expect(seriesSeriesNodeClick).toHaveBeenCalledWith(expected);
                expect(chartSeriesNodeClick).toHaveBeenCalledWith(expected);
                expect(chartCrossLineClick).toHaveBeenCalledTimes(0);
                expect(chartClick).toHaveBeenCalledTimes(0);
            });
            test('a cross line wins over a series node under the pointer that nothing listens to', async () => {
                chart.destroy();
                chart = await createChart({
                    data: [{ x: 'May', y: 3 }],
                    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
                    axes: {
                        myX: {
                            type: 'category',
                            crossLines: [{ id: 'blue-line', type: 'line', value: 'May', strokeWidth: 2 }],
                        },
                        myY: { type: 'number' },
                    },
                    listeners: { crossLineClick: chartCrossLineClick },
                });
                const { x, y, width, height } = chart.seriesRect!;
                await clickAction(x + width / 2, y + height - 10)(chart);
                expect(chartCrossLineClick).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'crossLineClick',
                        crossLineId: 'blue-line',
                        allMatchedParams: [
                            expect.objectContaining({ type: 'crossLineClick', crossLineId: 'blue-line' }),
                            expect.objectContaining({ type: 'seriesNodeClick', datum: { x: 'May', y: 3 } }),
                        ],
                    })
                );
            });
            test.each([
                { gesture: 'double-click', nodeListener: 'seriesNodeClick', crossLineListener: 'crossLineDoubleClick' },
                { gesture: 'click', nodeListener: 'seriesNodeDoubleClick', crossLineListener: 'crossLineClick' },
            ] as const)(
                'a cross line wins a $gesture over a series node that only has a $nodeListener listener',
                async ({ gesture, nodeListener, crossLineListener }) => {
                    const crossLineListenerFn = vi.fn();
                    chart.destroy();
                    chart = await createChart({
                        data: [{ x: 'May', y: 3 }],
                        series: [{ type: 'bar', xKey: 'x', yKey: 'y', listeners: { [nodeListener]: vi.fn() } }],
                        axes: {
                            myX: {
                                type: 'category',
                                crossLines: [{ id: 'blue-line', type: 'line', value: 'May', strokeWidth: 2 }],
                            },
                            myY: { type: 'number' },
                        },
                        listeners: { [crossLineListener]: crossLineListenerFn },
                    });
                    const { x, y, width, height } = chart.seriesRect!;
                    const action = gesture === 'click' ? clickAction : doubleClickAction;
                    await action(x + width / 2, y + height - 10)(chart);
                    expect(crossLineListenerFn).toHaveBeenCalledWith(
                        expect.objectContaining({ type: crossLineListener, crossLineId: 'blue-line' })
                    );
                }
            );
            test('a cross line wins over a series node only within `nodeClickRange`', async () => {
                chart.destroy();
                chart = await createChart({
                    data: [
                        { x: 'Jan', y: 8 },
                        { x: 'Mar', y: 6 },
                        { x: 'May', y: 3 },
                        { x: 'Jul', y: 9 },
                    ],
                    series: [
                        {
                            type: 'bar',
                            xKey: 'x',
                            yKey: 'y',
                            nodeClickRange: 'nearest',
                            listeners: { seriesNodeClick: seriesSeriesNodeClick },
                        },
                    ],
                    axes: {
                        myX: {
                            type: 'category',
                            crossAt: { value: 0 },
                            crossLines: [
                                { id: 'blue-line', type: 'line', value: 'May', stroke: 'blue', strokeWidth: 2 },
                            ],
                        },
                        myY: { type: 'number' },
                    },
                    listeners: { crossLineClick: chartCrossLineClick, seriesNodeClick: chartSeriesNodeClick },
                });
                // Above the May bar, on the blue line.
                await clickAction(505, 130)(chart);
                expect(chartCrossLineClick).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'crossLineClick',
                        crossLineId: 'blue-line',
                        allMatchedParams: [
                            expect.objectContaining({ type: 'crossLineClick', crossLineId: 'blue-line' }),
                            expect.objectContaining({ type: 'seriesNodeClick' }),
                        ],
                    })
                );
                expect(chartSeriesNodeClick).toHaveBeenCalledTimes(0);
                expect(seriesSeriesNodeClick).toHaveBeenCalledTimes(0);
            });
            test('clicking Jan bar fires series-node click listeners', async () => {
                await clickAction(140, 255)(chart);
                expect(chartClick).toHaveBeenCalledTimes(0);
                expect(chartCrossLineClick).toHaveBeenCalledTimes(0);
                expect(chartSeriesNodeClick).toHaveBeenCalledTimes(1);
                expect(seriesSeriesNodeClick).toHaveBeenCalledTimes(1);
            });
            test('clicking empty series-area point fire chart click listener', async () => {
                await clickAction(140, 60)(chart);
                expect(chartClick).toHaveBeenCalledTimes(1);
                expect(chartCrossLineClick).toHaveBeenCalledTimes(0);
                expect(chartSeriesNodeClick).toHaveBeenCalledTimes(0);
                expect(seriesSeriesNodeClick).toHaveBeenCalledTimes(0);
            });
        });

        describe('non-interactive cross-lines fire chart and series-node click', () => {
            let seriesSeriesNodeClick: ViFn;
            let chartSeriesNodeClick: ViFn;
            let chartClick: ViFn;

            beforeEach(async () => {
                seriesSeriesNodeClick = vi.fn();
                chartSeriesNodeClick = vi.fn();
                chartClick = vi.fn();

                chart = await createChart({
                    data: [
                        { x: 'Jan', y: 8 },
                        { x: 'Mar', y: 6 },
                        { x: 'May', y: 3 },
                        { x: 'Jul', y: 9 },
                    ],
                    series: [
                        {
                            type: 'bar',
                            xKey: 'x',
                            yKey: 'y',
                            listeners: { seriesNodeClick: seriesSeriesNodeClick },
                        },
                    ],
                    axes: {
                        myX: {
                            type: 'category',
                            crossAt: { value: 0 },
                            crossLines: [
                                { id: 'blue-line', type: 'line', value: 'May', stroke: 'blue', strokeWidth: 2 },
                                { id: 'grey-range', type: 'range', range: ['Mar', 'Jul'], strokeWidth: 2 },
                            ],
                        },
                        myY: {
                            type: 'number',
                            // No user-option `id`; Use auto-generated id.
                            crossLines: [{ type: 'line', value: 8, stroke: 'lime', strokeWidth: 2 }],
                        },
                    },
                    listeners: {
                        click: chartClick,
                        seriesNodeClick: chartSeriesNodeClick,
                        // `crossLineClick` omitted
                    },
                });
            });
            test('click Jan bar', async () => {
                await clickAction(140, 255)(chart);
                expect(seriesSeriesNodeClick).toHaveBeenCalledTimes(1);
                expect(chartSeriesNodeClick).toHaveBeenCalledTimes(1);
                expect(chartClick).toHaveBeenCalledTimes(0);
            });
            test('click chart on lime cross-line', async () => {
                await clickAction(209, 127)(chart);
                expect(seriesSeriesNodeClick).toHaveBeenCalledTimes(0);
                expect(chartSeriesNodeClick).toHaveBeenCalledTimes(0);
                expect(chartClick).toHaveBeenCalledTimes(1);
            });
            test('click May bar on blue cross-line', async () => {
                await clickAction(505, 470)(chart);
                expect(seriesSeriesNodeClick).toHaveBeenCalledTimes(1);
                expect(chartSeriesNodeClick).toHaveBeenCalledTimes(1);
                expect(chartClick).toHaveBeenCalledTimes(0);
            });
            test('AC4i: a series-node win reports the cross lines it overlaps', async () => {
                await clickAction(505, 470)(chart);
                const expected = expect.objectContaining({
                    // The series node still wins the event, so it carries the root params.
                    type: 'seriesNodeClick',
                    datum: { x: 'May', y: 3 },
                    allMatchedParams: [
                        expect.objectContaining({
                            type: 'seriesNodeClick',
                            datum: { x: 'May', y: 3 },
                        }),
                        expect.objectContaining({
                            type: 'crossLineClick',
                            crossLineId: 'blue-line',
                            value: 'May',
                        }),
                        expect.objectContaining({
                            type: 'crossLineClick',
                            crossLineId: 'grey-range',
                            range: ['Mar', 'Jul'],
                        }),
                    ],
                });
                expect(seriesSeriesNodeClick).toHaveBeenCalledWith(expected);
                expect(chartSeriesNodeClick).toHaveBeenCalledWith(expected);
                // TC7: no entry carries the old `clickedOn` discriminant.
                const [event] = seriesSeriesNodeClick.mock.calls[0];
                for (const params of [event, ...event.allMatchedParams]) {
                    expect(params).not.toHaveProperty('clickedOn');
                }
            });
            test('AC4ii: a series-node click clear of any cross line reports only itself', async () => {
                await clickAction(140, 255)(chart);
                const expected = expect.objectContaining({
                    type: 'seriesNodeClick',
                    datum: { x: 'Jan', y: 8 },
                    allMatchedParams: [expect.objectContaining({ type: 'seriesNodeClick', datum: { x: 'Jan', y: 8 } })],
                });
                expect(seriesSeriesNodeClick).toHaveBeenCalledWith(expected);
                expect(chartSeriesNodeClick).toHaveBeenCalledWith(expected);
            });
        });
    });

    describe('TC1: secondary axes', () => {
        test('a cross line on a secondary axis reports that axis key', async () => {
            const click = vi.fn();
            chart = await createChart({
                data: [
                    { x: 'Jan', y: 2, y2: 400 },
                    { x: 'Feb', y: 8, y2: 700 },
                ],
                series: [
                    { type: 'line', xKey: 'x', yKey: 'y' },
                    { type: 'line', xKey: 'x', yKey: 'y2', yKeyAxis: 'ySecondary' },
                ],
                axes: {
                    x: { type: 'category' },
                    y: { type: 'number', position: 'left' },
                    ySecondary: {
                        type: 'number',
                        position: 'right',
                        min: 0,
                        max: 1000,
                        crossLines: [{ id: 'volume-band', type: 'range', range: [0, 1000], listeners: { click } }],
                    },
                },
            });

            await clickAction(CENTRE_X, CENTRE_Y)(chart);

            expect(click).toHaveBeenCalledWith(
                expect.objectContaining({ crossLineId: 'volume-band', axisId: 'ySecondary', direction: 'y' })
            );
        });
    });

    describe('AC7: axis-level and chart-level listeners', () => {
        test('the same event reaches the cross line, the axis and the chart', async () => {
            const crossLineClick = vi.fn();
            const axisClick = vi.fn();
            const chartClick = vi.fn();
            chart = await createChart(
                fullRangeOptions({
                    listeners: { crossLineClick: chartClick },
                    axes: {
                        x: { type: 'category' },
                        y: {
                            type: 'number',
                            min: FULL_RANGE[0],
                            max: FULL_RANGE[1],
                            listeners: { crossLineClick: axisClick },
                            crossLines: [rangeCrossLine({ click: crossLineClick }, 'band')],
                        },
                    },
                })
            );

            await clickAction(CENTRE_X, CENTRE_Y)(chart);

            const expected = expect.objectContaining({ type: 'crossLineClick', crossLineId: 'band' });

            expect(crossLineClick).toHaveBeenCalledTimes(1);
            expect(crossLineClick).toHaveBeenCalledWith(expected);

            expect(axisClick).toHaveBeenCalledTimes(1);
            expect(axisClick).toHaveBeenCalledWith(expected);

            expect(chartClick).toHaveBeenCalledTimes(1);
            expect(chartClick).toHaveBeenCalledWith(expected);
        });

        test('axis-level `crossLineDoubleClick` fires on double click', async () => {
            const axisDoubleClick = vi.fn();
            chart = await createChart(
                fullRangeOptions({
                    axes: {
                        x: { type: 'category' },
                        y: {
                            type: 'number',
                            min: FULL_RANGE[0],
                            max: FULL_RANGE[1],
                            listeners: { crossLineDoubleClick: axisDoubleClick },
                            crossLines: [rangeCrossLine()],
                        },
                    },
                })
            );

            await doubleClickAction(CENTRE_X, CENTRE_Y)(chart);

            expect(axisDoubleClick).toHaveBeenCalledTimes(1);
        });
    });

    describe('callback context', () => {
        test('the axis context wins over the chart context', async () => {
            const click = vi.fn();
            chart = await createChart(
                fullRangeOptions({
                    context: 'chart-context',
                    axes: {
                        x: { type: 'category' },
                        y: {
                            type: 'number',
                            min: FULL_RANGE[0],
                            max: FULL_RANGE[1],
                            context: 'axis-context',
                            crossLines: [rangeCrossLine({ click })],
                        },
                    },
                })
            );

            await clickAction(CENTRE_X, CENTRE_Y)(chart);

            expect(click).toHaveBeenCalledWith(expect.objectContaining({ context: 'axis-context' }));
        });

        test('the chart context is used when the axis has none', async () => {
            const click = vi.fn();
            chart = await createChart(
                fullRangeOptions({
                    context: 'chart-context',
                    axes: {
                        x: { type: 'category' },
                        y: {
                            type: 'number',
                            min: FULL_RANGE[0],
                            max: FULL_RANGE[1],
                            crossLines: [rangeCrossLine({ click })],
                        },
                    },
                })
            );

            await clickAction(CENTRE_X, CENTRE_Y)(chart);

            expect(click).toHaveBeenCalledWith(expect.objectContaining({ context: 'chart-context' }));
        });

        test('the chart listener gets the axis context with no other listener registered', async () => {
            const chartClick = vi.fn();
            chart = await createChart(
                fullRangeOptions({
                    context: 'chart-context',
                    listeners: { crossLineClick: chartClick },
                    axes: {
                        x: { type: 'category' },
                        y: {
                            type: 'number',
                            min: FULL_RANGE[0],
                            max: FULL_RANGE[1],
                            context: 'axis-context',
                            crossLines: [rangeCrossLine()],
                        },
                    },
                })
            );

            await clickAction(CENTRE_X, CENTRE_Y)(chart);

            expect(chartClick).toHaveBeenCalledWith(expect.objectContaining({ context: 'axis-context' }));
        });
    });

    describe('option updates', () => {
        test('a replaced listener is invoked instead of the previous one', async () => {
            const first = vi.fn();
            const second = vi.fn();
            const build = (click: () => void) =>
                fullRangeOptions({
                    axes: {
                        x: { type: 'category' },
                        y: {
                            type: 'number',
                            min: FULL_RANGE[0],
                            max: FULL_RANGE[1],
                            crossLines: [rangeCrossLine({ click })],
                        },
                    },
                });

            chart = await createChart(build(first));
            await chart.publicApi!.update(build(second));
            await waitForChartStability(chart);

            await clickAction(CENTRE_X, CENTRE_Y)(chart);

            expect(first).not.toHaveBeenCalled();
            expect(second).toHaveBeenCalledTimes(1);
        });
    });

    describe('range clamped to the domain', () => {
        const MONTHS = Array.from({ length: 6 }, (_, i) => new Date(2026, i, 1));

        async function createBandChart(...ranges: Array<[Date, Date]>) {
            chart = await createChart({
                data: MONTHS.map((date, i) => ({ date, value: i + 1 })),
                series: [{ type: 'bar', xKey: 'date', yKey: 'value' }],
                axes: {
                    x: {
                        type: 'unit-time',
                        position: 'bottom',
                        paddingOuter: 0,
                        crossLines: ranges.map((range) => ({
                            type: 'range' as const,
                            range,
                            label: { text: 'Range' },
                        })),
                    },
                    y: { type: 'number', position: 'left' },
                },
            });
            const [crossLine] = getCrossLinesPlugin(chart.axes.findById('x')!)!.getInstances();
            return crossLine;
        }

        test('renders ranges clamped at both ends of the domain', async () => {
            await createBandChart([new Date(2025, 10, 1), MONTHS[0]], [new Date(2026, 5, 5), new Date(2026, 5, 20)]);
            await compare();
        });

        test('keeps the first band of a range that starts before the domain', async () => {
            const crossLine = await createBandChart([new Date(2025, 10, 1), MONTHS[0]]);

            expect(crossLine.rangeGroup.visible).toBe(true);
            const [rangeNode] = crossLine.rangeGroup.children();
            const box = Transformable.toCanvas(rangeNode);
            expect(box.x).toBeCloseTo(chart.seriesRect!.x);
            expect(box.width).toBeGreaterThanOrEqual(crossLine.scale!.bandwidth!);
        });

        test('keeps a range that lies inside the last band', async () => {
            const crossLine = await createBandChart([new Date(2026, 5, 5), new Date(2026, 5, 20)]);

            expect(crossLine.rangeGroup.visible).toBe(true);
            const [rangeNode] = crossLine.rangeGroup.children();
            const box = Transformable.toCanvas(rangeNode);
            expect(box.x + box.width).toBeCloseTo(chart.seriesRect!.x + chart.seriesRect!.width);
            expect(box.width).toBeGreaterThanOrEqual(crossLine.scale!.bandwidth!);
        });

        test('hides a range that ends before the domain', async () => {
            const crossLine = await createBandChart([new Date(2025, 9, 1), new Date(2025, 10, 1)]);

            expect(crossLine.rangeGroup.visible).toBe(false);
            expect(crossLine.labelGroup.visible).toBe(false);
        });
    });

    describe('AG-7486: label overflow', () => {
        const outsidePositions: AgCrossLineLabelPosition[] = labelPositions.filter((p) => !p.startsWith('inside'));

        function crossLineOptions(
            type: CrossLineType,
            label: Partial<NormalisedAxisCrossLineLabelOptions>
        ): NormalisedAxisCrossLineOptions {
            const style = { enabled: true, stroke: 'black', strokeWidth: 1 };
            const fullLabel: NormalisedAxisCrossLineLabelOptions = {
                enabled: true,
                text: 'A long enough label',
                fontSize: 12,
                fontFamily: 'sans-serif',
                fontWeight: 'normal',
                padding: 5,
                color: 'black',
                cornerRadius: 0,
                ...label,
            };
            return type === 'line'
                ? { ...style, type, value: 0, label: fullLabel }
                : { ...style, type, range: [0, 1], label: fullLabel };
        }

        function unitCrossLine() {
            const chartCtx = { domManager: { isRtl: false }, logger: { warnOnce() {}, deprecationOnce() {} } };
            return new CartesianCrossLine(chartCtx as unknown as DynamicContext<ChartRegistry>);
        }

        function crossLineWith(
            overflow: CrossLineLabelOverflow,
            position: AgCrossLineLabelPosition,
            type: CrossLineType
        ) {
            const crossLine = unitCrossLine();
            crossLine.applyOptions(crossLineOptions(type, { overflow, position }));
            crossLine.position = 'bottom';
            return crossLine;
        }

        function paddingFor(overflow: CrossLineLabelOverflow, position: AgCrossLineLabelPosition, type: CrossLineType) {
            const into: Partial<Record<AgCrossLineLabelPosition, number>> = {};
            crossLineWith(overflow, position, type).calculatePadding(into);
            return into;
        }

        it.each(['line', 'range'] as const)(
            'pad-chart reserves space for an outside label on a %s cross line',
            (type) => {
                const reserved = outsidePositions.filter((position) => {
                    const into = paddingFor('pad-chart', position, type);
                    return Object.values(into).some((v) => (v ?? 0) > 0);
                });

                // Guards against a vacuous realign/clip assertion below: pad-chart must actually pad somewhere.
                expect(reserved.length).toBeGreaterThan(0);
            }
        );

        it('an unset overflow pads as pad-chart does', () => {
            const crossLine = unitCrossLine();
            crossLine.applyOptions(crossLineOptions('line', { position: 'top' }));
            crossLine.position = 'bottom';

            const into: Partial<Record<AgCrossLineLabelPosition, number>> = {};
            crossLine.calculatePadding(into);

            expect(into).toEqual(paddingFor('pad-chart', 'top', 'line'));
            expect(Object.values(into).some((v) => (v ?? 0) > 0)).toBe(true);
        });

        it.each(['realign-text', 'clip-text'] as const)('%s reserves no space at any label position', (overflow) => {
            for (const type of ['line', 'range'] as const) {
                for (const position of labelPositions) {
                    expect({ overflow, type, position, padding: paddingFor(overflow, position, type) }).toEqual({
                        overflow,
                        type,
                        position,
                        padding: {},
                    });
                }
            }
        });

        it('realign-text leaves the series area larger than pad-chart', async () => {
            const build = (overflow: CrossLineLabelOverflow): AgCartesianChartOptions => ({
                ...examples.LINE_CROSSLINES,
                axes: mapValues(examples.LINE_CROSSLINES.axes ?? {}, (axis: any) =>
                    axis.crossLines
                        ? {
                              ...axis,
                              crossLines: axis.crossLines.map((c: any) => ({
                                  ...c,
                                  label: { ...c.label, text: 'A long enough label', placement: 'top', overflow },
                              })),
                          }
                        : axis
                ),
            });

            chart = await createChart(build('pad-chart'));
            const padded = (chart as any).seriesRect.clone();

            await chart.publicApi!.update(build('realign-text'));
            await waitForChartStability(chart);
            const realigned = (chart as any).seriesRect;

            expect(realigned.height).toBeGreaterThan(padded.height);
        });

        it('renders the chart when a label demands more room than is spare', async () => {
            // `placement: 'left'` on the left-hand axis pads horizontally, so a very wide label is what
            // outgrows the space available.
            const veryLongLabel = 'A'.repeat(400);
            const { x, y } = examples.LINE_CROSSLINES.axes as any;

            chart = await createChart({
                ...examples.LINE_CROSSLINES,
                axes: {
                    x,
                    y: {
                        ...y,
                        crossLines: [{ type: 'line', value: 0.87, label: { text: veryLongLabel, placement: 'left' } }],
                    },
                },
            });

            const seriesRect = (chart as any).seriesRect;

            expect((chart as any).seriesRoot.visible).toBe(true);
            expect(seriesRect.width).toBeGreaterThan(0);
            expect(seriesRect.height).toBeGreaterThan(0);
        });

        it('clip-text truncates a label that would run past the container edge', async () => {
            const veryLongLabel = 'A cross line label far too long to fit the chart it is drawn on';
            const { x, y } = examples.LINE_CROSSLINES.axes as any;
            const build = (overflow: CrossLineLabelOverflow): AgCartesianChartOptions => ({
                ...examples.LINE_CROSSLINES,
                axes: {
                    x,
                    y: {
                        ...y,
                        crossLines: [
                            {
                                type: 'line',
                                value: 0.87,
                                label: undocumentedLabel({ text: veryLongLabel, placement: 'left', overflow }),
                            },
                        ],
                    },
                },
            });

            chart = await createChart(build('clip-text'));
            const clipped = crossLineLabelText(chart, 'y');

            expect(clipped).not.toEqual(veryLongLabel);
            expect(clipped.endsWith('\u2026')).toBe(true);
            expect(veryLongLabel.startsWith(clipped.slice(0, -1))).toBe(true);

            // Guards against the assertion above passing because the label never fits under any mode.
            await chart.publicApi!.update(build('realign-text'));
            await waitForChartStability(chart);

            expect(crossLineLabelText(chart, 'y')).toEqual(veryLongLabel);
        });

        it('clip-text shortens monotonically as the room runs out, ending at an ellipsis', async () => {
            // A rotated label extends along the axis's short side, which is the only direction whose room
            // a label padding can exhaust; upright text is bounded by the far wider horizontal extent.
            const { x, y } = examples.LINE_CROSSLINES.axes as any;
            const build = (padding: number): AgCartesianChartOptions => ({
                ...examples.LINE_CROSSLINES,
                axes: {
                    y,
                    x: {
                        ...x,
                        crossLines: [
                            {
                                type: 'line',
                                value: 5,
                                label: undocumentedLabel({
                                    text: 'A cross line label',
                                    placement: 'top',
                                    overflow: 'clip-text',
                                    rotation: 90,
                                    padding,
                                }),
                            },
                        ],
                    },
                },
            });

            chart = await createChart(build(0));
            const rendered = [crossLineLabelText(chart, 'x')];
            for (const padding of [20, 40, 60, 200]) {
                await chart.publicApi!.update(build(padding));
                await waitForChartStability(chart);
                rendered.push(crossLineLabelText(chart, 'x'));
            }

            // Room only ever shrinks, so neither may the text — a bound that stopped applying once the
            // room went negative would show up here as a jump back to the full label.
            const lengths = rendered.map((text) => text.length);
            expect(lengths).toEqual([...lengths].sort((a, b) => b - a));
            expect(rendered[0]).not.toEqual('\u2026');
            expect(rendered.at(-1)).toEqual('\u2026');
        });

        // Only `left`/`right` on a vertical axis and `top`/`bottom` on a horizontal one sit outside the
        // cross line, so these four cover every padding branch and all four anchor tables at once.
        type OverflowCase = { overflow: CrossLineLabelOverflow; label?: string };

        function overflowChart(
            xLine: OverflowCase,
            xRange: OverflowCase,
            yLine: OverflowCase,
            yRange: OverflowCase
        ): AgCartesianChartOptions {
            return {
                data: Array.from({ length: 11 }, (_, i) => ({ x: i, y: Math.sin(i / 2) * 40 + 50 })),
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: {
                        type: 'number',
                        position: 'bottom',
                        crossLines: [
                            {
                                type: 'line',
                                value: 3,
                                stroke: 'red',
                                strokeWidth: 1,
                                label: undocumentedLabel({
                                    text: xLine.label ?? 'x line top',
                                    placement: 'top',
                                    fontSize: 24,
                                    overflow: xLine.overflow,
                                }),
                            },
                            {
                                type: 'range',
                                range: [6, 8],
                                stroke: 'green',
                                strokeWidth: 1,
                                fill: 'green',
                                fillOpacity: 0.2,
                                label: undocumentedLabel({
                                    text: xRange.label ?? 'x range bottom',
                                    placement: 'bottom',
                                    fontSize: 24,
                                    overflow: xRange.overflow,
                                }),
                            },
                        ],
                    },
                    y: {
                        type: 'number',
                        position: 'left',
                        crossLines: [
                            {
                                type: 'line',
                                value: 20,
                                stroke: 'blue',
                                strokeWidth: 1,
                                label: undocumentedLabel({
                                    text: yLine.label ?? 'y-axis line cross line',
                                    placement: 'left',
                                    overflow: yLine.overflow,
                                }),
                            },
                            {
                                type: 'range',
                                range: [70, 85],
                                stroke: 'orange',
                                strokeWidth: 1,
                                fill: 'orange',
                                fillOpacity: 0.2,
                                label: undocumentedLabel({
                                    text: yRange.label ?? 'y-axis range cross line',
                                    placement: 'right',
                                    overflow: yRange.overflow,
                                }),
                            },
                        ],
                    },
                },
            };
        }

        it('renders every padding branch under pad-chart', async () => {
            const padChart: OverflowCase = { overflow: 'pad-chart' };
            chart = await createChart(overflowChart(padChart, padChart, padChart, padChart));
            await compare();
        });

        it('renders every padding branch under realign-text', async () => {
            const realign: OverflowCase = { overflow: 'realign-text' };
            chart = await createChart(overflowChart(realign, realign, realign, realign));
            await compare();
        });

        it('renders mixed overflow modes alongside a label larger than the space available', async () => {
            chart = await createChart(
                overflowChart(
                    { overflow: 'pad-chart' },
                    { overflow: 'realign-text' },
                    { overflow: 'pad-chart', label: 'A'.repeat(400) },
                    { overflow: 'realign-text' }
                )
            );
            await compare();
        });
    });

    describe('label collision', () => {
        type SmallLabel = Parameters<typeof undocumentedLabel>[0];

        // Two labels above the same x value: a small one, reserved unless overridden, and a large one
        // that overlaps it and pads the chart further.
        function collisionChart({
            alwaysShow = false,
            stroke = 'blue',
            small = {},
            values: [smallValue, largeValue] = [5, 5],
        }: {
            alwaysShow?: boolean;
            stroke?: string;
            small?: Partial<SmallLabel>;
            values?: [number, number];
        } = {}): AgCartesianChartOptions {
            return {
                data: Array.from({ length: 11 }, (_, i) => ({ x: i, y: i })),
                series: [{ type: 'line', xKey: 'x', yKey: 'y', stroke }],
                axes: {
                    x: {
                        type: 'number',
                        position: 'bottom',
                        crossLines: [
                            {
                                type: 'line',
                                value: smallValue,
                                label: undocumentedLabel({ text: 'A', fontSize: 10, reserveSpace: true, ...small }),
                            },
                            {
                                type: 'line',
                                value: largeValue,
                                label: { text: 'LARGE LABEL', fontSize: 40, collision: { alwaysShow } },
                            },
                        ],
                    },
                    y: { type: 'number', position: 'left' },
                },
            };
        }

        function labelsShown(axisId = 'x') {
            const axis = chart.axes.findById(axisId)!;
            return (getCrossLinesPlugin(axis)?.getInstances() ?? []).map((crossLine) => {
                const [crossLineLabel] = crossLine.labelGroup.children() as any;
                return crossLineLabel.visible as boolean;
            });
        }

        it('hides a colliding label and releases the space it padded', async () => {
            chart = await createChart(collisionChart({ alwaysShow: true }));
            const shownTop = chart.seriesRect!.y;
            expect(labelsShown()).toEqual([true, true]);

            await chart.publicApi!.update(collisionChart());
            await waitForChartStability(chart);

            expect(labelsShown()).toEqual([true, false]);
            expect(chart.seriesRect!.y).toBeLessThan(shownTop);
        });

        it('renders a colliding label hidden without the space it would pad', async () => {
            chart = await createChart(collisionChart());
            await compare();
        });

        it('keeps a label outside the series area when nothing collides with it', async () => {
            chart = await createChart(collisionChart({ small: { enabled: false } }));

            expect(labelsShown()[1]).toBe(true);
        });

        it('hides a label behind another droppable cross line label', async () => {
            chart = await createChart(
                collisionChart({ small: { reserveSpace: false, collision: { alwaysShow: false } } })
            );

            expect(labelsShown()).toEqual([true, false]);
        });

        it('hides a label behind a series label that is always shown', async () => {
            const seriesLabelChart = (enabled: boolean): AgCartesianChartOptions => ({
                data: Array.from({ length: 11 }, (_, i) => ({ x: i, y: 50 })),
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        marker: { enabled: false },
                        label: { enabled, collision: { alwaysShow: true } },
                    },
                ],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: {
                        type: 'number',
                        position: 'left',
                        crossLines: [
                            {
                                type: 'line',
                                value: 50,
                                label: undocumentedLabel({
                                    placement: 'inside',
                                    text: 'CROSSLINE LABEL',
                                    fontSize: 40,
                                    collision: { alwaysShow: false },
                                }),
                            },
                        ],
                    },
                },
            });

            chart = await createChart(seriesLabelChart(false));
            expect(labelsShown('y')).toEqual([true]);
            chart.destroy();

            chart = await createChart(seriesLabelChart(true));
            expect(labelsShown('y')).toEqual([false]);
        });

        it('settles on the same result when laid out again', async () => {
            chart = await createChart(collisionChart());
            await chart.publicApi!.update(collisionChart({ stroke: 'red' }));
            await waitForChartStability(chart);
            const settled = { top: chart.seriesRect!.y, shown: labelsShown() };

            await chart.publicApi!.update(collisionChart({ stroke: 'green' }));
            await waitForChartStability(chart);

            expect({ top: chart.seriesRect!.y, shown: labelsShown() }).toEqual(settled);
        });

        it('lets a label hidden by the re-layout keep the space it was padded', async () => {
            chart = await createChart(collisionChart({ alwaysShow: true }));
            const [, crossLine] = getCrossLinesPlugin(chart.axes.findById('x')!)!.getInstances();

            crossLine.holdLabelPlacement!(true);
            crossLine.applyLabelPlacement!(true);
            crossLine.holdLabelPlacement!(false);

            // A hover re-applies the same solve, which must not read as a flip needing another layout.
            expect(crossLine.applyLabelPlacement!(true)).toBe(false);
        });

        it('lays a hidden label out once when it keeps its verdict', async () => {
            async function updateLabelsCallsOnLayout(options: AgCartesianChartOptions) {
                chart = await createChart(options);
                const updateLabels = vi.spyOn(chart.ctx.labelManager, 'updateLabels');
                chart.update(ChartUpdateType.PERFORM_LAYOUT);
                await waitForChartStability(chart);
                return { calls: updateLabels.mock.calls.length, shown: labelsShown() };
            }

            const shown = await updateLabelsCallsOnLayout(collisionChart({ alwaysShow: true }));
            chart.destroy();
            const hidden = await updateLabelsCallsOnLayout(collisionChart());

            expect(hidden.shown).toEqual([true, false]);
            expect(hidden.calls).toBe(shown.calls);
        });

        it('shows a hidden label again once a resize clears what it collided with', async () => {
            const container = getDocument().createElement('div');
            getDocument().body.append(container);
            const options = prepareTestOptions(collisionChart({ values: [3, 6] }), container);
            delete options.width;
            delete options.height;
            chart = deproxy(AgCharts.create(options));

            const resizeTo = async (width: number) => {
                chart.ctx.domManager.containerSize = { width, height: 400, pixelRatio: 1 };
                chart.ctx.eventsHub.emit('dom:resize', null);
                await waitForChartStability(chart);
            };

            try {
                await resizeTo(400);
                expect(labelsShown()).toEqual([true, false]);
                const hiddenTop = chart.seriesRect!.y;

                await resizeTo(1200);
                expect(labelsShown()).toEqual([true, true]);
                expect(chart.seriesRect!.y).toBeGreaterThan(hiddenTop);
            } finally {
                container.remove();
            }
        });
    });

    describe('label placement', () => {
        type PlacedLabelOptions = Parameters<typeof undocumentedLabel>[0];

        // Blockers reserve their space on a y-axis line, so the label under test must avoid them.
        function placementChart(
            placed: PlacedLabelOptions | undefined,
            blockers: PlacedLabelOptions['placement'][] = []
        ): AgCartesianChartOptions {
            const blockerLines = blockers.map((placement) => ({
                type: 'line' as const,
                value: 5,
                label: undocumentedLabel({ text: 'BLOCKER', fontSize: 20, placement, reserveSpace: true }),
            }));
            const placedLine = placed == null ? [] : [{ type: 'line' as const, value: 5, label: placed }];
            return {
                data: Array.from({ length: 11 }, (_, i) => ({ x: i, y: i })),
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left', crossLines: [...blockerLines, ...placedLine] },
                },
            };
        }

        function placedLabelBox() {
            const crossLines = getCrossLinesPlugin(chart.axes.findById('y')!)!.getInstances();
            return crossLines.at(-1)!.getLabelBox?.();
        }

        it.each([
            ['dropped', { alwaysShow: false }],
            ['kept', { alwaysShow: true }],
        ])('moves a %s label to the next placement when the first collides', async (_, collision) => {
            chart = await createChart(
                placementChart({ text: 'PLACED', fontSize: 20, placement: ['right', 'inside-left'], collision }, [
                    'right',
                ])
            );

            const box = placedLabelBox();
            const seriesRect = chart.seriesRect!;
            expect(box).toBeDefined();
            expect(box!.x).toBeGreaterThanOrEqual(seriesRect.x);
            expect(box!.x + box!.width).toBeLessThan(seriesRect.x + seriesRect.width / 2);
        });

        it('pads the chart for the placement chosen', async () => {
            chart = await createChart(placementChart(undefined, ['inside-left']));
            const unpaddedWidth = chart.seriesRect!.width;
            chart.destroy();

            chart = await createChart(
                placementChart({ text: 'PLACED', fontSize: 20, placement: ['inside-left', 'right'] }, ['inside-left'])
            );

            const box = placedLabelBox();
            const seriesRect = chart.seriesRect!;
            expect(box).toBeDefined();
            expect(seriesRect.width).toBeLessThan(unpaddedWidth);
            expect(box!.x).toBeGreaterThanOrEqual(seriesRect.x + seriesRect.width);
            expect(box!.x + box!.width).toBeLessThanOrEqual(chart.ctx.scene.width);
        });

        it('keeps a label equally blocked at every placement at its first', async () => {
            chart = await createChart(
                placementChart({ text: 'PLACED', fontSize: 20, placement: ['inside-left', 'inside-right'] }, [
                    'inside-left',
                    'inside-right',
                ])
            );

            const box = placedLabelBox();
            const seriesRect = chart.seriesRect!;
            expect(box).toBeDefined();
            expect(box!.x + box!.width).toBeLessThan(seriesRect.x + seriesRect.width / 2);
        });

        it('keeps a label that fits nowhere at its least blocked placement', async () => {
            const blocker = (text: string, fontSize: number, placement: 'inside-left' | 'inside-right') => ({
                type: 'line' as const,
                value: 5,
                label: undocumentedLabel({ text, fontSize, placement, reserveSpace: true }),
            });
            const options = placementChart({
                text: 'PLACED',
                fontSize: 20,
                placement: ['inside-left', 'inside-right'],
            });
            const y = options.axes!.y as AgNumberAxisOptions;
            chart = await createChart({
                ...options,
                axes: {
                    ...options.axes,
                    y: {
                        ...y,
                        crossLines: [
                            blocker('BLOCKER BLOCKER', 20, 'inside-left'),
                            blocker('B', 8, 'inside-right'),
                            ...y.crossLines!,
                        ],
                    },
                },
            });

            const box = placedLabelBox();
            const seriesRect = chart.seriesRect!;
            expect(box).toBeDefined();
            expect(box!.x).toBeGreaterThan(seriesRect.x + seriesRect.width / 2);
        });

        it('tests a clip-text fallback with the text it renders at that placement', async () => {
            const label = {
                text: 'A cross line label far too long to fit beside the chart',
                overflow: 'clip-text',
            } as const;
            chart = await createChart(placementChart(undocumentedLabel({ ...label, placement: 'inside-left' })));
            const rendered = placedLabelBox()!;
            chart.destroy();

            chart = await createChart(
                placementChart(undocumentedLabel({ ...label, placement: ['right', 'inside-left'] }))
            );
            const seriesRect = chart.seriesRect!;
            const crossLine = getCrossLinesPlugin(chart.axes.findById('y')!)!.getInstances().at(-1)!;
            const [atRight, atInsideLeft] = crossLine.getLabelDatum!(seriesRect)!.positionedCandidates!;

            expect(atRight.box.width).toBeLessThan(rendered.width);
            expect(atInsideLeft.box.x + seriesRect.x).toBeCloseTo(rendered.x);
            expect(atInsideLeft.box.width).toBeCloseTo(rendered.width);
        });

        it('settles on the same placement when laid out again', async () => {
            const options = placementChart({ text: 'PLACED', fontSize: 20, placement: ['inside-left', 'right'] }, [
                'inside-left',
            ]);
            chart = await createChart(options);
            const settled = { seriesRect: chart.seriesRect!.clone(), box: placedLabelBox() };

            await chart.publicApi!.update(prepareTestOptions({ ...options, title: { text: 'Again' } }));
            await waitForChartStability(chart);
            const again = placedLabelBox();

            expect(again!.x - chart.seriesRect!.x).toBeCloseTo(settled.box!.x - settled.seriesRect.x);
            expect(chart.seriesRect!.width).toBeCloseTo(settled.seriesRect.width);
        });

        it('places an `end` label right of the series area in a left-to-right chart', async () => {
            chart = await createChart(placementChart({ text: 'PLACED', placement: 'end' }));

            const box = placedLabelBox();
            expect(box).toBeDefined();
            expect(box!.x).toBeGreaterThanOrEqual(chart.seriesRect!.x + chart.seriesRect!.width);
        });

        it('places an `end` label left of the series area in a right-to-left chart', async () => {
            chart = await createChart({ ...placementChart({ text: 'PLACED', placement: 'end' }), enableRtl: true });

            const box = placedLabelBox();
            expect(box).toBeDefined();
            expect(box!.x + box!.width).toBeLessThanOrEqual(chart.seriesRect!.x);
        });

        it('resolves a placement array supplied through a theme override', async () => {
            const options = placementChart({ text: 'PLACED', fontSize: 20 }, ['right']);
            chart = await createChart({
                ...options,
                axes: { ...options.axes, x: { ...options.axes!.x, crossLines: [] } },
                theme: {
                    overrides: {
                        common: {
                            axes: { number: { crossLines: { label: { placement: ['right', 'inside-left'] } } } },
                        },
                    },
                },
            });

            const box = placedLabelBox();
            const seriesRect = chart.seriesRect!;
            expect(box).toBeDefined();
            expect(box!.x).toBeGreaterThanOrEqual(seriesRect.x);
            expect(box!.x + box!.width).toBeLessThan(seriesRect.x + seriesRect.width / 2);
        });

        it('places a label by the physical side whichever way the axis runs', async () => {
            const options = placementChart({ text: 'PLACED', placement: 'right' });
            chart = await createChart({
                ...options,
                axes: { ...options.axes, x: { ...options.axes!.x, reverse: true } },
            });

            const box = placedLabelBox();
            expect(box).toBeDefined();
            expect(box!.x).toBeGreaterThanOrEqual(chart.seriesRect!.x + chart.seriesRect!.width);
        });

        it('keeps the fallback placement across layouts when the first overflows the chart', async () => {
            chart = await createChart({
                data: Array.from({ length: 11 }, (_, i) => ({ x: i, y: i })),
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: {
                        type: 'number',
                        position: 'bottom',
                        crossLines: [
                            {
                                type: 'line',
                                value: 0,
                                label: {
                                    text: 'A LONG CROSS LINE LABEL',
                                    fontSize: 20,
                                    placement: ['top', 'right-top'],
                                },
                            },
                        ],
                    },
                    y: { type: 'number', position: 'left' },
                },
            });
            const labelBox = () => getCrossLinesPlugin(chart.axes.findById('x')!)!.getInstances()[0].getLabelBox?.();
            const settled = labelBox();
            expect(settled).toBeDefined();
            expect(settled!.x).toBeGreaterThanOrEqual(chart.seriesRect!.x);

            for (let layout = 0; layout < 2; layout++) {
                chart.update(ChartUpdateType.PERFORM_LAYOUT);
                await waitForChartStability(chart);
                const again = labelBox();
                expect(again!.x).toBeCloseTo(settled!.x);
                expect(again!.y).toBeCloseTo(settled!.y);
            }
        });

        it('renders a deprecated x-axis range corner where its replacement renders', async () => {
            const rangeChart = (label: AgCartesianCrossLineLabelOptions): AgCartesianChartOptions => ({
                data: Array.from({ length: 11 }, (_, i) => ({ x: i, y: i })),
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: {
                        type: 'number',
                        position: 'bottom',
                        crossLines: [{ type: 'range', range: [3, 6], label: { text: 'RANGE', ...label } }],
                    },
                    y: { type: 'number', position: 'left' },
                },
            });

            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createChart,
                rangeChart({ placement: 'left-top' }),
                rangeChart({ position: 'top-left' })
            );
            expectWarningMessages([
                'AG Charts - Option `axes.x.crossLines[0].label.position` is deprecated. Use `placement` instead.',
            ]);
        });

        it('ignores a placement that does not apply to the axis, with a warning', async () => {
            chart = await createChart(placementChart({ text: 'PLACED', placement: ['left-top', 'right'] }));

            const box = placedLabelBox();
            expect(box!.x).toBeGreaterThanOrEqual(chart.seriesRect!.x + chart.seriesRect!.width);
            expectWarningsCalls().toEqual([
                [
                    expect.stringMatching(
                        /^AG Charts - Placement `left-top` does not apply to a line cross line on a y axis and is ignored; expecting one of `top`/
                    ),
                ],
            ]);
        });

        it('aliases a deprecated line placement to its replacement, with a warning', async () => {
            chart = await createChart(placementChart({ text: 'PLACED', placement: 'inside-top' }));

            expectWarningMessages([
                'AG Charts - Placement `inside-top` is deprecated on a line cross line on a y axis. Use `top` instead.',
            ]);
        });

        it.each([
            ['x', 'left-top'],
            ['y', 'top-left'],
        ] as const)('keeps a %s-axis placement on the same side when the axis is reversed', async (axis, placement) => {
            const labelBox = async (reverse: boolean) => {
                const crossLines = [{ type: 'line' as const, value: 5, label: { text: 'PLACED', placement } }];
                chart = await createChart({
                    data: Array.from({ length: 11 }, (_, i) => ({ x: i, y: i })),
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        x: { type: 'number', position: 'bottom', ...(axis === 'x' && { reverse, crossLines }) },
                        y: { type: 'number', position: 'left', ...(axis === 'y' && { reverse, crossLines }) },
                    },
                });
                const box = getCrossLinesPlugin(chart.axes.findById(axis)!)!.getInstances()[0].getLabelBox?.();
                chart.destroy();
                return box;
            };

            const box = await labelBox(false);
            expect(box).toBeDefined();
            expect(await labelBox(true)).toEqual(box);
        });
    });

    describe('AG-8901: label space reservation', () => {
        // Every datum shares a y value, so the series labels form one row across the cross line's own
        // position — the arrangement that puts them in the way whenever the label is not reserved.
        function reservationChart(
            label: Partial<AgCartesianCrossLineLabelOptions>,
            reserveSpace: boolean
        ): AgCartesianChartOptions {
            return {
                data: Array.from({ length: 11 }, (_, i) => ({ x: i, y: 50 })),
                series: [
                    { type: 'line', xKey: 'x', yKey: 'y', label: { enabled: true, placement: ['bottom', 'top'] } },
                ],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: {
                        type: 'number',
                        position: 'left',
                        crossLines: [
                            {
                                type: 'line',
                                value: 50,
                                label: undocumentedLabel({ placement: 'inside', ...label, reserveSpace }),
                            },
                        ],
                    },
                },
            };
        }

        function crossLineLabelBox(axisId: string) {
            const axis = chart.axes.findById(axisId)!;
            const [crossLine] = getCrossLinesPlugin(axis)?.getInstances() ?? [];
            const [crossLineLabel] = crossLine.labelGroup.children() as any;
            return Transformable.toCanvas(crossLineLabel);
        }

        function shownSeriesLabelBoxes() {
            return ((chart as any).series[0].labelSelection.nodes() as any[])
                .filter((node) => node.visible)
                .map((node) => Transformable.toCanvas(node));
        }

        it('keeps series labels clear of a cross line label that reserves its space', async () => {
            const build = (reserveSpace: boolean) =>
                reservationChart({ text: 'CROSSLINE LABEL', fontSize: 40 }, reserveSpace);

            const clearOfCrossLine = () => {
                const crossLineBox = crossLineLabelBox('y');
                const shown = shownSeriesLabelBoxes();
                return {
                    shown: shown.length,
                    overlapping: shown.filter((box) => box.collidesBBox(crossLineBox)).length,
                };
            };

            chart = await createChart(build(false));
            const off = clearOfCrossLine();
            await chart.publicApi!.update(build(true));
            await waitForChartStability(chart);
            const on = clearOfCrossLine();

            // The reserved box is read back off the drawn node, so a relayout must reserve the same space.
            await chart.publicApi!.update({ ...build(true), title: { text: 'relayout' } });
            await waitForChartStability(chart);
            const relaidOut = clearOfCrossLine();

            // Guards the assertions below: without the opt-in the labels must genuinely be in the way.
            expect(off.overlapping).toBeGreaterThan(0);
            expect(on.overlapping).toBe(0);
            expect(on.shown).toBeGreaterThan(0);
            expect(relaidOut.overlapping).toBe(0);
        });

        it('reserves a rotated label the space it actually occupies', async () => {
            const build = (reserveSpace: boolean) =>
                reservationChart({ text: 'ROTATED CROSSLINE LABEL', fontSize: 30, rotation: 90 }, reserveSpace);

            const geometry = () => {
                const drawn = crossLineLabelBox('y');
                // What the engine would reserve if the already-rotated footprint were handed to it with
                // its rotation still attached: at 90 degrees the extent transposes about the same origin.
                const transposed = new BBox(drawn.x, drawn.y, drawn.height, drawn.width);
                const shown = shownSeriesLabelBoxes();
                return {
                    drawn,
                    transposed,
                    labelRowY: Math.min(...shown.map((box) => box.y)),
                    overlappingDrawn: shown.filter((box) => box.collidesBBox(drawn)).length,
                };
            };

            chart = await createChart(build(false));
            const off = geometry();
            await chart.publicApi!.update(build(true));
            await waitForChartStability(chart);
            const on = geometry();

            // Guards the assertion below, and is what makes it discriminating: the series labels sit
            // within the drawn footprint's vertical span but clear of the transposed one's, so reserving
            // the transposed box would have left them free to stay where they overlap the real label.
            expect(on.labelRowY).toBeGreaterThan(on.transposed.y + on.transposed.height);
            expect(on.labelRowY).toBeLessThan(on.drawn.y + on.drawn.height);
            expect(off.overlappingDrawn).toBeGreaterThan(0);

            expect(on.overlappingDrawn).toBe(0);
        });

        it('reserves nothing while the cross line is hidden by an overflowing layout', async () => {
            chart = await createChart(reservationChart({ text: 'CROSSLINE LABEL', fontSize: 40 }, true));

            const axis = chart.axes.findById('y')!;
            const plugin = getCrossLinesPlugin(axis)!;

            expect(plugin.labelSources[0].getLabelData(BBox.zero)).toMatchObject([{ obstacle: true }]);

            const version = plugin.nodeDataVersion;
            plugin.setVisible(false);

            expect(plugin.labelSources[0].getLabelData(BBox.zero)).toHaveLength(0);
            expect(plugin.nodeDataVersion).toBeGreaterThan(version);
        });

        // One chart per reservation state, each carrying an upright reserved label, a rotated one on a
        // range cross line on the other axis, and an unreserved label the series labels may overlap.
        function packedReservationChart(reserveSpace: boolean): AgCartesianChartOptions {
            return {
                data: Array.from({ length: 11 }, (_, i) => ({ x: i, y: 50, y2: Math.sin(i / 2) * 15 + 80 })),
                series: [
                    { type: 'line', xKey: 'x', yKey: 'y', label: { enabled: true, placement: ['bottom', 'top'] } },
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y2',
                        label: { enabled: true, placement: ['top', 'bottom'] },
                    },
                ],
                axes: {
                    x: {
                        type: 'number',
                        position: 'bottom',
                        crossLines: [
                            {
                                type: 'range',
                                range: [3.5, 5.5],
                                stroke: 'green',
                                strokeWidth: 1,
                                fill: 'green',
                                fillOpacity: 0.1,
                                label: undocumentedLabel({
                                    text: 'ROTATED RESERVED',
                                    fontSize: 40,
                                    rotation: 90,
                                    placement: 'inside-top',
                                    reserveSpace,
                                }),
                            },
                        ],
                    },
                    y: {
                        // A fixed domain keeps the reserved cross line amid the series labels.
                        type: 'number',
                        position: 'left',
                        min: 0,
                        max: 100,
                        crossLines: [
                            {
                                type: 'line',
                                value: 50,
                                stroke: 'red',
                                strokeWidth: 1,
                                label: undocumentedLabel({
                                    text: 'RESERVED',
                                    fontSize: 40,
                                    placement: 'inside',
                                    reserveSpace,
                                }),
                            },
                            {
                                type: 'line',
                                value: 80,
                                stroke: 'blue',
                                strokeWidth: 1,
                                label: { text: 'NEVER RESERVED', fontSize: 24, placement: 'inside' },
                            },
                        ],
                    },
                },
            };
        }

        it('renders series labels clear of every cross line label that reserves its space', async () => {
            chart = await createChart(packedReservationChart(true));
            await compare();
        });

        it('renders series labels over cross line labels that reserve nothing', async () => {
            chart = await createChart(packedReservationChart(false));
            await compare();
        });
    });

    // `nice: false` and explicit `min`/`max` pin the domain to the data extremes, so a cross line on an
    // extreme converts to exactly the pixel boundary cross lines are culled against.
    describe('AG-18387: cross lines at the axis extremes', () => {
        const X_MIN = new Date(Date.UTC(2024, 0, 1));
        const X_MAX = new Date(Date.UTC(2024, 11, 1));
        const BEFORE_X_MIN = new Date(Date.UTC(2023, 11, 1));
        const AFTER_X_MAX = new Date(Date.UTC(2025, 0, 1));
        const Y_MIN = 1;
        const Y_MAX = 5;
        const RULER = 'ruler';

        let crossLineClick: ViFn;

        const createExtremesChart = async (direction: 'x' | 'y', crossLines: AgCartesianCrossLineOptions[]) => {
            const ruler: AgCartesianCrossLineOptions =
                direction === 'x'
                    ? { id: RULER, type: 'range', range: [X_MIN, X_MAX] }
                    : { id: RULER, type: 'range', range: [Y_MIN, Y_MAX] };
            const withCrossLines = { crossLines: [ruler, ...crossLines] };

            crossLineClick = vi.fn();
            chart = await createChart({
                data: [
                    { date: X_MIN, value: 2 },
                    { date: new Date(Date.UTC(2024, 5, 1)), value: Y_MAX },
                    { date: X_MAX, value: Y_MIN },
                ],
                series: [{ type: 'line', xKey: 'date', yKey: 'value' }],
                listeners: { crossLineClick },
                axes: {
                    x: { position: 'bottom', type: 'time', nice: false, ...(direction === 'x' && withCrossLines) },
                    y: {
                        position: 'left',
                        type: 'number',
                        min: Y_MIN,
                        max: Y_MAX,
                        ...(direction === 'y' && withCrossLines),
                    },
                },
            });
        };

        /** Canvas points on the axis's min and max, read off the ruler rather than a cross line under test. */
        const axisExtremePoints = (direction: 'x' | 'y') => {
            const axis = chart.axes.findById(direction)!;
            const ruler = (getCrossLinesPlugin(axis)?.getInstances() ?? []).find(({ id }) => id === RULER);
            expect(ruler).toBeDefined();

            const box = Transformable.toCanvas(ruler!.rangeGroup);
            expect(box.width * box.height).toBeGreaterThan(0);

            // Nudged inside the series area so the click registers; a cross line drawn on the edge is
            // still within the cross-line hit tolerance of these points.
            const inset = 2;
            const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
            return direction === 'x'
                ? { min: { x: box.x + inset, y: centre.y }, max: { x: box.x + box.width - inset, y: centre.y } }
                : { min: { x: centre.x, y: box.y + box.height - inset }, max: { x: centre.x, y: box.y + inset } };
        };

        /** The ids of every cross line the click reported hitting, as the public event lists them. */
        const clickAxisExtreme = async (direction: 'x' | 'y', extreme: 'min' | 'max') => {
            const { x, y } = axisExtremePoints(direction)[extreme];
            await clickAction(x, y)(chart);

            expect(crossLineClick).toHaveBeenCalled();
            const [event] = crossLineClick.mock.lastCall as [AgCrossLineClickEvent];
            return event.allMatchedParams
                .filter((params): params is AgCrossLineClickParams => params.type === 'crossLineClick')
                .map(({ crossLineId }) => crossLineId)
                .sort((a, b) => a.localeCompare(b));
        };

        it('reports a line cross line on the time axis min', async () => {
            await createExtremesChart('x', [{ id: 'first', type: 'line', value: X_MIN, strokeWidth: 1 }]);

            expect(await clickAxisExtreme('x', 'min')).toEqual(['first', RULER]);
        });

        it('reports a line cross line on the time axis max', async () => {
            await createExtremesChart('x', [{ id: 'last', type: 'line', value: X_MAX, strokeWidth: 1 }]);

            expect(await clickAxisExtreme('x', 'max')).toEqual(['last', RULER]);
        });

        it('reports a line cross line on the number axis min', async () => {
            await createExtremesChart('y', [{ id: 'floor', type: 'line', value: Y_MIN, strokeWidth: 1 }]);

            expect(await clickAxisExtreme('y', 'min')).toEqual(['floor', RULER]);
        });

        it('reports a line cross line on the number axis max', async () => {
            await createExtremesChart('y', [{ id: 'ceiling', type: 'line', value: Y_MAX, strokeWidth: 1 }]);

            expect(await clickAxisExtreme('y', 'max')).toEqual(['ceiling', RULER]);
        });

        it('reports nothing for a line cross line before the time axis min', async () => {
            await createExtremesChart('x', [{ id: 'before-first', type: 'line', value: BEFORE_X_MIN, strokeWidth: 1 }]);

            expect(await clickAxisExtreme('x', 'min')).toEqual([RULER]);
        });

        it('reports nothing for a line cross line after the time axis max', async () => {
            await createExtremesChart('x', [{ id: 'after-last', type: 'line', value: AFTER_X_MAX, strokeWidth: 1 }]);

            expect(await clickAxisExtreme('x', 'max')).toEqual([RULER]);
        });

        it('reports nothing for a line cross line below the number axis min', async () => {
            await createExtremesChart('y', [{ id: 'below-floor', type: 'line', value: Y_MIN - 1, strokeWidth: 1 }]);

            expect(await clickAxisExtreme('y', 'min')).toEqual([RULER]);
        });

        it('reports nothing for a line cross line above the number axis max', async () => {
            await createExtremesChart('y', [{ id: 'above-ceiling', type: 'line', value: Y_MAX + 1, strokeWidth: 1 }]);

            expect(await clickAxisExtreme('y', 'max')).toEqual([RULER]);
        });

        it('reports a range cross line that starts on the number axis min', async () => {
            await createExtremesChart('y', [{ id: 'from-floor', type: 'range', range: [Y_MIN, 3] }]);

            expect(await clickAxisExtreme('y', 'min')).toEqual(['from-floor', RULER]);
        });

        it('reports nothing for a range cross line that only reaches the number axis min', async () => {
            await createExtremesChart('y', [{ id: 'up-to-floor', type: 'range', range: [Y_MIN - 1, Y_MIN] }]);

            expect(await clickAxisExtreme('y', 'min')).toEqual([RULER]);
        });
    });
});

function crossLineInstancesOf(chart: Chart, axisId: string) {
    const axis = chart.axes.findById(axisId);
    const plugin = axis ? getCrossLinesPlugin(axis) : undefined;
    return plugin?.getInstances() ?? [];
}

describe('CrossLine theme colour references', () => {
    setupMockConsole();
    setupMockCanvas();

    const PARAMS = { foregroundColor: '#ff0000', backgroundColor: '#00ff00', fontFamily: 'Verdana, sans-serif' };

    let chart: Chart;

    afterEach(() => {
        if (chart != null) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const chartOptions = (
        crossLines: AgCartesianCrossLineOptions[],
        theme?: AgCartesianChartOptions['theme']
    ): AgCartesianChartOptions => ({
        data: [
            { x: 'a', y: 1 },
            { x: 'b', y: 3 },
        ],
        series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
        axes: {
            x: { type: 'category' },
            y: { type: 'number', min: 0, max: 4, crossLines },
        },
        theme: theme ?? { params: PARAMS },
    });

    it('resolves a plain param reference on a range fill', async () => {
        chart = await createChart(chartOptions([{ type: 'range', range: [1, 3], fill: { ref: 'foregroundColor' } }]));

        expect(crossLineInstancesOf(chart, 'y').map((c) => c.fill)).toEqual(['#ff0000']);
    });

    it('resolves a reference blended onto another param', async () => {
        chart = await createChart(
            chartOptions([
                { type: 'range', range: [1, 3], fill: { ref: 'foregroundColor', mix: 0.2, onto: 'backgroundColor' } },
            ])
        );

        expect(crossLineInstancesOf(chart, 'y').map((c) => c.fill)).toEqual(['#33cc00']);
    });

    it('resolves a reference blended onto a literal colour', async () => {
        chart = await createChart(
            chartOptions([
                { type: 'range', range: [1, 3], fill: { ref: 'foregroundColor', mix: 0.25, ontoColor: '#00ff00' } },
            ])
        );

        expect(crossLineInstancesOf(chart, 'y').map((c) => c.fill)).toEqual(['#40bf00']);
    });

    it('resolves references on the stroke of both cross line variants', async () => {
        chart = await createChart(
            chartOptions([
                { type: 'range', range: [1, 3], stroke: { ref: 'backgroundColor' } },
                { type: 'line', value: 2, stroke: { ref: 'foregroundColor', mix: 0.5 } },
            ])
        );

        expect(crossLineInstancesOf(chart, 'y').map((c) => c.stroke)).toEqual(['#00ff00', 'rgba(255, 0, 0, 0.5)']);
    });

    it('resolves a reference supplied through a theme override', async () => {
        chart = await createChart(
            chartOptions([{ type: 'range', range: [1, 3] }], {
                params: PARAMS,
                overrides: { common: { axes: { number: { crossLines: { fill: { ref: 'foregroundColor' } } } } } },
            })
        );

        expect(crossLineInstancesOf(chart, 'y').map((c) => c.fill)).toEqual(['#ff0000']);
    });

    it('re-resolves the fill when the referenced param changes', async () => {
        const crossLines: AgCartesianCrossLineOptions[] = [
            { type: 'range', range: [1, 3], fill: { ref: 'foregroundColor' } },
        ];
        chart = await createChart(chartOptions(crossLines));

        expect(crossLineInstancesOf(chart, 'y').map((c) => c.fill)).toEqual(['#ff0000']);

        await chart.publicApi!.update(
            prepareTestOptions(chartOptions(crossLines, { params: { ...PARAMS, foregroundColor: '#0000ff' } }))
        );
        await waitForChartStability(chart);

        expect(crossLineInstancesOf(chart, 'y').map((c) => c.fill)).toEqual(['#0000ff']);
    });

    it('ignores malformed reference members and still resolves the reference', async () => {
        chart = await createChart(
            chartOptions([
                {
                    type: 'range',
                    range: [1, 3],
                    fill: { ref: 'foregroundColor', mix: 'backgroundColor', ratio: 0.2 },
                } as unknown as AgCartesianCrossLineOptions,
            ])
        );

        expectWarningMessages([
            'AG Charts - Option `axes.y.crossLines[0][type=range].fill.mix` cannot be set to `"backgroundColor"`; expecting a number greater than or equal to 0, ignoring.',
            'AG Charts - Unknown option `axes.y.crossLines[0][type=range].fill.ratio`, ignoring.',
        ]);
        expect(crossLineInstancesOf(chart, 'y').map((c) => c.fill)).toEqual(['#ff0000']);
    });
});

describe('CrossLine theme overrides', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;

    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
    });

    it('styles only the axes that have cross lines', async () => {
        chart = await createChart({
            data: [
                { x: 1, y: 1 },
                { x: 2, y: 2 },
            ],
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            axes: {
                x: { type: 'number', position: 'bottom' },
                y: { type: 'number', position: 'left', crossLines: [{ type: 'line', value: 1 }] },
            },
            theme: { overrides: { common: { axes: { number: { crossLines: { label: { color: 'red' } } } } } } },
        });

        expect(crossLineInstancesOf(chart, 'x')).toHaveLength(0);
        expect(crossLineInstancesOf(chart, 'y').map((c) => c.label.color)).toEqual(['red']);
    });

    const typedChart = (
        crossLines: AgCartesianCrossLineOptions[],
        crossLineOverrides: object,
        namespace: 'common' | 'line' = 'common'
    ): AgCartesianChartOptions => ({
        data: [
            { x: 1, y: 1 },
            { x: 2, y: 3 },
        ],
        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
        axes: {
            x: { type: 'number', position: 'bottom' },
            y: { type: 'number', position: 'left', min: 0, max: 4, crossLines },
        },
        theme: { overrides: { [namespace]: { axes: { number: { crossLines: crossLineOverrides } } } } },
    });

    const LINE_AND_RANGE: AgCartesianCrossLineOptions[] = [
        { type: 'line', value: 2 },
        { type: 'range', range: [1, 3] },
    ];

    it('styles each cross line by its type ahead of the shared options', async () => {
        chart = await createChart(
            typedChart(LINE_AND_RANGE, {
                stroke: 'red',
                strokeWidth: 3,
                line: { stroke: 'blue' },
                range: { stroke: 'green', fill: 'yellow' },
            })
        );

        const instances = crossLineInstancesOf(chart, 'y');
        expect(instances.map((c) => c.stroke)).toEqual(['blue', 'green']);
        expect(instances.map((c) => c.strokeWidth)).toEqual([3, 3]);
        expect(instances[1].fill).toBe('yellow');
    });

    it('lets the options of a cross line beat its type', async () => {
        chart = await createChart(
            typedChart([{ type: 'range', range: [1, 3], stroke: 'black' }], { range: { stroke: 'green' } })
        );

        expect(crossLineInstancesOf(chart, 'y').map((c) => c.stroke)).toEqual(['black']);
    });

    it('styles by type from the series-type namespace', async () => {
        chart = await createChart(typedChart(LINE_AND_RANGE, { line: { strokeWidth: 5 } }, 'line'));

        expect(crossLineInstancesOf(chart, 'y').map((c) => c.strokeWidth)).toEqual([5, 1]);
    });

    it('merges the label options of a type with the shared label options', async () => {
        chart = await createChart(
            typedChart(LINE_AND_RANGE, { label: { fontSize: 20, color: 'red' }, range: { label: { color: 'blue' } } })
        );

        const labels = crossLineInstancesOf(chart, 'y').map((c) => c.label);
        expect(labels.map((l) => l.color)).toEqual(['red', 'blue']);
        expect(labels.map((l) => l.fontSize)).toEqual([20, 20]);
    });

    it('lets a type in either namespace beat the shared options of both', async () => {
        chart = await createChart({
            ...typedChart(LINE_AND_RANGE, {}),
            theme: {
                overrides: {
                    common: { axes: { number: { crossLines: { line: { stroke: 'blue' } } } } },
                    line: { axes: { number: { crossLines: { stroke: 'red', range: { stroke: 'green' } } } } },
                },
            },
        });

        expect(crossLineInstancesOf(chart, 'y').map((c) => c.stroke)).toEqual(['blue', 'green']);
    });

    it('styles by every cross line type', () => {
        const types: Record<AgCartesianCrossLineOptions['type'], true> = { line: true, range: true };

        expect(new Set(CROSS_LINE_TYPES)).toEqual(new Set(Object.keys(types)));
    });

    it('rejects a fill on line cross lines', async () => {
        chart = await createChart(typedChart(LINE_AND_RANGE, { line: { fill: 'red' } }));

        expectWarningMessages([
            'AG Charts - Unknown option `theme.overrides.common.axes.number.crossLines.line.fill`; Did you mean `stroke`? Ignoring.',
        ]);
        expect(crossLineInstancesOf(chart, 'y')[0].fill).not.toBe('red');
    });

    it.each([
        ['the shared options', { label: { maxWidth: 40 } }, 'common'],
        ['the shared options of the series type', { label: { maxWidth: 40 } }, 'line'],
        ['the options of a type', { line: { label: { maxWidth: 40 } }, range: { label: { maxWidth: 40 } } }, 'common'],
    ] as const)('fits a label bounded through %s', async (_, overrides, namespace) => {
        chart = await createChart(typedChart(LINE_AND_RANGE, overrides, namespace));

        const labels = crossLineInstancesOf(chart, 'y').map((c) => c.label);
        expect(labels.map((l) => [l.maxWidth, l.wrapping, l.truncate])).toEqual([
            [40, 'on-space', true],
            [40, 'on-space', true],
        ]);
    });
});

describe('CrossLine label fitting', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: Chart;

    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
    });

    const LONG_TEXT = 'A cross line label long enough to need fitting';

    function fitChart(
        crossLine: AgCartesianCrossLineOptions,
        axisId: 'x' | 'y' = 'y',
        theme?: AgCartesianChartOptions['theme']
    ): AgCartesianChartOptions {
        return prepareTestOptions({
            data: Array.from({ length: 11 }, (_, i) => ({ x: i, y: i })),
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            axes: {
                x: { type: 'number', position: 'bottom', crossLines: axisId === 'x' ? [crossLine] : [] },
                y: { type: 'number', position: 'left', crossLines: axisId === 'y' ? [crossLine] : [] },
            },
            theme,
        });
    }

    const lineWith = (label: AgCartesianCrossLineLabelOptions): AgCartesianCrossLineOptions => ({
        type: 'line',
        value: 5,
        label: { text: LONG_TEXT, ...label },
    });

    function renderedLabel(axisId: 'x' | 'y' = 'y') {
        const [crossLine] = crossLineInstancesOf(chart, axisId);
        const [node] = crossLine.labelGroup.children() as any;
        const { width, height } = node.getBBox();
        return {
            text: node.text as string,
            fontSize: node.fontSize as number,
            width: width as number,
            height: height as number,
            footprint: Transformable.toCanvas(crossLine.labelGroup),
            crossLine,
        };
    }

    it.each([
        ['nothing', {}],
        ['an array placement', { placement: ['left', 'right'] }],
    ] as const)('renders the label whole with %s set', async (_, label) => {
        chart = await createChart(fitChart(lineWith(label as AgCartesianCrossLineLabelOptions)));

        const rendered = renderedLabel();
        expect(rendered.text).toBe(LONG_TEXT);
        expect(rendered.fontSize).toBe(12);
    });

    it.each([
        ['line', 'y', lineWith({ maxWidth: 80 })],
        ['range', 'x', { type: 'range', range: [2, 4], label: { text: LONG_TEXT, maxWidth: 80 } }],
    ] as const)('wraps a %s label within maxWidth', async (_, axisId, crossLine) => {
        chart = await createChart(fitChart(crossLine as AgCartesianCrossLineOptions, axisId));

        const rendered = renderedLabel(axisId);
        expect(rendered.text.split('\n').length).toBeGreaterThan(1);
        expect(rendered.text.replaceAll('\n', ' ')).toBe(LONG_TEXT);
        expect(rendered.width).toBeLessThanOrEqual(80);
    });

    it.each(['always', 'hyphenate', 'on-space', 'never'] as const)(
        'keeps a label wrapped %s within maxWidth',
        async (wrapping) => {
            chart = await createChart(fitChart(lineWith({ maxWidth: 80, wrapping })));

            const rendered = renderedLabel();
            expect(rendered.width).toBeLessThanOrEqual(80);
            expect(rendered.text.includes('\n')).toBe(wrapping !== 'never');
        }
    );

    it.each([
        ['maxWidth', { maxWidth: 80, wrapping: 'never' }],
        ['maxHeight', { maxWidth: 80, maxHeight: 20 }],
    ] as const)('ellipsises a label bounded by %s', async (_, label: AgCartesianCrossLineLabelOptions) => {
        chart = await createChart(fitChart(lineWith({ ...label, truncate: true })));

        const rendered = renderedLabel();
        expect(rendered.text.endsWith('…')).toBe(true);
        expect(rendered.width).toBeLessThanOrEqual(80);
        expect(rendered.height).toBeLessThanOrEqual(label.maxHeight ?? Infinity);
    });

    it('lets a label that does not fit overflow when truncate is disabled', async () => {
        chart = await createChart(fitChart(lineWith({ maxWidth: 80, wrapping: 'never', truncate: false })));

        const rendered = renderedLabel();
        expect(rendered.text).toBe(LONG_TEXT);
        expect(rendered.width).toBeGreaterThan(80);
    });

    it('shrinks a label towards minimumFontSize before truncating it', async () => {
        const text = 'Target value';
        const label = { text, fontSize: 20, wrapping: 'never', minimumFontSize: 8 } as const;
        chart = await createChart(fitChart(lineWith({ ...label, maxWidth: 1e3 })));
        const fullWidth = renderedLabel().width;
        chart.destroy();

        chart = await createChart(fitChart(lineWith({ ...label, maxWidth: fullWidth * 0.75 })));
        const shrunk = renderedLabel();
        expect(shrunk.text).toBe(text);
        expect(shrunk.fontSize).toBeLessThan(20);
        expect(shrunk.fontSize).toBeGreaterThanOrEqual(8);
        chart.destroy();

        chart = await createChart(fitChart(lineWith({ ...label, maxWidth: fullWidth * 0.2 })));
        const truncated = renderedLabel();
        expect(truncated.fontSize).toBe(8);
        expect(truncated.text.endsWith('…')).toBe(true);
    });

    it('bounds the label before rotating it', async () => {
        chart = await createChart(fitChart(lineWith({ maxWidth: 80, rotation: 90, padding: 0 }), 'x'));

        const rendered = renderedLabel('x');
        expect(rendered.text.includes('\n')).toBe(true);
        expect(rendered.footprint.height).toBeLessThanOrEqual(80 + 1);
    });

    it('pads the chart for the fitted label', async () => {
        const options = (label: AgCartesianCrossLineLabelOptions) =>
            fitChart(lineWith({ placement: 'left', ...label }));
        chart = await createChart(options({}));
        const unfittedWidth = chart.seriesRect!.width;
        chart.destroy();

        chart = await createChart(options({ maxWidth: 80 }));

        const into: Partial<Record<AgCrossLineLabelPosition, number>> = {};
        renderedLabel().crossLine.calculatePadding!(into);
        expect(chart.seriesRect!.width).toBeGreaterThan(unfittedWidth);
        expect(into.left).toBeLessThanOrEqual(80 + 10);
    });

    it('refits the label once a web font loads', async () => {
        chart = await createChart(fitChart(lineWith({ maxWidth: 80 })));
        const { crossLine } = renderedLabel();
        const fittedBeforeLoad = (crossLine as any).fitted;

        cachedTextMeasurer.clear();
        chart.ctx.eventsHub.emit('font:load', null);
        await waitForChartStability(chart);

        expect((crossLine as any).fitted).not.toBe(fittedBeforeLoad);
    });

    it('ellipsises a wrapped clip-text label once, within the chart', async () => {
        const label = undocumentedLabel({
            text: `${LONG_TEXT} ${LONG_TEXT}`,
            placement: 'left',
            overflow: 'clip-text',
            maxWidth: 2000,
            wrapping: 'always',
        });
        chart = await createChart({ ...fitChart(lineWith(label)), width: 300, height: 300 });

        const rendered = renderedLabel();
        expect(rendered.text.split('…')).toHaveLength(2);
        expect(rendered.text.endsWith('…')).toBe(true);
        expect(rendered.footprint.x).toBeGreaterThanOrEqual(0);
    });

    it('moves a fitted range label out of its band once the band is too narrow for it', async () => {
        const options = (max: number) => {
            const base = fitChart(
                {
                    type: 'range',
                    range: [4, 5],
                    label: { text: 'Target band', maxWidth: 60, placement: ['inside-top', 'top'] },
                },
                'x'
            );
            return { ...base, axes: { ...base.axes, x: { ...(base.axes as any).x, min: 3, max } } };
        };
        const labelInsideBand = () => {
            const { crossLine, footprint } = renderedLabel('x');
            const band = Transformable.toCanvas(crossLine.rangeGroup);
            return footprint.y >= band.y;
        };

        chart = await createChart(options(6));
        const zoomedIn = renderedLabel('x').text;
        expect(labelInsideBand()).toBe(true);

        await chart.publicApi!.update(options(100));
        await waitForChartStability(chart);
        expect(labelInsideBand()).toBe(false);
        expect(renderedLabel('x').text).toBe(zoomedIn);
    });

    it.each(['number', 'log', 'category', 'time', 'unit-time', 'grouped-category'] as const)(
        'fits a label bounded through a %s axis theme override',
        async (axisType) => {
            const isCategory = axisType === 'category' || axisType === 'grouped-category';
            const isTime = axisType === 'time' || axisType === 'unit-time';
            const xValue = (i: number) => {
                if (isCategory) return `C${i}`;
                if (isTime) return new Date(Date.UTC(2024, 0, i + 1));
                return i + 1;
            };
            const value = xValue(2);
            chart = await createChart(
                prepareTestOptions({
                    data: Array.from({ length: 5 }, (_, i) => ({ x: xValue(i), y: i })),
                    series: [{ type: axisType === 'log' ? 'line' : 'bar', xKey: 'x', yKey: 'y' } as any],
                    axes: {
                        x: { type: axisType, position: 'bottom', crossLines: [{ type: 'line', value }] } as any,
                        y: { type: 'number', position: 'left' },
                    },
                    theme: {
                        overrides: {
                            common: {
                                axes: { [axisType]: { crossLines: { label: { text: LONG_TEXT, maxWidth: 40 } } } },
                            },
                        },
                    },
                })
            );

            const rendered = renderedLabel('x');
            expect(rendered.text.includes('\n')).toBe(true);
            expect(rendered.width).toBeLessThanOrEqual(40);
        }
    );

    describe('minimumFontSize validation', () => {
        const MINIMUM_FONT_SIZE_WARNING =
            'AG Charts - Option `axes.y.crossLines[0][type=line].label.minimumFontSize` cannot be set to `14`; expecting a number greater than 0 and the value to be less than or equal to `fontSize`, ignoring.';

        it('warns when minimumFontSize exceeds the label fontSize', async () => {
            chart = await createChart(fitChart(lineWith({ fontSize: 10, minimumFontSize: 14, maxWidth: 80 })));

            expectWarningMessages([MINIMUM_FONT_SIZE_WARNING]);
        });

        it('warns when minimumFontSize exceeds the themed fontSize', async () => {
            chart = await createChart(fitChart(lineWith({ minimumFontSize: 14, maxWidth: 80 })));

            expectWarningMessages([MINIMUM_FONT_SIZE_WARNING]);
        });

        it('accepts a minimumFontSize below a themed fontSize', async () => {
            const theme = { overrides: { common: { axes: { number: { crossLines: { label: { fontSize: 30 } } } } } } };
            chart = await createChart(fitChart(lineWith({ minimumFontSize: 20, maxWidth: 80 }), 'y', theme));

            expect(renderedLabel().fontSize).toBeLessThanOrEqual(30);
        });
    });

    it('renders fitted labels', async () => {
        const base = fitChart(lineWith({}));
        chart = await createChart({
            ...base,
            axes: {
                x: {
                    type: 'number',
                    position: 'bottom',
                    crossLines: [
                        {
                            type: 'range',
                            range: [1, 3],
                            label: { text: LONG_TEXT, maxWidth: 70, placement: 'inside-top' },
                        },
                        {
                            type: 'line',
                            value: 7,
                            label: {
                                text: LONG_TEXT,
                                maxWidth: 90,
                                rotation: 90,
                                fill: 'lightyellow',
                                placement: 'left',
                            },
                        },
                    ],
                },
                y: {
                    type: 'number',
                    position: 'left',
                    crossLines: [
                        { type: 'line', value: 8, label: { text: LONG_TEXT, maxWidth: 90, wrapping: 'never' } },
                        {
                            type: 'line',
                            value: 4,
                            label: { text: LONG_TEXT, fontSize: 16, maxWidth: 120, maxHeight: 24, minimumFontSize: 9 },
                        },
                    ],
                },
            },
        });

        await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
    });
});
