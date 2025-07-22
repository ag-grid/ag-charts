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

function setAxisDragging(mode: 'zoom' | 'pan' | false) {
    if (mode === false) {
        options.zoom!.enableAxisDragging = false;
    } else {
        options.zoom!.enableAxisDragging = true;
        options.zoom!.axisDraggingMode = mode;
    }
    chart.update(options);
}

function setAxisScrolling(enabled: boolean) {
    options.zoom!.enableAxisScrolling = enabled;
    chart.update(options);
}
