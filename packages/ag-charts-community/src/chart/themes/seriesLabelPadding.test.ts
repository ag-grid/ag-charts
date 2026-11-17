import { afterEach, describe, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartLabelOptions, AgChartThemeParams } from 'ag-charts-types';

import { compareImageSnapshot, createChart, setupMockCanvas, setupMockConsole } from '../test/utils';
import type { ChartOrProxy } from '../test/utils';

/**
 * `seriesLabelPadding` feeds the `label.padding` default of every series type, but only a label that draws a box
 * shows it, so every label here has a fill. This is a cross-series theme concern with no single owning module, so it
 * sits beside the theme suites rather than in one series' suite.
 */
describe('seriesLabelPadding theme parameter', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: ChartOrProxy | undefined;
    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const boxedLabel = (label: AgChartLabelOptions<any, any> = {}): AgChartLabelOptions<any, any> => ({
        enabled: true,
        fill: '#eeeeee',
        border: { enabled: true, stroke: '#464646' },
        ...label,
    });

    // Each series sits in its own band of the shared value axis so that no label collides with another.
    const data = [
        { category: 'A', bar: 28, line: 48, scatter: 72, area: 94 },
        { category: 'B', bar: 36, line: 56, scatter: 80, area: 102 },
        { category: 'C', bar: 24, line: 44, scatter: 68, area: 90 },
    ];

    const createOptions = (params: AgChartThemeParams): AgCartesianChartOptions => ({
        data,
        legend: { enabled: false },
        theme: {
            params,
            // A theme override sets the padding of the line series, which has no padding of its own.
            overrides: { line: { series: { label: { padding: 2 } } } },
        },
        axes: {
            x: { type: 'category', position: 'bottom' },
            y: { type: 'number', position: 'left', min: 0, max: 120 },
        },
        series: [
            { type: 'area', xKey: 'category', yKey: 'area', fillOpacity: 0.3, label: boxedLabel() },
            { type: 'bar', xKey: 'category', yKey: 'bar', label: { ...boxedLabel(), placement: 'outside-end' } },
            { type: 'line', xKey: 'category', yKey: 'line', label: boxedLabel() },
            // A padding set on the series itself wins over both the theme parameter and the default.
            {
                type: 'scatter',
                xKey: 'category',
                yKey: 'scatter',
                labelKey: 'category',
                label: boxedLabel({ padding: 2 }),
            },
        ],
    });

    // Only the area and bar labels follow the parameter: the line labels are pinned to 2 by a theme override and the
    // scatter labels to 2 by a series option, so both must keep that padding whatever the parameter says.
    it.each<{ name: string; params: AgChartThemeParams }>([
        { name: 'the default of 8', params: {} },
        { name: 'a theme parameter of 16', params: { seriesLabelPadding: 16 } },
    ])('pads series labels by $name', async ({ params }) => {
        chart = await createChart(createOptions(params));
        await compareImageSnapshot(chart, ctx);
    });
});
