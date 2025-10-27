import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getBenchmark1Data, getBenchmark2Data } from './data';
import { formatBytes, formatMillis, labelFormatter } from './utils';

const commonOptions: AgCartesianChartOptions = {
    sync: { axes: 'xy' },
    tooltip: { mode: 'single' },
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
