import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    zoom: {
        enabled: true,
        enableAxisDragging: true,
        enableAxisScrolling: true,
        axisDraggingMode: 'zoom',
    },
    tooltip: {
        enabled: false,
    },
    axes: {
        y: {
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
        ySecondary: {
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
        x: {
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
    },
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

function setAxisDragging(mode: 'zoom' | 'pan') {
    options.zoom!.axisDraggingMode = mode;
    chart.update(options);
}

function enableAxisDragging(enabled: 'on' | 'off') {
    options.zoom!.enableAxisDragging = enabled === 'on';
    chart.update(options);
}

function enableAxisScrolling(enabled: 'on' | 'off') {
    options.zoom!.enableAxisScrolling = enabled === 'on';
    chart.update(options);
}
