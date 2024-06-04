import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Engine size distribution',
        fontSize: 18,
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
            fillOpacity: 0.5,
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            title: {
                text: 'Engine Size (Cubic inches)',
            },
            interval: 20,
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Frequency',
            },
        },
    ],
};

const chart = AgCharts.create(options);
