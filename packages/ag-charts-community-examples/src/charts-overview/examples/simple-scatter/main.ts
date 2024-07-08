import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Height vs Weight for Major League Baseball Players',
        fontSize: 18,
        spacing: 25,
    },
    footnote: {
        text: 'Source: Statistics Online Computational Resource',
    },
    series: [
        {
            type: 'scatter',
            xKey: 'weight',
            yKey: 'height',
            size: 12,
            fill: '#002D72',
            fillOpacity: 0.5,
            strokeOpacity: 0,
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'number',
            title: {
                text: 'Weight (pounds)',
            },
        },
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'Height (inches)',
            },
        },
    ],
};

const chart = AgCharts.create(options);
