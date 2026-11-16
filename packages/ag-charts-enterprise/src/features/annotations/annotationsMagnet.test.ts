import { afterEach, describe, expect, it } from 'vitest';

import type { AgAnnotationMagnet, AgCartesianChartOptions, AgChartInstance } from 'ag-charts-community';
import {
    clickAction,
    dragAction,
    getSeriesRect,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import {
    getAnnotationMagnetEnabled,
    pressAnnotationMagnetButton,
    pressAnnotationToolbarCreate,
} from '../../test/featureAccessors';
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
    function canvasPoint(time: number, value: number, pixelsBelow = 0) {
        const { x, y, width, height } = getSeriesRect(chart);
        const canvasX = x + (width * (time - X_MIN)) / (X_MAX - X_MIN);
        return { x: canvasX, y: y + height * (1 - value / 100) + pixelsBelow };
    }

    /** Draws a horizontal line by hovering and clicking at the position, or by dragging from it. */
    async function drawHorizontalLine(position: { x: number; y: number }, how: 'click' | 'drag', ctrlKey = false) {
        pressAnnotationToolbarCreate(chart, 'horizontal-line');
        await waitForChartStability(chart);

        if (how === 'drag') {
            await dragAction(position, { x: position.x + 20, y: position.y })(chart);
        } else {
            await hoverAction(position.x, position.y, { ctrlKey })(chart);
            await clickAction(position.x, position.y, { ctrlKey })(chart);
        }
        await waitForChartStability(chart);
    }

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

        // Weak, so it snaps to the close, 55, from 6 pixels away but not to anything from 85, which is far above.
        await updateMagnet({ enabled: true, mode: 'weak', range: 10 });
        await drawHorizontalLine(at(55, 6), 'click');
        await drawHorizontalLine(at(85), 'click');

        // Strong, so it snaps to the high, 70, from the top of the chart, and to the low, 20, when drawn by dragging.
        await updateMagnet({ enabled: true, mode: 'strong' });
        await drawHorizontalLine(at(98), 'click');
        await drawHorizontalLine(at(2), 'drag');

        // Holding Ctrl while it is off inverts it, so it snaps to the open, 40, from 4 pixels away.
        await updateMagnet({ enabled: false, mode: 'weak', range: 10 });
        await drawHorizontalLine(at(40, 4), 'click', true);

        await compareAnnotationsSnapshot(chart, ctx);
    });

    it.each([
        {
            name: 'a line series, ignoring a hidden series',
            series: [
                { type: 'line', xKey: 'x', yKey: 'y' },
                { type: 'line', xKey: 'x', yKey: 'hidden', visible: false },
            ],
            data: [{ x: new Date(X_MID), y: 40, hidden: 80 }],
        },
        {
            name: 'the top of a stacked bar series',
            series: [
                { type: 'bar', xKey: 'x', yKey: 'a', stacked: true },
                { type: 'bar', xKey: 'x', yKey: 'b', stacked: true },
            ],
            data: [{ x: new Date(X_MID), a: 30, b: 25 }],
        },
    ])('snaps to the values of $name', async ({ series, data }) => {
        await prepareChart({ enabled: true, mode: 'strong' }, { series, data } as any);
        await drawHorizontalLine(canvasPoint(X_MID, 90), 'click');
        await compareAnnotationsSnapshot(chart, ctx);
    });

    it('snaps the handle of an annotation that is dragged', async () => {
        await prepareChart({ enabled: true, mode: 'strong' }, {});
        const x = (time: number) => new Date(time);
        await restoreAnnotations(chart, ctx, [
            { type: 'line', start: { x: x(X_MID), y: 50 }, end: { x: x(LAST_X), y: 30 } },
            { type: 'parallel-channel', start: { x: x(FIRST_X), y: 70 }, end: { x: x(X_MID), y: 70 }, height: 10 },
        ]);

        // The end of the line goes towards 80, and the start of the channel towards 30, and they snap to the values of
        // the datums at their times, 95 and 5.
        const lineEnd = canvasPoint(LAST_X, 30);
        await hoverAction(lineEnd.x, lineEnd.y)(chart);
        await dragAction(lineEnd, canvasPoint(LAST_X, 80))(chart);
        await waitForChartStability(chart);

        const channelStart = canvasPoint(FIRST_X, 70);
        await hoverAction(channelStart.x, channelStart.y)(chart);
        await dragAction(channelStart, canvasPoint(FIRST_X, 30))(chart);
        await waitForChartStability(chart);

        await compareAnnotationsSnapshot(chart, ctx);
    });

    it('keeps a toggle of the toolbar button until the enabled option changes', async () => {
        await prepareChart({ enabled: false, mode: 'strong' }, {});
        expect(getAnnotationMagnetEnabled(chart)).toBe(false);

        pressAnnotationMagnetButton(chart);
        await updateMagnet({ mode: 'weak' });
        expect(getAnnotationMagnetEnabled(chart)).toBe(true);

        await updateMagnet({ enabled: true });
        await updateMagnet({ enabled: false });
        expect(getAnnotationMagnetEnabled(chart)).toBe(false);
    });
});
