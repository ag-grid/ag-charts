import { AgAreaSeriesOptions, AgChartOptions, AgCharts } from 'ag-charts-community';

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
    ],
};

const chart = AgCharts.create(options);

function enableBringToFront() {
    options.series!.forEach((series) => {
        (series as AgAreaSeriesOptions).highlight = { bringToFront: true };
    });
    chart.update(options);
}

function disableBringToFront() {
    options.series!.forEach((series) => {
        (series as AgAreaSeriesOptions).highlight = { bringToFront: false };
    });
    chart.update(options);
}
