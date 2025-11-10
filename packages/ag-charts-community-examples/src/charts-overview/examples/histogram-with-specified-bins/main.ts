import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Vehicle weight distribution',
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
            xKey: 'curb-weight',
            xName: 'Curb weight',
            fillOpacity: 0.5,
            fill: '#8888ff',
            stroke: '#000',
            bins: [
                [0, 2000],
                [2000, 3000],
                [3000, 4500],
            ],
            areaPlot: true,
        },
    ],
    axes: {
        x: {
            type: 'number',
            position: 'bottom',
            title: {
                text: 'Curb weight (pounds)',
            },
            interval: {
                step: 500,
            },
        },
        y: {
            type: 'number',
            position: 'left',
            label: {
                formatter: () => '',
            },
        },
    },
};

AgCharts.create(options);
