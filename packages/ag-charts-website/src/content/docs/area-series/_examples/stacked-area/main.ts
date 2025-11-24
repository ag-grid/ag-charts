import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Sales by Month',
    },
    data: getData(),
    series: [
        {
            type: 'area',
            xKey: 'month',
            yKey: 'subscriptions',
            stacked: true,
            yName: 'Subscriptions',
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'services',
            stacked: true,
            yName: 'Services',
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'products',
            stacked: true,
            yName: 'Products',
        },
    ],
};

AgCharts.create(options);
