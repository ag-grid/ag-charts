import { AgCharts, AgChartOptions, time } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            xKey: 'month',
            yKey: 'temp',
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'category',
            title: {
                text: 'Month',
            },
            crossLines: [
                {
                    type: 'range',
                    range: ['Jun', 'Sep'],
                },
            ],
        },
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'Temperature (°C)',
            },
            crossLines: [
                {
                    type: 'line',
                    value: 11,
                },
            ],
        },
    ],
};

var chart = AgCharts.create(options);
