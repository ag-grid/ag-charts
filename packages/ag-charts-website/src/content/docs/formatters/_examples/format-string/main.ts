import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'temp',
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'time',
            position: 'bottom',
            interval: { step: 'month' },
        },
    ],
    formatter: {
        x: '%b %Y',
        y: '$#{0>6.2f}',
    },
};

AgCharts.create(options);
