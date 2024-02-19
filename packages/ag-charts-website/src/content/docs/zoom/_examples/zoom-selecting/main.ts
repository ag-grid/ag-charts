import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    zoom: {
        enableAxisDragging: false,
        enablePanning: false,
        enableScrolling: false,
        enableSelecting: true,
    },
    tooltip: {
        enabled: false,
    },
    axes: [
        {
            type: 'number',
            position: 'left',
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
    ],
};

AgCharts.create(options);
