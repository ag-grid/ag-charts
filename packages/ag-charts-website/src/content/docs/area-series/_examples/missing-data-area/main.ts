import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

let connectMissingData = false;

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
            connectMissingData,
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'services',
            yName: 'Services',
            connectMissingData,
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'products',
            yName: 'Products',
            connectMissingData,
        },
    ],
};

const chart = AgCharts.create(options);

function toggleConnectMissingData() {
    connectMissingData = !connectMissingData;
    AgCharts.updateDelta(chart, {
        series: options.series.map((series) => ({
            ...series,
            connectMissingData,
        })),
    });
}
