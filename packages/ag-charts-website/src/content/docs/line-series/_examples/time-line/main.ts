import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { getLoungeData, getOfficeData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Temperature Readings',
    },
    series: [
        {
            type: 'line',
            data: getLoungeData(),
            xKey: 'time',
            yKey: 'sensor',
            yName: 'Lounge',
        },
        {
            type: 'line',
            data: getOfficeData(),
            xKey: 'time',
            yKey: 'sensor',
            yName: 'Office',
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
        },
        y: {
            type: 'number',
            label: {
                format: '#{.1f} °C',
            },
        },
    },
};

AgCharts.create(options);
