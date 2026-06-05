import { afterEach, describe, expect, test } from 'vitest';

import type { AgChartOptions } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import { delay, deproxy, setupMockCanvas, waitForChartStability } from './test/utils';

const DATA = [
    { k: 'A', v: 1 },
    { k: 'B', v: 2 },
    { k: 'C', v: 3 },
];

const SERIES: Record<string, NonNullable<AgChartOptions['series']>> = {
    // Polar series change the chart type from the default cartesian chart, which re-creates
    // the chart and transfers the scene (the AG-17444 / AS-774 path).
    donut: [{ type: 'donut', angleKey: 'v', calloutLabelKey: 'k' }],
    pie: [{ type: 'pie', angleKey: 'v', calloutLabelKey: 'k' }],
    // Cartesian control: no type change, no re-creation.
    line: [{ type: 'line', xKey: 'k', yKey: 'v' }],
};

describe('Chart re-creation canvas attachment (AG-17444)', () => {
    setupMockCanvas();

    let chart: any;
    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    // Regression: `AgCharts.create()` followed immediately by an `update()` that changes the
    // chart type transfers the scene to a re-created chart. The previous chart's deferred
    // teardown (DOMManager.destroy) must not remove the transferred <canvas> that the new chart
    // has already adopted — otherwise the live canvas is orphaned from the DOM and renders blank.
    test.each(Object.keys(SERIES))(
        'canvas stays attached to the container when update() applies a %s series',
        async (seriesType) => {
            const container = document.createElement('div');
            document.body.appendChild(container);

            chart = AgCharts.create({ container } as AgChartOptions);
            await chart.update({ container, data: DATA, series: SERIES[seriesType] } as AgChartOptions);
            await waitForChartStability(chart);
            // Allow the re-created chart's deferred teardown to run before asserting.
            await delay(50);

            const canvasElement = deproxy(chart).ctx.scene.canvas.element;
            expect(canvasElement.isConnected).toBe(true);
            expect(container.contains(canvasElement)).toBe(true);
        }
    );
});
