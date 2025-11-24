import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getBenchmark1Data, getBenchmark2Data } from './data';
import { formatBytes, formatMillis, labelFormatter } from './utils';

const commonOptions: AgCartesianChartOptions = {
    sync: { axes: 'xy' },
    tooltip: { mode: 'single' },
    axes: {
        x: {
            type: 'number',
            label: { formatter: labelFormatter(formatMillis) },
        },
        xSecondary: {
            type: 'number',
            label: { formatter: labelFormatter(formatBytes) },
        },
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'name',
            yKey: `timeMs`,
            yName: `Time`,
            stackGroup: 'time',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'name',
            yKey: `heapUsed`,
            yName: `Heap`,
            xKeyAxis: 'xSecondary',
            stackGroup: 'memory',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'name',
            yKey: `canvasBytes`,
            yName: `Canvas`,
            xKeyAxis: 'xSecondary',
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
};

AgCharts.create(chartOptions1);

const chartOptions2 = {
    ...commonOptions,
    container: document.getElementById('myChart2'),
    title: {
        text: 'Benchmark 2',
    },
    data: getBenchmark2Data(),
};

AgCharts.create(chartOptions2);
