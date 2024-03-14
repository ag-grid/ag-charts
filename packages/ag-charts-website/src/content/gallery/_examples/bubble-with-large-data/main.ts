import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Earth',
    },
    footnote: {
        text: 'The world represented in bubbles',
    },
    series: [
        {
            type: 'bubble',
            xKey: 'x',
            yKey: 'y',
            sizeKey: 'r',
            marker: {
                size: 1,
                maxSize: 25,
                fillOpacity: 0,
            },
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'number',
            nice: false,
            gridLine: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
            crosshair: {
                enabled: false,
            },
        },
        {
            position: 'left',
            type: 'number',
            nice: false,
            gridLine: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
            crosshair: {
                enabled: false,
            },
        },
    ],
};

AgCharts.create(options);
