import { afterEach, describe, expect, it } from 'vitest';

import type { AgAnnotationMagnet, AgCartesianChartOptions, AgChartInstance } from 'ag-charts-community';
import {
    clickAction,
    deproxy,
    dragAction,
    getSeriesRect,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { getAnnotationMagnetEnabled, pressAnnotationToolbarCreate } from '../../test/featureAccessors';
import {
    ANNOTATIONS_EXAMPLE_OPTIONS,
    compareAnnotationsSnapshot,
    createAnnotationsChart,
    restoreAnnotations,
} from './test/fixture';

const [X_MIN, X_MID, X_MAX] = [new Date('2024-01-01'), new Date('2024-06-15'), new Date('2024-12-31')].map((d) =>
    d.getTime()
);
const [FIRST_X, LAST_X] = [new Date('2024-01-05').getTime(), new Date('2024-12-25').getTime()];

// The candlesticks either side of the middle one are well away from it, so that the nearest datum is clear.
const CANDLESTICKS = [
    { x: new Date(FIRST_X), open: 10, high: 25, low: 5, close: 20 },
    { x: new Date(X_MID), open: 40, high: 70, low: 20, close: 55 },
    { x: new Date(LAST_X), open: 80, high: 95, low: 75, close: 90 },
];

describe('Annotations magnet', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();
    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
    });

    async function prepareChart(magnet: AgAnnotationMagnet | undefined, overrides: Partial<AgCartesianChartOptions>) {
        chart = await createAnnotationsChart({
            ...ANNOTATIONS_EXAMPLE_OPTIONS,
            axes: {
                x: { type: 'time', min: new Date(X_MIN), max: new Date(X_MAX), nice: false },
                y: { type: 'number', min: 0, max: 100, nice: false },
            },
            ...overrides,
            annotations: { ...ANNOTATIONS_EXAMPLE_OPTIONS.annotations, magnet },
        } as AgCartesianChartOptions);
    }

    /** The position in the canvas of a time and a value of the axes of the chart, moved down by `pixelsBelow`. */
    function canvasPoint(time: number, value: number, pixelsBelow = 0, [min, max] = [0, 100]) {
        const { x, y, width, height } = getSeriesRect(chart);
        const canvasX = x + (width * (time - X_MIN)) / (X_MAX - X_MIN);
        return { x: canvasX, y: y + height * (1 - (value - min) / (max - min)) + pixelsBelow };
    }

    /** Draws an annotation by hovering and clicking at each position, or for a horizontal line by dragging from it. */
    async function draw(
        type: 'horizontal-line' | 'vertical-line' | 'line',
        positions: Array<{ x: number; y: number }>,
        how: 'click' | 'drag' = 'click',
        ctrlKey = false
    ) {
        pressAnnotationToolbarCreate(chart, type);
        await waitForChartStability(chart);

        if (how === 'drag') {
            const [position] = positions;
            await dragAction(position, { x: position.x + 20, y: position.y })(chart);
        } else {
            for (const { x, y } of positions) {
                await hoverAction(x, y, { ctrlKey })(chart);
                await clickAction(x, y, { ctrlKey })(chart);
            }
        }
        await waitForChartStability(chart);
    }

    const drawHorizontalLine = (position: { x: number; y: number }, how: 'click' | 'drag', ctrlKey = false) =>
        draw('horizontal-line', [position], how, ctrlKey);

    async function updateMagnet(magnet: AgAnnotationMagnet) {
        await chart.updateDelta({ annotations: { magnet } });
        await waitForChartStability(chart);
    }

    it('snaps the lines it draws to the nearest value of the nearest candlestick', async () => {
        await prepareChart(undefined, {
            data: CANDLESTICKS,
            series: [
                { type: 'candlestick', xKey: 'x', openKey: 'open', highKey: 'high', lowKey: 'low', closeKey: 'close' },
            ],
        });
        const at = (value: number, pixelsBelow?: number) => canvasPoint(X_MID, value, pixelsBelow);

        // Off, so the line stays where it is clicked: 30.
        await drawHorizontalLine(at(30), 'click');

        // Within 10 pixels, it snaps to the close, 55, from 6 pixels away but not to anything from 85, far above.
        await updateMagnet({ enabled: true, range: 10 });
        await drawHorizontalLine(at(55, 6), 'click');
        await drawHorizontalLine(at(85), 'click');

        // Nearest, it snaps to the high, 70, from the top of the chart, and to the low, 20, when drawn by dragging.
        await updateMagnet({ enabled: true, range: 'nearest' });
        await drawHorizontalLine(at(98), 'click');
        await drawHorizontalLine(at(2), 'drag');

        // Holding Ctrl while it is off inverts it, so it snaps to the open, 40, from 4 pixels away.
        await updateMagnet({ enabled: false, range: 10 });
        await drawHorizontalLine(at(40, 4), 'click', true);

        // The next line, drawn without Ctrl, is not inverted, so it stays where it is clicked: 45.
        await drawHorizontalLine(at(45), 'click');

        await compareAnnotationsSnapshot(chart, ctx);
    });

    it('snaps the points of a line to the x and y values of the nearest candlestick', async () => {
        await prepareChart(
            { enabled: true, range: 20 },
            {
                data: CANDLESTICKS,
                series: [
                    {
                        type: 'candlestick',
                        xKey: 'x',
                        openKey: 'open',
                        highKey: 'high',
                        lowKey: 'low',
                        closeKey: 'close',
                    },
                ],
            }
        );
        const day = 24 * 60 * 60 * 1000;
        const near = (time: number, value: number) => {
            const { x, y } = canvasPoint(time, value);
            return { x: x + 8, y: y + 6 };
        };

        // Both points are 10 pixels from a value, so they snap to the low of the first candlestick and the high of
        // the last, at their times.
        await draw('line', [near(FIRST_X, 5), near(LAST_X, 95)]);

        // A vertical line is placed by its x position alone, which snaps to the middle candlestick from 40 days away.
        await updateMagnet({ enabled: true, range: 'nearest' });
        await draw('vertical-line', [canvasPoint(X_MID + 40 * day, 100)]);

        await compareAnnotationsSnapshot(chart, ctx);
    });

    it('commits the end of a line with the Ctrl state of the click, not of the last hover', async () => {
        await prepareChart(
            { enabled: true, range: 'nearest' },
            {
                data: CANDLESTICKS,
                series: [
                    {
                        type: 'candlestick',
                        xKey: 'x',
                        openKey: 'open',
                        highKey: 'high',
                        lowKey: 'low',
                        closeKey: 'close',
                    },
                ],
            }
        );
        const start = canvasPoint(FIRST_X, 5);
        const end = canvasPoint(X_MID + 60 * 24 * 60 * 60 * 1000, 50);

        pressAnnotationToolbarCreate(chart, 'line');
        await waitForChartStability(chart);
        await hoverAction(start.x, start.y)(chart);
        await clickAction(start.x, start.y)(chart);

        // The hover snaps the end to the nearest candlestick, then Ctrl is pressed without the pointer moving, so the
        // click inverts the magnet and the end stays where it is clicked.
        await hoverAction(end.x, end.y)(chart);
        await clickAction(end.x, end.y, { ctrlKey: true })(chart);
        await waitForChartStability(chart);

        await compareAnnotationsSnapshot(chart, ctx);
    });

    const BAND = [{ x: new Date(X_MID), a: 30, b: 25 }];
    it.each([
        {
            name: 'a line series, ignoring a hidden series',
            series: [
                { type: 'line', xKey: 'x', yKey: 'y' },
                { type: 'line', xKey: 'x', yKey: 'hidden', visible: false },
            ],
            data: [{ x: new Date(X_MID), y: 40, hidden: 80 }],
            click: 90,
        },
        {
            name: 'a scatter series, which has no cumulative value',
            series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
            data: [{ x: new Date(X_MID), y: 40 }],
            click: 90,
        },
        {
            name: 'the top of a stacked bar series',
            series: [
                { type: 'bar', xKey: 'x', yKey: 'a', stacked: true },
                { type: 'bar', xKey: 'x', yKey: 'b', stacked: true },
            ],
            data: BAND,
            click: 90,
        },
        {
            name: 'the top of a stacked area series',
            series: [
                { type: 'area', xKey: 'x', yKey: 'a', stacked: true },
                { type: 'area', xKey: 'x', yKey: 'b', stacked: true },
            ],
            data: BAND,
            click: 90,
        },
        {
            name: 'the bottom of a negative stack',
            series: [
                { type: 'bar', xKey: 'x', yKey: 'a', stacked: true },
                { type: 'bar', xKey: 'x', yKey: 'b', stacked: true },
            ],
            data: [{ x: new Date(X_MID), a: 30, b: -20 }],
            axes: { y: { type: 'number', min: -50, max: 50, nice: false } },
            click: -45,
            range: [-50, 50],
        },
        {
            name: 'a log y-axis, in pixels rather than values',
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            data: [{ x: new Date(X_MID), y: 40 }],
            axes: { y: { type: 'log', min: 1, max: 100 } },
            click: 99,
            range: [1, 100],
        },
        {
            name: 'a time y-axis',
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            data: [{ x: new Date(X_MID), y: new Date(X_MID) }],
            axes: { y: { type: 'time', min: new Date(X_MIN), max: new Date(X_MAX) } },
            click: 90,
        },
        {
            name: 'the values within the y-axis only',
            series: [
                { type: 'candlestick', xKey: 'x', openKey: 'open', highKey: 'high', lowKey: 'low', closeKey: 'close' },
            ],
            data: CANDLESTICKS,
            axes: { y: { type: 'number', min: 0, max: 50, nice: false } },
            click: 49,
            range: [0, 50],
        },
        {
            name: 'the visible value of a candlestick whose midpoint is beyond the y-axis',
            series: [
                { type: 'candlestick', xKey: 'x', openKey: 'open', highKey: 'high', lowKey: 'low', closeKey: 'close' },
            ],
            data: CANDLESTICKS,
            axes: { y: { type: 'number', min: 0, max: 30, nice: false } },
            click: 29,
            range: [0, 30],
        },
        {
            name: 'nothing when the y-axis is a category axis',
            series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
            data: [
                { x: new Date(X_MID), y: 'low' },
                { x: new Date(X_MID), y: 'high' },
            ],
            axes: { y: { type: 'category' } },
            click: 90,
        },
    ])('snaps to the values of $name', async ({ series, data, click, axes, range }: any) => {
        await prepareChart(
            { enabled: true, range: 'nearest' },
            {
                series,
                data,
                ...(axes && {
                    axes: { x: { type: 'time', min: new Date(X_MIN), max: new Date(X_MAX), nice: false }, ...axes },
                }),
            }
        );
        await drawHorizontalLine(canvasPoint(X_MID, click, 0, range), 'click');
        await compareAnnotationsSnapshot(chart, ctx);
    });

    it('snaps the handle of an annotation that is dragged', async () => {
        await prepareChart({ enabled: true, range: 'nearest' }, {});
        const x = (time: number) => new Date(time);
        await restoreAnnotations(chart, ctx, [
            { type: 'line', start: { x: x(X_MID), y: 50 }, end: { x: x(LAST_X), y: 30 } },
            { type: 'parallel-channel', start: { x: x(FIRST_X), y: 20 }, end: { x: x(X_MID), y: 20 }, height: 10 },
        ]);

        // Each handle is dragged to 40 pixels beside the datum that is nearest to it, so that it snaps back to the x
        // and y values of that datum: the end of the line to 95, and the start of the channel to 5.
        const beside = (point: { x: number; y: number }, pixels: number) => ({ x: point.x + pixels, y: point.y });

        const lineEnd = canvasPoint(LAST_X, 30);
        await hoverAction(lineEnd.x, lineEnd.y)(chart);
        await dragAction(lineEnd, beside(canvasPoint(LAST_X, 90), -40))(chart);
        await waitForChartStability(chart);

        const channelStart = canvasPoint(FIRST_X, 20);
        await hoverAction(channelStart.x, channelStart.y)(chart);
        await dragAction(channelStart, beside(canvasPoint(FIRST_X, 8), 40))(chart);
        await waitForChartStability(chart);

        await compareAnnotationsSnapshot(chart, ctx);
    });

    it('toggles the magnet with a switch button that swaps its icon, until the enabled option changes', async () => {
        chart = await createAnnotationsChart({
            ...ANNOTATIONS_EXAMPLE_OPTIONS,
            annotations: {
                ...ANNOTATIONS_EXAMPLE_OPTIONS.annotations,
                magnet: { enabled: false, range: 'nearest' },
                toolbar: {
                    enabled: true,
                    buttons: [
                        {
                            type: 'switch',
                            icon: 'no-magnet',
                            ariaLabel: 'Magnet',
                            checkedOverrides: { icon: 'magnet', tooltip: 'Magnet on' },
                            value: 'magnet',
                        },
                    ],
                },
            },
        } as AgCartesianChartOptions);
        const magnetButton = () =>
            deproxy(chart).ctx.agDocument.body.querySelector<HTMLElement>('.ag-charts-shared-toolbar button')!;
        const state = () => ({
            role: magnetButton().getAttribute('role'),
            checked: magnetButton().getAttribute('aria-checked'),
            pressed: magnetButton().hasAttribute('aria-pressed'),
            title: magnetButton().getAttribute('title'),
            icon: magnetButton()
                .querySelector('[class*="ag-charts-icon-"]')
                ?.className.match(/icon-[\w-]+/)?.[0],
        });

        expect(state()).toEqual({
            role: 'switch',
            checked: 'false',
            pressed: false,
            title: null,
            icon: 'icon-no-magnet',
        });

        magnetButton().click();
        await waitForChartStability(chart);
        expect(getAnnotationMagnetEnabled(chart)).toBe(true);
        expect(state()).toEqual({
            role: 'switch',
            checked: 'true',
            pressed: false,
            title: 'Magnet on',
            icon: 'icon-magnet',
        });

        magnetButton().click();
        await waitForChartStability(chart);
        expect(state()).toEqual({
            role: 'switch',
            checked: 'false',
            pressed: false,
            title: null,
            icon: 'icon-no-magnet',
        });

        // A toggle outlasts a change of another option, but not of `enabled`, which the switch shows too.
        magnetButton().click();
        await updateMagnet({ range: 20 });
        expect(getAnnotationMagnetEnabled(chart)).toBe(true);
        expect(state()).toMatchObject({ checked: 'true', icon: 'icon-magnet' });

        await updateMagnet({ enabled: true });
        await updateMagnet({ enabled: false });
        expect(getAnnotationMagnetEnabled(chart)).toBe(false);
        expect(state()).toMatchObject({ checked: 'false', icon: 'icon-no-magnet' });
    });
});
