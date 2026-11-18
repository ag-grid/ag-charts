import { AgCartesianChartOptions, AgCharts, AgLineSeriesOptions, LegendModule } from 'ag-charts-community';
import { CategoryAxisModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);

const dashes: Array<Pick<AgLineSeriesOptions, 'yKey' | 'lineDash'>> = [
    { yKey: 'solid', lineDash: 'solid' },
    { yKey: 'dot', lineDash: 'dot' },
    { yKey: 'dash', lineDash: 'dash' },
    { yKey: 'dashDot', lineDash: 'dash-dot' },
    { yKey: 'longDash', lineDash: 'long-dash' },
    { yKey: 'longDashDot', lineDash: 'long-dash-dot' },
    { yKey: 'longDashDotDot', lineDash: 'long-dash-dot-dot' },
    { yKey: 'dashDotDot', lineDash: 'dash-dot-dot' },
    { yKey: 'dashLongDash', lineDash: 'dash-long-dash' },
    { yKey: 'longDashDashDash', lineDash: 'long-dash-dash-dash' },
];

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Stock Line Dash Patterns',
    },
    data: getData(),
    series: dashes.map(({ yKey, lineDash }) => ({
        type: 'line',
        xKey: 'quarter',
        yKey,
        yName: String(lineDash),
        strokeWidth: 2,
        lineDash,
        marker: { enabled: false },
    })),
    legend: {
        position: 'right',
        item: { line: { length: 60 } },
    },
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
};

AgCharts.create(options);
