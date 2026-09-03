import { afterEach, describe, it, vi } from 'vitest';

import { type CrossLineLabelOverflow, mapValues } from 'ag-charts-core';
import type {
    AgCartesianChartOptions,
    AgCartesianCrossLineLabelOptions,
    AgCartesianCrossLineOptions,
    AgCrossLineClickEvent,
    AgCrossLineLabelPosition,
    AgCrossLineListeners,
} from 'ag-charts-types';

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
    doubleClickAction,
    expectWarningMessages,
    repeat,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';
import { CartesianCrossLine } from './cartesianCrossLine';
import type { CrossLineType } from './crossLine';
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
                chart = await createChart({ ...example.options });
                await example.assertions(chart);
            }
        );

        it.each(Object.entries(EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                chart = await createChart({ ...example.options });
                await compare();
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
                                    label: { text: labelText, position: 'top' },
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
                                    label: { text: labelText, position: 'right' },
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

        describe('overlapping crosslines allClickParams', () => {
            let chartClick: ViFn;
            let chartCrossLineClick: ViFn;
            let chartSeriesNodeClick: ViFn;
            let seriesSeriesNodeClick: ViFn;
            beforeEach(async () => {
                chartClick = vi.fn();
                chartCrossLineClick = vi.fn();
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
                        allClickParams: [
                            expect.objectContaining({
                                clickedOn: 'cross-line',
                                crossLineId: 'blue-line',
                                axisId: 'myX',
                                direction: 'x',
                                value: 'May',
                            }),
                            expect.objectContaining({
                                clickedOn: 'cross-line',
                                crossLineId: 'grey-range',
                                axisId: 'myX',
                                direction: 'x',
                                range: ['Mar', 'Jul'],
                            }),
                            expect.objectContaining({
                                clickedOn: 'cross-line',
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
            test('AC4i: a cross-line win reports the series node it covers', async () => {
                // The May bar sits under the blue line and inside the grey range band.
                await clickAction(505, 470)(chart);
                expect(chartCrossLineClick).toHaveBeenCalledWith(
                    expect.objectContaining({
                        // The cross line still wins the event, so it carries the root params.
                        clickedOn: 'cross-line',
                        crossLineId: 'blue-line',
                        allClickParams: [
                            expect.objectContaining({
                                clickedOn: 'cross-line',
                                crossLineId: 'blue-line',
                                value: 'May',
                            }),
                            expect.objectContaining({
                                clickedOn: 'cross-line',
                                crossLineId: 'grey-range',
                                range: ['Mar', 'Jul'],
                            }),
                            expect.objectContaining({
                                clickedOn: 'series-node',
                                datum: { x: 'May', y: 3 },
                            }),
                        ],
                    })
                );
                // One event, not two: the series-node listeners stay silent as before.
                expect(chartCrossLineClick).toHaveBeenCalledTimes(1);
                expect(chartClick).toHaveBeenCalledTimes(0);
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
                    clickedOn: 'series-node',
                    datum: { x: 'May', y: 3 },
                    allClickParams: [
                        expect.objectContaining({
                            clickedOn: 'series-node',
                            datum: { x: 'May', y: 3 },
                        }),
                        expect.objectContaining({
                            clickedOn: 'cross-line',
                            crossLineId: 'blue-line',
                            value: 'May',
                        }),
                        expect.objectContaining({
                            clickedOn: 'cross-line',
                            crossLineId: 'grey-range',
                            range: ['Mar', 'Jul'],
                        }),
                    ],
                });
                expect(seriesSeriesNodeClick).toHaveBeenCalledWith(expected);
                expect(chartSeriesNodeClick).toHaveBeenCalledWith(expected);
            });
            test('AC4ii: a series-node click clear of any cross line reports only itself', async () => {
                await clickAction(140, 255)(chart);
                const expected = expect.objectContaining({
                    clickedOn: 'series-node',
                    datum: { x: 'Jan', y: 8 },
                    allClickParams: [expect.objectContaining({ clickedOn: 'series-node', datum: { x: 'Jan', y: 8 } })],
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

    describe('AG-7486: label overflow', () => {
        const outsidePositions: AgCrossLineLabelPosition[] = labelPositions.filter((p) => !p.startsWith('inside'));

        function crossLineWith(
            overflow: CrossLineLabelOverflow,
            position: AgCrossLineLabelPosition,
            type: CrossLineType
        ) {
            const crossLine = new CartesianCrossLine();
            crossLine.type = type;
            crossLine.position = 'bottom';
            crossLine.label.set({ enabled: true, text: 'A long enough label', overflow, position });
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
            const crossLine = new CartesianCrossLine();
            crossLine.type = 'line';
            crossLine.position = 'bottom';
            crossLine.label.set({ enabled: true, text: 'A long enough label', position: 'top' });

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
                                  label: { ...c.label, text: 'A long enough label', position: 'top', overflow },
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
            // `position: 'left'` on the left-hand axis pads horizontally, so a very wide label is what
            // outgrows the space available.
            const veryLongLabel = 'A'.repeat(400);
            const { x, y } = examples.LINE_CROSSLINES.axes as any;

            chart = await createChart({
                ...examples.LINE_CROSSLINES,
                axes: {
                    x,
                    y: {
                        ...y,
                        crossLines: [{ type: 'line', value: 0.87, label: { text: veryLongLabel, position: 'left' } }],
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
                                label: undocumentedLabel({ text: veryLongLabel, position: 'left', overflow }),
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
                                    position: 'top',
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
                                    position: 'top',
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
                                    position: 'bottom',
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
                                    position: 'left',
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
                                    position: 'right',
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
                                label: undocumentedLabel({ position: 'inside', ...label, reserveSpace }),
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

            expect(plugin.getLabelObstacles(BBox.zero)).toHaveLength(1);

            const version = plugin.nodeDataVersion;
            plugin.setVisible(false);

            expect(plugin.getLabelObstacles(BBox.zero)).toBeUndefined();
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
                                    position: 'inside-top',
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
                                    position: 'inside',
                                    reserveSpace,
                                }),
                            },
                            {
                                type: 'line',
                                value: 80,
                                stroke: 'blue',
                                strokeWidth: 1,
                                label: { text: 'NEVER RESERVED', fontSize: 24, position: 'inside' },
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
            return event.allClickParams
                .filter((params) => params.clickedOn === 'cross-line')
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
