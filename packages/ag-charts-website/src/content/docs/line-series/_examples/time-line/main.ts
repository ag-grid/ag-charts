import { AgCharts, AgChartOptions } from 'ag-charts-community';

import { getLoungeData, getOfficeData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Temperature Readings',
    },
    series: [
        {
            data: getLoungeData(),
            xKey: 'time',
            yKey: 'sensor',
            yName: 'Lounge',
        },
        {
            data: getOfficeData(),
            xKey: 'time',
            yKey: 'sensor',
            yName: 'Office',
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
            label: {
                format: '#{.1f} °C',
            },
        },
    ],
};

AgCharts.create(options);
