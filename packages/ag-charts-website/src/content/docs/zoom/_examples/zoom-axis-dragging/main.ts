import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    zoom: {
        enabled: true,
    },
    tooltip: {
        enabled: false,
    },
    axes: [
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Spending',
            },
            keys: ['spending'],
            minSpacing: 80,
            maxSpacing: 120,
        },
        {
            type: 'number',
            position: 'right',
            title: {
                text: 'Tonnes',
            },
            keys: ['tonnes'],
            minSpacing: 80,
            maxSpacing: 120,
        },
        {
            type: 'number',
            position: 'bottom',
            nice: false,
            minSpacing: 80,
            maxSpacing: 120,
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
        {
            type: 'line',
            xKey: 'year',
            yKey: 'tonnes',
        },
    ],
};

AgCharts.create(options);
