import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'World Population Over Time',
    },
    subtitle: {
        text: 'log scale',
    },
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'population',
        },
    ],
    axes: {
        y: {
            type: 'log',
            position: 'left',
            title: {
                text: 'Population',
            },
            label: {
                format: ',.0f',
            },
        },
        x: {
            type: 'number',
            position: 'bottom',
            title: {
                text: 'Year',
            },
        },
    },
    annotations: {
        enabled: true,
    },
};

AgCharts.create(options);
