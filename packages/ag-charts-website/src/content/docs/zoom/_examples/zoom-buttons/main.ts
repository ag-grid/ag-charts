import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    zoom: {
        enabled: true,
        buttons: {
            buttons: [
                {
                    icon: 'zoom-out',
                    tooltip: 'Zoom out',
                    label: 'Zoom out',
                    value: 'zoom-out',
                },
                {
                    icon: 'zoom-in',
                    tooltip: 'Zoom in',
                    label: 'Zoom in',
                    value: 'zoom-in',
                },
            ],
        },
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
            label: {
                autoRotate: false,
            },
            tick: {
                minSpacing: 50,
                maxSpacing: 200,
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
