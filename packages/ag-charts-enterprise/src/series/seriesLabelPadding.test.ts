import { afterEach, describe, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartThemeParams } from 'ag-charts-community';
import { type ChartOrProxy, compareImageSnapshot, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';

import { createEnterpriseChart } from '../test/utils';

/** Padding only shows on a label that draws a box, so every label here has a fill. */
describe('seriesLabelPadding theme parameter', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: ChartOrProxy | undefined;
    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const label = { enabled: true, fill: '#eeeeee', border: { enabled: true, stroke: '#464646' } };

    const axes: AgCartesianChartOptions['axes'] = {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left', min: 0, max: 130 },
    };

    // The range series share one chart, each in its own band of the value axis so that no label collides with another.
    // The waterfall is a solo series type that cannot share a chart, so it gets its own.
    const CHARTS: { name: string; createOptions: (params: AgChartThemeParams) => AgCartesianChartOptions }[] = [
        {
            name: 'range area and range bar',
            createOptions: (params) => ({
                data: [
                    { category: 'A', low: 22, high: 48, rangeLow: 84, rangeHigh: 104 },
                    { category: 'B', low: 26, high: 52, rangeLow: 88, rangeHigh: 110 },
                    { category: 'C', low: 20, high: 46, rangeLow: 82, rangeHigh: 102 },
                ],
                legend: { enabled: false },
                theme: { params },
                axes,
                series: [
                    {
                        type: 'range-area',
                        xKey: 'category',
                        yLowKey: 'rangeLow',
                        yHighKey: 'rangeHigh',
                        fillOpacity: 0.3,
                        label,
                    },
                    {
                        type: 'range-bar',
                        xKey: 'category',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        label: { ...label, placement: 'outside' },
                    },
                ],
            }),
        },
        {
            name: 'waterfall',
            createOptions: (params) => ({
                data: [
                    { category: 'A', change: 30 },
                    { category: 'B', change: -12 },
                    { category: 'C', change: 24 },
                ],
                legend: { enabled: false },
                theme: { params },
                axes,
                series: [{ type: 'waterfall', xKey: 'category', yKey: 'change', label }],
            }),
        },
    ];

    const PARAMS: { name: string; params: AgChartThemeParams }[] = [
        { name: 'the default of 8', params: {} },
        { name: 'a theme parameter of 16', params: { seriesLabelPadding: 16 } },
    ];

    describe.each(CHARTS)('$name', ({ createOptions }) => {
        it.each(PARAMS)('pads labels by $name', async ({ params }) => {
            chart = await createEnterpriseChart(createOptions(params));
            await compareImageSnapshot(chart, ctx);
        });
    });
});
