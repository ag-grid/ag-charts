import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'area',
            xKey: 'month',
            yKey: 'subscriptions',
            yName: 'Subscriptions',
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'services',
            yName: 'Services',
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'products',
            yName: 'Products',
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'services',
            yName: 'Services2',
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'products',
            yName: 'Products3',
        },
    ],
};

AgCharts.create(options);
