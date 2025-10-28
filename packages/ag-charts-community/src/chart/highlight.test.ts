import { afterEach, describe, expect, it } from '@jest/globals';

import type { AgCartesianChartOptions } from 'ag-charts-types';

import type { Chart } from './chart';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    createChart,
    extractImageData,
    hoverAction,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

describe('Chart highlighting', () => {
    setupMockConsole();

    let chart: Chart;
    const ctx = setupMockCanvas();

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

    it('Handles bringToFront property', async () => {
        const options = prepareTestOptions<AgCartesianChartOptions>({
            data: [
                { x: 'A', line1: 10, line2: 5, bar: 20 },
                { x: 'B', line1: 15, line2: 15, bar: 25 },
                { x: 'C', line1: 20, line2: 20, bar: 30 },
            ],
            series: [
                { type: 'bar', xKey: 'x', yKey: 'bar', highlight: { bringToFront: false } },
                { type: 'line', xKey: 'x', yKey: 'line1', highlight: { bringToFront: false } },
                { type: 'line', xKey: 'x', yKey: 'line2', highlight: { bringToFront: false } },
            ],
        });

        chart = await createChart(options);
        await waitForChartStability(chart);

        // Yellow line, green line, red bar
        await hoverAction(170, 350)(chart);
        await waitForChartStability(chart);
        await compare();

        // Green line, yellow line, red bar
        await hoverAction(170, 430)(chart);
        await waitForChartStability(chart);
        await compare();

        // Red bar, yellow line, green line
        await hoverAction(170, 450)(chart);
        await waitForChartStability(chart);
        await compare();
    });
});
