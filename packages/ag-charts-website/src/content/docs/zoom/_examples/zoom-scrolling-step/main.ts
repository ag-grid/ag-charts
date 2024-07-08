import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    zoom: {
        enabled: true,
        scrollingStep: 0.4,
    },
    tooltip: {
        enabled: false,
    },
    axes: [
        {
            type: 'number',
            position: 'left',
            interval: {
                minSpacing: 80,
                maxSpacing: 120,
            },
        },
        {
            type: 'number',
            position: 'bottom',
            nice: false,
            interval: {
                minSpacing: 80,
                maxSpacing: 120,
            },
            label: {
                autoRotate: false,
            },
        },
    ],
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'spending',
        },
    ],
};

AgCharts.create(options);
