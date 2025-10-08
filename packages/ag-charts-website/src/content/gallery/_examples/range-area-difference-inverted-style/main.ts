import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Balance of Trade' },
    subtitle: { text: 'Trade fluctuations from 1945 to 2025' },
    data: getData(),
    series: [
        {
            type: 'range-area',
            xKey: 'year',
            xName: 'Date',
            yLowKey: 'exports',
            yHighKey: 'imports',
            yLowName: 'Target',
            yHighName: 'Actual',
            fill: 'green',
            fillOpacity: 0.4,
            invertedStyle: {
                fill: 'red',
            },
            item: {
                low: {
                    strokeWidth: 2,
                    stroke: 'grey',
                },
                high: {
                    strokeWidth: 2,
                    stroke: 'grey',
                },
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'right',
            interval: {
                step: 10,
            },
            title: {
                text: '£ millions',
            },
        },
        {
            type: 'category',
            position: 'bottom',
            gridLine: {
                enabled: true,
            },
        },
    ],
};

AgCharts.create(options);
