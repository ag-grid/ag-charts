import { afterEach, describe, expect, it } from 'vitest';

import type { AgBarSeriesOptions, AgCartesianChartOptions } from 'ag-charts-types';

import {
    createChart,
    getCursor,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

const data = [
    { month: 'January', sales: 1200, expenses: 800 },
    { month: 'February', sales: 1500, expenses: 950 },
    { month: 'March', sales: 1700, expenses: 1100 },
];

// Coordinate over the first 'sales' bar; bar Rect nodes are hit-testable in JSDOM.
const overBar = { x: 133, y: 333 } as const;

function barOptions(extra?: Partial<AgBarSeriesOptions>): AgCartesianChartOptions {
    return {
        data,
        series: [
            { type: 'bar', xKey: 'month', yKey: 'sales', ...extra },
            { type: 'bar', xKey: 'month', yKey: 'expenses', ...extra },
        ],
    };
}

describe('CRT-1122 hover cursor', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Awaited<ReturnType<typeof createChart>>;

    afterEach(() => {
        chart?.destroy();
    });

    it('shows the default cursor on a non-interactive series', async () => {
        chart = await createChart(barOptions());

        await hoverAction(overBar.x, overBar.y)(chart);
        await waitForChartStability(chart);

        expect(getCursor(chart)).toBe('default');
    });

    it('shows the pointer cursor when selection is enabled', async () => {
        chart = await createChart(barOptions({ selection: { enabled: true } }));

        await hoverAction(overBar.x, overBar.y)(chart);
        await waitForChartStability(chart);

        expect(getCursor(chart)).toBe('pointer');
    });

    it('shows the pointer cursor when a seriesNodeClick listener is present', async () => {
        chart = await createChart(barOptions({ listeners: { seriesNodeClick: () => undefined } }));

        await hoverAction(overBar.x, overBar.y)(chart);
        await waitForChartStability(chart);

        expect(getCursor(chart)).toBe('pointer');
    });
});
