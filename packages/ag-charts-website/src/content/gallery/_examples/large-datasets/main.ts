import { AgCartesianChartOptions, AgCartesianSeriesOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';
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
        marker: { enabled: true },
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
        yName: 'bar',
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
            cartesian: {
                series: {
                    line: highlightTheme,
                    scatter: highlightTheme,
                    area: highlightTheme,
                    bar: highlightTheme,
                },
            },
        },
    },
    axes: [
        { type: 'number', position: 'left', min: 0, max: 10_000 },
        { type: 'time', position: 'bottom' },
    ],
    series,
};

const chart = AgEnterpriseCharts.create(options);
(window as any).chart = chart;
