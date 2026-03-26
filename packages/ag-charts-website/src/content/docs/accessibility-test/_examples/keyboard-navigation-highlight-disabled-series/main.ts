// @ag-skip-fws
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Keyboard Navigation Highlight Disabled Series',
    },
    data: getData(),
    animation: { enabled: false },
    keyboard: { enabled: true },
    legend: { enabled: false },
    axes: {
        x: { position: 'bottom', type: 'category', crosshair: { enabled: false } },
        y: { position: 'left', type: 'number', crosshair: { enabled: false } },
    },
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'apples',
            yName: 'Apples',
            highlight: {
                enabled: false,
                highlightedItem: { fill: '#000000' },
                unhighlightedSeries: { opacity: 0.2 },
            },
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'oranges',
            yName: 'Oranges',
            highlight: {
                highlightedItem: { strokeWidth: 3 },
                unhighlightedSeries: { opacity: 0.2 },
            },
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'bananas',
            yName: 'Bananas',
            highlight: {
                highlightedItem: { strokeWidth: 3 },
                unhighlightedSeries: { opacity: 0.2 },
            },
        },
    ],
};

AgCharts.create(options);
