import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Engine Size Distribution',
    },
    subtitle: {
        text: 'USA 1987',
    },
    footnote: {
        text: 'Source: UCI',
    },
    series: [
        {
            type: 'histogram',
            xKey: 'engine-size',
            xName: 'Engine Size',
            stroke: 'transparent',
            strokeWidth: 2,
            cornerRadius: 6,
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'number',
            nice: false,
            title: {
                text: 'Engine Size (Cubic Inches)',
            },
        },
        {
            position: 'left',
            type: 'number',
            gridLine: {
                enabled: false,
            },
            title: {
                text: 'Frequency',
            },
        },
    ],
};

AgCharts.create(options);
