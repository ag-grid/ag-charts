import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    zoom: {
        enabled: true,
        autoScaling: { enabled: true },
    },
    tooltip: {
        enabled: false,
    },
    navigator: {
        miniChart: {
            enabled: true,
        },
    },
    axes: {
        x: {
            type: 'number',
            nice: false,
            interval: {
                minSpacing: 80,
                maxSpacing: 120,
            },
            label: {
                autoRotate: false,
            },
        },
    },
    data: getData(),
    animation: {
        duration: 1500, // ms
    },
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'spending',
            marker: {
                enabled: false,
            },
        },
    ],
};

const chart = AgCharts.create(options);
