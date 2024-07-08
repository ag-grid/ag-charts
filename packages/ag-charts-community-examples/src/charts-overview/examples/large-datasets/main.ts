import type { AgCartesianChartOptions, AgCartesianSeriesOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';

import { getData } from './data';

const count = 100_000;

const highlightTheme = {
    highlightStyle: {
        series: {
            dimOpacity: 0.2,
        },
    },
};

const series: AgCartesianSeriesOptions[] = [
    {
        data: getData(count),
        type: 'scatter',
        xKey: 'time',
        yKey: 'value',
        yName: 'Scatter',
    },
    {
        data: getData(count),
        type: 'line',
        xKey: 'time',
        yKey: 'value',
        yName: 'Line',
        marker: { enabled: true },
    },
    {
        data: getData(count),
        type: 'area',
        xKey: 'time',
        yKey: 'value',
        yName: 'Area',
        marker: { enabled: true },
    },
    {
        data: getData(count),
        type: 'bar',
        xKey: 'time',
        yKey: 'value',
        yName: 'Column',
    },
];

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: `${series.length}x ${Intl.NumberFormat().format(count)} data points!`,
        spacing: 25,
    },
    theme: {
        overrides: {
            line: { series: highlightTheme },
            scatter: { series: highlightTheme },
            area: { series: highlightTheme },
            bar: { series: highlightTheme },
        },
    },
    axes: [
        { type: 'number', position: 'left', min: 0, max: 10_000 },
        { type: 'time', position: 'bottom' },
    ],
    series,
};

const chart = AgCharts.create(options);
(window as any).chart = chart;
