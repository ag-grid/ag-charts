import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    zoom: {
        enabled: true,
    },
    initialState: {
        zoom: {
            ratioX: { start: 0.8, end: 1.0 },
            ratioY: { start: 0.2, end: 0.6 },
        },
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
            interval: {
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
        {
            type: 'line',
            xKey: 'year',
            yKey: 'tonnes',
        },
    ],
};

const chart = AgCharts.create(options);

function setAxisMode(mode: 'zoom' | 'pan') {
    options.zoom!.axisDraggingMode = mode;
    chart.update(options);
}
