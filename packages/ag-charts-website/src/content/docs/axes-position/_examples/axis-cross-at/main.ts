import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    theme: {
        overrides: {
            common: {
                axes: {
                    number: {
                        line: {
                            enabled: true,
                            stroke: 'red',
                        },
                        tick: {
                            enabled: true,
                            size: 12,
                            stroke: 'red',
                        },
                        label: {
                            color: 'red',
                        },
                    },
                },
            },
        },
    },
    title: { text: 'Axes crossing at 0', fontWeight: 'bold' },
    data: getData(),
    axes: [
        {
            type: 'number',
            position: 'bottom',
            crossAt: {
                value: 0,
            },
        },
        {
            type: 'number',
            position: 'left',
            crossAt: {
                value: 0,
            },
        },
    ],
    series: [
        {
            type: 'line',
            xKey: 'x',
            yKey: 'y',
            yName: 'Function plot',
            strokeWidth: 3,
            marker: { size: 0 },
        },
    ],
};

AgCharts.create(options);
