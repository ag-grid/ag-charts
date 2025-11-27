import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    animation: { enabled: false },
    zoom: {
        enabled: true,
    },
    tooltip: {
        enabled: false,
    },
    axes: {
        x: {
            type: 'number',
            nice: false,
            crosshair: { snap: false },
        },
    },
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
