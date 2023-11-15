import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Range Bar - Horizontal',
    },
    series: [
        {
            type: 'range-bar',
            direction: 'horizontal',
            xKey: 'date',
            xName: 'Date',
            yLowKey: 'low',
            yHighKey: 'high',
        },
    ],
};

AgCharts.create(options);
