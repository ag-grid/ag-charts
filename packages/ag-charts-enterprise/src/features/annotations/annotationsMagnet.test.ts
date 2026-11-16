import { afterEach, describe, expect, it } from 'vitest';

import type {
    AgAnnotationMagnet,
    AgAnnotationsOptions,
    AgCartesianChartOptions,
    AgChartInstance,
} from 'ag-charts-community';
import {
    clickAction,
    getSeriesRect,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { AgHorizontalLineAnnotation } from 'ag-charts-types';

import {
    getAnnotationMagnetEnabled,
    pressAnnotationMagnetButton,
    pressAnnotationToolbarCreate,
} from '../../test/featureAccessors';
import { ANNOTATIONS_EXAMPLE_OPTIONS, createAnnotationsChart } from './test/fixture';

// The middle datum of the example, which has the y value 50 at about the middle of the x domain.
const DATUM_X = new Date('2024-06-15').getTime();
const [X_MIN, X_MAX] = [new Date('2024-01-01').getTime(), new Date('2024-12-31').getTime()];
const DATUM_Y = 50;

describe('Annotations magnet', () => {
    setupMockConsole();
    setupMockCanvas();
    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
    });

    async function prepareChart(magnet?: AgAnnotationMagnet) {
        const annotations: AgAnnotationsOptions = { ...ANNOTATIONS_EXAMPLE_OPTIONS.annotations, magnet };
        const options: AgCartesianChartOptions = {
            ...ANNOTATIONS_EXAMPLE_OPTIONS,
            axes: {
                x: { type: 'time', min: new Date(X_MIN), max: new Date(X_MAX), nice: false },
                y: { type: 'number', min: 0, max: 100, nice: false },
            },
            annotations,
        };
        chart = await createAnnotationsChart(options);
    }

    /** Draws a horizontal line by clicking `pixelsAbove` pixels above the datum, and returns where it ends up. */
    async function drawHorizontalLine(pixelsAbove: number, modifiers?: { ctrlKey?: boolean }) {
        pressAnnotationToolbarCreate(chart, 'horizontal-line');
        await waitForChartStability(chart);

        const { x, y, width, height } = getSeriesRect(chart);
        const canvasX = x + (width * (DATUM_X - X_MIN)) / (X_MAX - X_MIN);
        const canvasY = y + height * (1 - DATUM_Y / 100) - pixelsAbove;

        await hoverAction(canvasX, canvasY, modifiers)(chart);
        await clickAction(canvasX, canvasY, modifiers)(chart);
        await waitForChartStability(chart);

        const { annotations = [] } = chart.getState();
        expect(annotations).toHaveLength(1);
        return { value: (annotations[0] as AgHorizontalLineAnnotation).value, height };
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
});
