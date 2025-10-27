import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getBenchmark1Data, getBenchmark2Data } from './data';
import { formatBytes, formatMillis, labelFormatter } from './utils';

const commonOptions: AgCartesianChartOptions = {
    sync: { axes: 'xy' },
    axes: {
        x: {
            type: 'category',
        },
        y: {
            type: 'number',
            position: 'left',
            keys: [`timeMs`],
            label: { formatter: labelFormatter(formatMillis) },
        },
        ySecondary: {
            type: 'number',
            position: 'right',
            keys: [`heapUsed`, `canvasBytes`],
            label: { formatter: labelFormatter(formatBytes) },
        },
    },
    series: [
        {
            type: 'bar',
            xKey: 'name',
            yKey: `timeMs`,
            yName: `Time`,
            stackGroup: 'time',
        },
        {
            type: 'bar',
            xKey: 'name',
            yKey: `heapUsed`,
            yName: `Heap`,
            stackGroup: 'memory',
        },
        {
            type: 'bar',
            xKey: 'name',
            yKey: `canvasBytes`,
            yName: `Canvas`,
            stackGroup: 'memory',
        },
    ],
    // tooltip: { mode: 'shared' },
};

const chartOptions1 = {
    ...commonOptions,
    container: document.getElementById('myChart1'),
    title: {
        text: 'Benchmark 1',
    },
    data: getBenchmark1Data(),
    series: commonOptions.series?.slice(0, 1),
} satisfies AgCartesianChartOptions;

AgCharts.create(chartOptions1);

const chartOptions2 = {
    ...commonOptions,
    container: document.getElementById('myChart2'),
    title: {
        text: 'Benchmark 2',
    },
    data: getBenchmark2Data(),
    series: commonOptions.series?.slice(1, 2),
} satisfies AgCartesianChartOptions;

AgCharts.create(chartOptions2);

const chartOptions3 = {
    ...commonOptions,
    container: document.getElementById('myChart3'),
    sync: { axes: 'x' },
    title: {
        text: 'Benchmark 2',
    },
    data: getBenchmark2Data(),
    series: commonOptions.series?.slice(2, 3),
} satisfies AgCartesianChartOptions;

AgCharts.create(chartOptions3);
