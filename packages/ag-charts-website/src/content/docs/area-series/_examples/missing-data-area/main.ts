import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

let connectNulls = false;

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
            yName: 'Subscriptions',
            connectNulls,
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'services',
            yName: 'Services',
            connectNulls,
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'products',
            yName: 'Products',
            connectNulls,
        },
    ],
};

AgCharts.create(options);

function toggleConnectNulls() {
    connectNulls = !connectNulls;
    AgCharts.updateDelta(chart, {
        series: options.series.map((series) => ({
            ...series,
            connectNulls,
        })),
    });
}
