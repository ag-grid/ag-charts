import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: `World Population`,
    },
    series: [
        {
            yKey: 'population',
            xKey: 'year',
            stroke: '#6769EB',
            marker: {
                fill: '#6769EB',
                stroke: '#6769EB',
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
            label: {
                formatter: (params) => `${params.value / 1000000000}B`,
            },
            crosshair: {
                enabled: true,
            },
        },
        {
            type: 'category',
            position: 'bottom',
            crosshair: {
                enabled: true,
            },
        },
    ],
    tooltip: {
        enabled: false,
    },
};

AgCharts.create(options);
