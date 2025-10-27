import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { regionAdata, regionBdata } from './data';

const commonOptions: AgCartesianChartOptions = {
    sync: { axes: 'xy' },
    series: [
        {
            type: 'bar',
            xKey: 'date',
            yKey: 'domestic',
            yName: 'Domestic',
        },
        {
            type: 'bar',
            xKey: 'date',
            yKey: 'international',
            yName: 'International',
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'product',
            yName: 'Product',
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'services',
            yName: 'Services',
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
            max: 100,
            keys: ['domestic', 'international'],
        },
        ySecondary: {
            type: 'number',
            position: 'right',

            keys: ['product', 'services'],
        },
    },
    tooltip: { mode: 'single' },
};

const chartOptions1 = {
    ...commonOptions,
    container: document.getElementById('myChart1'),
    title: {
        text: 'Region A',
    },
    data: regionAdata,
};

AgCharts.create(chartOptions1);

const chartOptions2 = {
    ...commonOptions,
    container: document.getElementById('myChart2'),
    title: {
        text: 'Region B',
    },
    data: regionBdata,
};

AgCharts.create(chartOptions2);
