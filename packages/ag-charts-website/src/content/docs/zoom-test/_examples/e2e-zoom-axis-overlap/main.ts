import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    zoom: {
        enabled: true,
    },
    padding: {
        top: 10,
        left: 0,
        right: 40,
        bottom: 0,
    },
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            crossAt: { value: 35 },
            title: { text: 'Index' },
            line: {
                stroke: 'black',
            },
            paddingOuter: 0,
        },
        y: {
            type: 'number',
            position: 'left',
            crossAt: { value: 5 },
            title: { text: 'Value' },
            line: {
                stroke: 'black',
            },
        },
    },
    series: [
        {
            type: 'bar',
            xKey: 'x',
            yKey: 'y',
        },
    ],
};

AgCharts.create(options);
