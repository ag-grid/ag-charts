import { AgCartesianChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

import { getBenchmark1Data, getBenchmark2Data } from './data';

const commonOptions = {
    sync: { axes: 'xy' },
    tooltip: { mode: 'single' },
    series: [
        {
            type: 'bar',
            xKey: 'name',
            yKey: `timeMs`,
            yName: `Time`,
            stackGroup: 'time',
            fill: '#5090dc',
        },
        {
            type: 'bar',
            xKey: 'name',
            yKey: `heapUsed`,
            yName: `Heap`,
            stackGroup: 'memory',
            fill: '#ffa03a',
        },
        {
            type: 'bar',
            xKey: 'name',
            yKey: `canvasBytes`,
            yName: `Canvas`,
            stackGroup: 'memory',
            fill: '#459d55',
        },
    ],
    // tooltip: { mode: 'shared' },
} satisfies AgCartesianChartOptions;

const chartOptions1 = {
    ...commonOptions,
    container: document.getElementById('myChart1'),
    title: {
        text: 'Benchmark 1',
    },
    data: getBenchmark1Data(),
    series: [commonOptions.series[0], commonOptions.series[1]],
};

AgCharts.create(chartOptions1);

const chartOptions2 = {
    ...commonOptions,
    container: document.getElementById('myChart2'),
    title: {
        text: 'Benchmark 2',
    },
    data: getBenchmark2Data(),
    series: [commonOptions.series[1], commonOptions.series[2]],
};

AgCharts.create(chartOptions2);

const chartOptions3 = {
    ...commonOptions,
    container: document.getElementById('myChart3'),
    title: {
        text: 'Benchmark 2',
    },
    data: getBenchmark2Data(),
    series: [commonOptions.series[0]],
};

AgCharts.create(chartOptions3);
