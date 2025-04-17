import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Streaming Music Sales',
    },
    subtitle: {
        text: 'IN BILLIONS USD',
    },
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'sales',
            yName: 'Sales',
            strokeWidth: 1,
            fill: {
                type: 'pattern',
                path: 'M0,6 Q4,1 8,6 T16,6',
                width: 16,
                height: 10,
                strokeWidth: 1,
            },
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
            nice: false,
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
};

AgCharts.create(options);
