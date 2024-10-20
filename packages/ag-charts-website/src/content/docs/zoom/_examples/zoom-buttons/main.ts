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
            type: 'time',
            position: 'bottom',
            nice: false,
            interval: {
                minSpacing: 50,
                maxSpacing: 200,
            },
            label: {
                autoRotate: false,
            },
            crosshair: {
                label: {
                    format: `%d %b %Y`,
                },
            },
        },
    ],
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'price',
        },
    ],
};

AgCharts.create(options);
