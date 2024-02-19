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
        },
        {
            type: 'number',
            position: 'bottom',
            nice: false,
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
