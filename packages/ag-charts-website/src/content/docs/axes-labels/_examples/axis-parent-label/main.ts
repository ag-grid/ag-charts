import { AgCartesianChartOptions, AgCharts, time } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(40),
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'price',
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
            unit: time.day,
            division: {
                enabled: true,
            },
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
};

AgCharts.create(options);
