import { afterEach, describe, expect, it } from 'vitest';

import type {
    AgAnnotationMagnet,
    AgAnnotationsOptions,
    AgCartesianChartOptions,
    AgChartInstance,
} from 'ag-charts-community';
import {
    clickAction,
    dragAction,
    getSeriesRect,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { AgHorizontalLineAnnotation, AgLineAnnotation } from 'ag-charts-types';

import {
    getAnnotationMagnetEnabled,
    pressAnnotationMagnetButton,
    pressAnnotationToolbarCreate,
} from '../../test/featureAccessors';
import { ANNOTATIONS_EXAMPLE_OPTIONS, createAnnotationsChart } from './test/fixture';

// The middle datum of the example, whose value is neither the lowest nor the highest of its series.
const [, MIDDLE_DATUM] = ANNOTATIONS_EXAMPLE_OPTIONS.data as { x: Date; y: number }[];
const DATUM_X = MIDDLE_DATUM.x.getTime();
const DATUM_Y = MIDDLE_DATUM.y;
const LAST_X = new Date('2024-12-25').getTime();
const [X_MIN, X_MAX] = [new Date('2024-01-01').getTime(), new Date('2024-12-31').getTime()];

describe('Annotations magnet', () => {
    setupMockConsole();
    setupMockCanvas();
    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
    });

    async function prepareChart(magnet?: AgAnnotationMagnet, overrides: Partial<AgCartesianChartOptions> = {}) {
        const annotations: AgAnnotationsOptions = { ...ANNOTATIONS_EXAMPLE_OPTIONS.annotations, magnet };
        const options = {
            ...ANNOTATIONS_EXAMPLE_OPTIONS,
            axes: {
                x: { type: 'time', min: new Date(X_MIN), max: new Date(X_MAX), nice: false },
                y: { type: 'number', min: 0, max: 100, nice: false },
            },
            annotations,
            ...overrides,
        } as AgCartesianChartOptions;
        chart = await createAnnotationsChart(options);
    }

    /** The position in the canvas of a time and a value of the axes of the chart. */
    function canvasPoint(time: number, value: number) {
        const { x, y, width, height } = getSeriesRect(chart);
        return { x: x + (width * (time - X_MIN)) / (X_MAX - X_MIN), y: y + height * (1 - value / 100) };
    }

    /** Draws a horizontal line by clicking at `value`, and returns the value it ends up with. */
    async function drawHorizontalLineAt(value: number, modifiers?: { ctrlKey?: boolean }) {
        pressAnnotationToolbarCreate(chart, 'horizontal-line');
        await waitForChartStability(chart);

        const { x, y } = canvasPoint(DATUM_X, value);
        await hoverAction(x, y, modifiers)(chart);
        await clickAction(x, y, modifiers)(chart);
        await waitForChartStability(chart);

        const { annotations = [] } = chart.getState();
        expect(annotations).toHaveLength(1);
        return (annotations[0] as AgHorizontalLineAnnotation).value;
    }

    /** Draws a horizontal line by clicking `pixelsAbove` pixels above the datum, and returns where it ends up. */
    async function drawHorizontalLine(pixelsAbove: number, modifiers?: { ctrlKey?: boolean }) {
        const { height } = getSeriesRect(chart);
        const value = await drawHorizontalLineAt(valueAbove(pixelsAbove, height), modifiers);
        return { value, height };
    }

    /** The y value that is `pixels` above the datum. */
    const valueAbove = (pixels: number, height: number) => DATUM_Y + (pixels * 100) / height;

    it('leaves the line where it is drawn when the magnet is not enabled', async () => {
        await prepareChart();
        const { value, height } = await drawHorizontalLine(30);
        expect(value).toBeCloseTo(valueAbove(30, height), 0);
    });

    it('snaps the line to the nearest value from any distance when strong', async () => {
        await prepareChart({ enabled: true, mode: 'strong' });
        const { value } = await drawHorizontalLine(60);
        expect(value).toBeCloseTo(DATUM_Y, 6);
    });

    it.each([
        { name: 'within', pixels: 8, snaps: true },
        { name: 'beyond', pixels: 14, snaps: false },
    ])('snaps a weak magnet only when the pointer is $name its range', async ({ pixels, snaps }) => {
        await prepareChart({ enabled: true, mode: 'weak', range: 10 });
        const { value, height } = await drawHorizontalLine(pixels);
        expect(value).toBeCloseTo(snaps ? DATUM_Y : valueAbove(pixels, height), snaps ? 6 : 0);
    });

    it('is switched on and off by the toolbar button', async () => {
        await prepareChart({ range: 20 });
        expect(getAnnotationMagnetEnabled(chart)).toBe(false);

        pressAnnotationMagnetButton(chart);
        expect(getAnnotationMagnetEnabled(chart)).toBe(true);
        expect((await drawHorizontalLine(10)).value).toBeCloseTo(DATUM_Y, 6);
    });

    it('inverts whether the magnet is enabled while Ctrl is held', async () => {
        await prepareChart({ range: 20 });
        const { value } = await drawHorizontalLine(10, { ctrlKey: true });
        expect(value).toBeCloseTo(DATUM_Y, 6);
    });

    describe('options', () => {
        it('keeps a toggle made with the toolbar button when other options change', async () => {
            await prepareChart({ enabled: false, mode: 'strong' });
            pressAnnotationMagnetButton(chart);
            expect(getAnnotationMagnetEnabled(chart)).toBe(true);

            await chart.updateDelta({ annotations: { magnet: { mode: 'weak' } } });
            await waitForChartStability(chart);
            expect(getAnnotationMagnetEnabled(chart)).toBe(true);
        });

        it('applies the enabled option again when it changes', async () => {
            await prepareChart({ enabled: true, mode: 'strong' });
            pressAnnotationMagnetButton(chart);
            expect(getAnnotationMagnetEnabled(chart)).toBe(false);

            await chart.updateDelta({ annotations: { magnet: { enabled: false } } });
            await waitForChartStability(chart);
            await chart.updateDelta({ annotations: { magnet: { enabled: true } } });
            await waitForChartStability(chart);
            expect(getAnnotationMagnetEnabled(chart)).toBe(true);
        });

        it('uses the mode and range it is updated to', async () => {
            await prepareChart({ enabled: true, mode: 'weak', range: 10 });
            await chart.updateDelta({ annotations: { magnet: { mode: 'strong' } } });
            await waitForChartStability(chart);
            expect((await drawHorizontalLine(60)).value).toBeCloseTo(DATUM_Y, 6);
        });
    });

    describe('series', () => {
        const middle = { x: MIDDLE_DATUM.x, open: 40, high: 70, low: 20, close: 55 };
        it.each([
            { type: 'line', series: { type: 'line', xKey: 'x', yKey: 'y' }, data: [MIDDLE_DATUM], expected: DATUM_Y },
            { type: 'bar', series: { type: 'bar', xKey: 'x', yKey: 'y' }, data: [MIDDLE_DATUM], expected: DATUM_Y },
            { type: 'area', series: { type: 'area', xKey: 'x', yKey: 'y' }, data: [MIDDLE_DATUM], expected: DATUM_Y },
            {
                type: 'candlestick',
                series: {
                    type: 'candlestick',
                    xKey: 'x',
                    openKey: 'open',
                    highKey: 'high',
                    lowKey: 'low',
                    closeKey: 'close',
                },
                data: [middle],
                expected: 70,
            },
        ] as const)('snaps to the value of a $type series', async ({ series, data, expected }) => {
            await prepareChart({ enabled: true, mode: 'strong' }, { series: [series], data: [...data] } as any);
            // Near the top of the chart, so that the nearest value is the highest of the datum.
            expect(await drawHorizontalLineAt(90)).toBeCloseTo(expected, 6);
        });

        it('ignores a hidden series', async () => {
            await prepareChart({ enabled: true, mode: 'strong' }, {
                series: [
                    { type: 'line', xKey: 'x', yKey: 'y' },
                    { type: 'line', xKey: 'x', yKey: 'hidden', visible: false },
                ],
                data: [{ ...MIDDLE_DATUM, hidden: 80 }],
            } as any);
            expect(await drawHorizontalLineAt(90)).toBeCloseTo(DATUM_Y, 6);
        });

        it('leaves the line where it is drawn when the nearest datum has no value', async () => {
            await prepareChart({ enabled: true, mode: 'strong' }, {
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                data: [{ ...MIDDLE_DATUM, y: null }],
            } as any);
            expect(await drawHorizontalLineAt(90)).toBeCloseTo(90, 0);
        });
    });

    describe('dragging', () => {
        const lineAt = (startValue: number, endValue: number): AgLineAnnotation => ({
            type: 'line',
            start: { x: DATUM_X, y: startValue },
            end: { x: LAST_X, y: endValue },
        });
        const getLine = () => (chart.getState().annotations ?? [])[0] as AgLineAnnotation;

        it('snaps the start of a line drawn by dragging', async () => {
            await prepareChart({ enabled: true, mode: 'strong' });
            pressAnnotationToolbarCreate(chart, 'line');
            await waitForChartStability(chart);

            // The test drag moves too quickly for the line to render between its events, so only its start is placed.
            await dragAction(canvasPoint(DATUM_X, 70), canvasPoint(LAST_X, 70))(chart);
            await waitForChartStability(chart);

            expect(getLine().start.y).toBeCloseTo(DATUM_Y, 6);
        });

        it.each([
            { name: 'is on', magnet: { enabled: true, mode: 'strong' }, snaps: true },
            { name: 'is off', magnet: { enabled: false, mode: 'strong' }, snaps: false },
        ] as const)('moves only the dragged end of a line when the magnet $name', async ({ magnet, snaps }) => {
            await prepareChart(magnet);
            await chart.setState({ ...chart.getState(), annotations: [lineAt(DATUM_Y, 30)] });
            await waitForChartStability(chart);

            const end = canvasPoint(LAST_X, 30);
            const target = canvasPoint(LAST_X, 80);
            await hoverAction(end.x, end.y)(chart);
            await dragAction(end, target)(chart);
            await waitForChartStability(chart);

            const line = getLine();
            expect(line.start.y).toBeCloseTo(DATUM_Y, 6);
            expect(line.end.y).toBeCloseTo(snaps ? 95 : 80, snaps ? 6 : 0);
        });
    });
});
