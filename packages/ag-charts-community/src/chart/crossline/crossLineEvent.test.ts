import { afterEach, describe, expect, vi } from 'vitest';

import type { AgCartesianChartOptions, AgCrossLineClickEvent, AgCrossLineListeners } from 'ag-charts-types';

import { Transformable } from '../../scene/transformable';
import type { Chart } from '../chart';
import {
    clickAction,
    createChart,
    doubleClickAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';
import { getCrossLinesPlugin } from './getCrossLinesPlugin';

// A cross line spanning the whole y domain covers the entire series area, so a click at the centre of
// the canvas is guaranteed to land on it without depending on the resolved axis layout.
const FULL_RANGE: [number, number] = [0, 10];

const CENTRE_X = 400;
const CENTRE_Y = 300;

function options(overrides: Partial<AgCartesianChartOptions> = {}): AgCartesianChartOptions {
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

describe('CrossLine listeners', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    describe('cross-line level listeners', () => {
        test('AC1: clicking a cross line fires `click` with the cross-line params', async () => {
            const click = vi.fn();
            chart = await createChart(
                options({
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
                options({
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
                options({
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
                options({
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
                options({
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
                options({
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

        test('clicking outside every cross line fires nothing', async () => {
            const click = vi.fn();
            chart = await createChart(
                options({
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
                options({
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
                options({
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
                options({
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
                options({
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
                options({
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
                options({
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
});
