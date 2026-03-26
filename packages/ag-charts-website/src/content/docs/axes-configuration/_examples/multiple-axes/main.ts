import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Monthly Revenue and Profit',
    },
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'profit',
            yName: 'Profit Margin',
            yKeyAxis: 'profit',
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'revenue',
            yName: 'Revenue',
            yKeyAxis: 'revenue',
        },
    ],
    axes: {
        revenue: {
            type: 'number',
            position: 'right',
            title: { text: 'Revenue' },
        },
        profit: {
            type: 'number',
            position: 'left',
            title: { text: 'Profit' },
        },
    },
};

AgCharts.create(options);
