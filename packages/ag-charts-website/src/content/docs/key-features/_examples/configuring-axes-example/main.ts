import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'country',
            yKey: 'value',
        },
        {
            type: 'line',
            xKey: 'country',
            yKey: 'secondaryValue',
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
            label: {
                rotation: 45,
                autoRotate: false,
            },
        },
        {
            type: 'number',
            position: 'left',
            interval: { step: 125 },
            label: {
                rotation: 325,
                autoRotate: false,
            },
            keys: ['value'],
        },
        {
            type: 'number',
            position: 'right',
            interval: { step: 125 },
            label: {
                rotation: 325,
                autoRotate: false,
            },
            keys: ['secondaryValue'],
        },
    ],
};

const chart = AgCharts.create(options);
