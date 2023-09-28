import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
    clickAction,
    extractImageData,
    IMAGE_SNAPSHOT_DEFAULTS,
    scrollAction,
    setupMockCanvas,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { AgChartOptions } from '../../../main';
import { AgEnterpriseCharts } from '../../main';
import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('Zoom', () => {
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
        },
    };

    let cx: number = 0;
    let cy: number = 0;

    beforeEach(async () => {
        const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
        prepareEnterpriseTestOptions(options);
        cx = options.width! / 2;
        cy = options.height! / 2;

        chart = AgEnterpriseCharts.create(options);

        // Click once in the chart to ensure the chart is active / mouse is over it to ensure the first scroll wheel
        // event is triggered.
        await waitForChartStability(chart);
        await clickAction(cx, cy)(chart);

        // eslint-disable-next-line no-console
        console.warn = jest.fn();
    });

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        // eslint-disable-next-line no-console
        expect(console.warn).not.toBeCalled();
    });

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('when a user scrolls the mouse wheel', () => {
        it('should zoom in', async () => {
            await scrollAction(cx, cy, -1)(chart);

            await compare();
        });

        it('should zoom in then out', async () => {
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, 1)(chart);

            await compare();
        });

        it('should zoom in to the given location', async () => {
            await scrollAction(cx * 1.5, cy * 1.5, -1)(chart);

            await compare();
        });
    });
});
