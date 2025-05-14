import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const customItems = ['Jun', 'Jul', 'Aug', 'Sep'];

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            xKey: 'month',
            yKey: 'temp',
            yName: 'Temperature',
            marker: {
                shape: 'diamond',
                size: 12,
                fill: 'green',
                itemStyler: ({ datum, xKey, fill, highlighted }) => {
                    return {
                        fill: customItems.includes(datum[xKey]) ? (highlighted ? 'yellow' : 'red') : fill,
                    };
                },
            },
        },
    ],
    legend: {
        enabled: true,
        position: 'top',
        toggleSeries: false,
    },
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

const chart = AgCharts.create(options);
