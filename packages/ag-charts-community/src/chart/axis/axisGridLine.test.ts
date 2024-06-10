import { afterEach, describe, expect } from '@jest/globals';

import { AgCharts } from '../../api/agCharts';
import type { AgChartInstance, AgChartOptions } from '../../options/agChartOptions';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

describe('AxisGridLine', () => {
    setupMockConsole();
    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();
    const opts: AgChartOptions = prepareTestOptions({});

    const compare = async () => {
        await waitForChartStability(chart);

        const newImageData = extractImageData(ctx);
        expect(newImageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
    };

    // AG-8777
    test('use theme default stroke', async () => {
        chart = AgCharts.create({
            ...opts,
            data: [{ x: 0, y: 0 }],
            series: [{ xKey: 'x', yKey: 'y' }],
            axes: [
                {
                    type: 'number',
                    position: 'bottom',
                    gridLine: { style: [{ lineDash: [8, 3, 3, 3] }] },
                },
                {
                    type: 'number',
                    position: 'left',
                    gridLine: { style: [{ lineDash: [5, 5, 1] }] },
                },
            ],
        });

        await compare();
    });

    test('do not draw empty styles', async () => {
        chart = AgCharts.create({
            ...opts,
            data: [{ x: 0, y: 0 }],
            series: [{ xKey: 'x', yKey: 'y' }],
            axes: [
                {
                    type: 'number',
                    position: 'bottom',
                    // Should draw no grid line
                    gridLine: { style: [{}] },
                },
                {
                    type: 'number',
                    position: 'left',
                    // Should draw only half of the grid lines
                    gridLine: { style: [{}, { lineDash: [5, 5, 1] }] },
                },
            ],
        });

        await compare();
    });
});
