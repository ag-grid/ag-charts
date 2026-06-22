import { afterEach, describe, expect, it } from 'vitest';

import { type AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

// Crossing focus between series of differing node density (range-area packs two nodeData
// entries per x-position, line packs one) must keep the same x-position, not the raw node index.
describe('RangeAreaSeries keyboard navigation (CRT-1129)', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: any;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const DATA = [
        { month: 'Jan', value: 10, low: 5, high: 15 },
        { month: 'Feb', value: 20, low: 8, high: 22 },
        { month: 'Mar', value: 30, low: 12, high: 28 },
        { month: 'Apr', value: 25, low: 10, high: 26 },
    ];

    const LINE_AND_RANGE: AgCartesianChartOptions = {
        data: DATA,
        series: [
            { type: 'line', xKey: 'month', yKey: 'value' },
            { type: 'range-area', xKey: 'month', yLowKey: 'low', yHighKey: 'high' },
        ],
    };

    async function setupKeyNavChart(opts: AgCartesianChartOptions) {
        const options: AgCartesianChartOptions = { ...opts };
        prepareEnterpriseTestOptions(options as any);
        chart = deproxy(AgCharts.create(options));
        await waitForChartStability(chart);
        return chart;
    }

    function pressArrowOnSeriesArea(key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight') {
        const seriesArea = document.querySelector<HTMLElement>('.ag-charts-series-area');
        if (!seriesArea) throw new Error('series-area element not found');
        seriesArea.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true }));
    }

    function getFocusState(c: any) {
        return c.seriesAreaManager.focus as {
            seriesIndex: number;
            datumIndex: number;
            datum: { datumIndex: number; xValue: unknown };
        };
    }

    it('preserves the x-position when crossing between line and range-area', async () => {
        const c = await setupKeyNavChart(LINE_AND_RANGE);

        // Move to the 3rd x-position (data index 2) within the first series.
        pressArrowOnSeriesArea('ArrowRight');
        await waitForChartStability(c);
        pressArrowOnSeriesArea('ArrowRight');
        await waitForChartStability(c);

        const start = getFocusState(c);
        expect(start.seriesIndex).toBe(0);
        expect(start.datum.datumIndex).toBe(2);
        const startXValue = start.datum.xValue;

        // Cross to the other series — the x-position must be preserved.
        pressArrowOnSeriesArea('ArrowDown');
        await waitForChartStability(c);

        const crossed = getFocusState(c);
        expect(crossed.seriesIndex).toBe(1);
        expect(crossed.datum.datumIndex).toBe(2);
        expect(crossed.datum.xValue).toEqual(startXValue);

        // Cross back — still preserved.
        pressArrowOnSeriesArea('ArrowUp');
        await waitForChartStability(c);

        const back = getFocusState(c);
        expect(back.seriesIndex).toBe(0);
        expect(back.datum.datumIndex).toBe(2);
        expect(back.datum.xValue).toEqual(startXValue);
    });
});
