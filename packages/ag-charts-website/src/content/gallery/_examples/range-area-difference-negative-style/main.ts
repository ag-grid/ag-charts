import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'GBP/EUR',
    },
    subtitle: {
        text: 'Historical Daily Exchange Rate (Sep 2024 - Sep 2025)',
    },
    data: getData(),
    series: [
        {
            type: 'range-area',
            xKey: 'date',
            xName: 'Date',
            yLowKey: 'baseline',
            yHighKey: 'close',
            yLowName: 'Baseline',
            yHighName: 'Close Price',
            fill: 'green',
            fillOpacity: 0.5,
            strokeWidth: 0,
            negativeStyle: {
                fill: 'red',
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'right',
            crosshair: {
                enabled: true,
            },
            interval: {
                step: 0.01,
            },
        },
        {
            type: 'unit-time',
            position: 'bottom',
            gridLine: {
                enabled: true,
            },
        },
    ],
};

AgCharts.create(options);
