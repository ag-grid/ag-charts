import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Monthly Cost Breakdown by Category and Projection Type',
    },
    series: [
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'a_value',
            stacked: true,
            label: {},
        },
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'b_value',
            stacked: true,
            label: {},
        },
    ],
    axes: {
        x: {
            type: 'grouped-category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
    legend: {
        enabled: false,
    },
};

const chart = AgCharts.create(options);
