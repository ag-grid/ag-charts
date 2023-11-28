import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'sweaters',
            yName: 'Sweaters Made',
        },
    ],
    tooltip: {
        class: 'my-tooltip',
    },
};

const chart = AgCharts.create(options);
