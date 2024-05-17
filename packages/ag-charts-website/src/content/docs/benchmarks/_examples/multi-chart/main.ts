/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

(window as any).agChartsDebug = 'scene:stats';

const theme: AgCartesianChartOptions['theme'] = {
    overrides: {
        common: {
            zoom: { enabled: true },
            sync: { enabled: true },
        },
    },
};
const axes: AgCartesianChartOptions['axes'] = [
    { type: 'time', position: 'bottom', crosshair: {} },
    { type: 'number', position: 'left' },
];

let chartIndex = 1;
const chartOptions1: AgCartesianChartOptions = {
    container: document.getElementById('myChart1'),
    theme,
    axes,
    data: getData(50, chartIndex++),
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            yName: 'Value',
        },
    ],
};

AgCharts.create(chartOptions1);

const chartOptions2: AgCartesianChartOptions = {
    container: document.getElementById('myChart2'),
    theme,
    axes,
    data: getData(50, chartIndex++),
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            yName: 'Value',
        },
    ],
};

AgCharts.create(chartOptions2);

const chartOptions3: AgCartesianChartOptions = {
    container: document.getElementById('myChart3'),
    theme,
    axes,
    data: getData(50, chartIndex++),
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            yName: 'Value',
        },
    ],
};

AgCharts.create(chartOptions3);

const chartOptions4: AgCartesianChartOptions = {
    container: document.getElementById('myChart4'),
    theme,
    axes,
    data: getData(50, chartIndex++),
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            yName: 'Value',
        },
    ],
};

AgCharts.create(chartOptions4);

const chartOptions5: AgCartesianChartOptions = {
    container: document.getElementById('myChart5'),
    theme,
    axes,
    data: getData(50, chartIndex++),
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            yName: 'Value',
        },
    ],
};

AgCharts.create(chartOptions5);

const chartOptions6: AgCartesianChartOptions = {
    container: document.getElementById('myChart6'),
    theme,
    axes,
    data: getData(50, chartIndex++),
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            yName: 'Value',
        },
    ],
};

AgCharts.create(chartOptions6);

const chartOptions7: AgCartesianChartOptions = {
    container: document.getElementById('myChart7'),
    theme,
    axes,
    data: getData(50, chartIndex++),
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            yName: 'Value',
        },
    ],
};

AgCharts.create(chartOptions7);

const chartOptions8: AgCartesianChartOptions = {
    container: document.getElementById('myChart8'),
    theme,
    axes,
    data: getData(50, chartIndex++),
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            yName: 'Value',
        },
    ],
};

AgCharts.create(chartOptions8);

const chartOptions9: AgCartesianChartOptions = {
    container: document.getElementById('myChart9'),
    theme,
    axes,
    data: getData(50, chartIndex++),
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            yName: 'Value',
        },
    ],
};

AgCharts.create(chartOptions9);

const chartOptions10: AgCartesianChartOptions = {
    container: document.getElementById('myChart10'),
    theme,
    axes,
    data: getData(50, chartIndex++),
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            yName: 'Value',
        },
    ],
};

AgCharts.create(chartOptions10);

const chartOptions11: AgCartesianChartOptions = {
    container: document.getElementById('myChart11'),
    theme,
    axes,
    data: getData(50, chartIndex++),
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            yName: 'Value',
        },
    ],
};

AgCharts.create(chartOptions11);

const chartOptions12: AgCartesianChartOptions = {
    container: document.getElementById('myChart12'),
    theme,
    axes,
    data: getData(50, chartIndex++),
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            yName: 'Value',
        },
    ],
};

AgCharts.create(chartOptions12);

const chartOptions13: AgCartesianChartOptions = {
    container: document.getElementById('myChart13'),
    theme,
    axes,
    data: getData(50, chartIndex++),
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            yName: 'Value',
        },
    ],
};

AgCharts.create(chartOptions13);

const chartOptions14: AgCartesianChartOptions = {
    container: document.getElementById('myChart14'),
    theme,
    axes,
    data: getData(50, chartIndex++),
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            yName: 'Value',
        },
    ],
};

AgCharts.create(chartOptions14);

const chartOptions15: AgCartesianChartOptions = {
    container: document.getElementById('myChart15'),
    theme,
    axes,
    data: getData(50, chartIndex++),
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            yName: 'Value',
        },
    ],
};

AgCharts.create(chartOptions15);

const chartOptions16: AgCartesianChartOptions = {
    container: document.getElementById('myChart16'),
    theme,
    axes,
    data: getData(50, chartIndex++),
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            yName: 'Value',
        },
    ],
};

AgCharts.create(chartOptions16);
