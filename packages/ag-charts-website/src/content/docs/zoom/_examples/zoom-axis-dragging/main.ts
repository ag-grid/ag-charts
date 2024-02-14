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
            tick: {
                minSpacing: 80,
                maxSpacing: 120,
            },
        },
        {
            type: 'number',
            position: 'right',
            title: {
                text: 'Tonnes',
            },
            keys: ['tonnes'],
            tick: {
                minSpacing: 80,
                maxSpacing: 120,
            },
        },
        {
            type: 'number',
            position: 'bottom',
            nice: false,
            label: {
                autoRotate: false,
            },
            tick: {
                minSpacing: 80,
                maxSpacing: 120,
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
