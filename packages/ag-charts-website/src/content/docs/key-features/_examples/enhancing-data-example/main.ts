import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { DataType } from './data';
import { getData } from './data';

const customItems = ['Jun', 'Jul', 'Aug', 'Sep'];

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'temp',
            yName: 'Temperature',
            marker: {
                shape: 'diamond',
                size: 12,
                fill: 'green',
                itemStyler: ({ datum, fill, highlighted }) => {
                    return {
                        fill: customItems.includes(datum.month) ? (highlighted ? 'yellow' : 'red') : fill,
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
    axes: {
        x: {
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
        y: {
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
    },
};

const chart = AgCharts.create(options);
