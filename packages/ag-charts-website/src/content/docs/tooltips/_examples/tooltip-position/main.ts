import { AgChart, AgChartOptions } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'sweaters',
            yName: 'Sweaters Made',
        },
    ],
    tooltip: {
        showArrow: false,
        position: {
            type: 'pointer',
            xOffset: 80,
            yOffset: 80,
        },
    },
};

var chart = AgChart.create(options);
