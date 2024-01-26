import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
    IMAGE_SNAPSHOT_DEFAULTS,
    WheelDeltaMode,
    clickAction,
    doubleClickAction,
    extractImageData,
    scrollAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import type { AgChartOptions } from '../../main';
import { AgCharts } from '../../main';
import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('Zoom', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();

    const EXAMPLE_OPTIONS: AgChartOptions = {
        data: [
            { x: 0, y: 0 },
            { x: 1, y: 50 },
            { x: 2, y: 25 },
            { x: 3, y: 75 },
            { x: 4, y: 50 },
            { x: 5, y: 25 },
            { x: 6, y: 50 },
            { x: 7, y: 75 },
        ],
        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
        zoom: {
            enabled: true,
            axes: 'xy',
            scrollingStep: 0.5, // Make sure we zoom enough in a single step so we can detect it
            minVisibleItemsX: 1,
            minVisibleItemsY: 1,
        },
    };

    let cx: number = 0;
    let cy: number = 0;

    async function prepareChart(zoomOptions?: AgChartOptions['zoom'], baseOptions = EXAMPLE_OPTIONS) {
        const options: AgChartOptions = {
            ...baseOptions,
            zoom: { ...baseOptions.zoom, ...(zoomOptions ?? {}) },
        };
        prepareEnterpriseTestOptions(options);
        cx = options.width! / 2;
        cy = options.height! / 2;

        chart = AgCharts.create(options);

        // Click once in the chart to ensure the chart is active / mouse is over it to ensure the first scroll wheel
        // event is triggered.
        await waitForChartStability(chart);
        await clickAction(cx, cy)(chart);
    }

    async function prepareHorizontalBarChart(zoomOptions?: AgChartOptions['zoom']) {
        await prepareChart(zoomOptions, {
            ...EXAMPLE_OPTIONS,
            series: [{ type: 'bar', xKey: 'x', yKey: 'y', direction: 'horizontal' }],
        } as AgChartOptions);
    }

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('scrolling', () => {
        it('should zoom in', async () => {
            await prepareChart();
            await scrollAction(cx, cy, -1)(chart);
            await compare();
        });

        it('should zoom in then out', async () => {
            await prepareChart();
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, 1)(chart);
            await compare();
        });
    });

    describe('pixel scrolling', () => {
        it('should zoom in then out', async () => {
            await prepareChart();
            await scrollAction(cx, cy, -7, WheelDeltaMode.Pixels)(chart);
            await compare();
            await scrollAction(cx, cy, 5, WheelDeltaMode.Pixels)(chart);
            await compare();
        });
    });

    describe('horizontal scrolling', () => {
        it('should pan', async () => {
            await prepareChart();
            // Initialise zoomPan
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, 0, WheelDeltaMode.Lines, -1)(chart);

            // Pan left
            await scrollAction(cx, cy, 0, WheelDeltaMode.Pixels, -300)(chart);
            await compare();

            // Pan right
            await scrollAction(cx, cy, 0, WheelDeltaMode.Pixels, 200)(chart);
            await compare();
        });
    });

    describe('anchor', () => {
        it('should zoom at the start', async () => {
            await prepareChart({ anchorPointX: 'start', anchorPointY: 'start' });
            await scrollAction(cx, cy, -1)(chart);
            await compare();
        });

        it('should zoom in the middle', async () => {
            await prepareChart({ anchorPointX: 'middle', anchorPointY: 'middle' });
            await scrollAction(cx, cy, -1)(chart);
            await compare();
        });

        it('should zoom at the end', async () => {
            await prepareChart({ anchorPointX: 'end', anchorPointY: 'end' });
            await scrollAction(cx, cy, -1)(chart);
            await compare();
        });

        it('should zoom on the pointer', async () => {
            await prepareChart({ anchorPointX: 'pointer', anchorPointY: 'pointer' });
            await scrollAction(cx, cy, -1)(chart);
            await compare();
        });
    });

    describe('min visible items', () => {
        it('should not zoom past the minimum visible items', async () => {
            await prepareChart({ minVisibleItemsX: 3, scrollingStep: 0.1 });
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart); // This is the limit
            await scrollAction(cx, cy, -1)(chart);
            await compare();
        });
    });

    describe('double click', () => {
        it('should reset the zoom', async () => {
            await prepareChart();
            await scrollAction(cx, cy, -1)(chart);
            await doubleClickAction(cx, cy)(chart);
            await compare();
        });
    });

    describe('flipped axes', () => {
        it('should zoom on the flipped axis', async () => {
            await prepareHorizontalBarChart({ axes: 'x' });
            await scrollAction(cx, cy, -1)(chart);
            await compare();
        });

        it('should zoom to minimum visible items', async () => {
            await prepareHorizontalBarChart({ axes: 'x', minVisibleItemsX: 3, scrollingStep: 0.1 });
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart); // This is the limit
            await scrollAction(cx, cy, -1)(chart);
            await compare();
        });
    });
});
