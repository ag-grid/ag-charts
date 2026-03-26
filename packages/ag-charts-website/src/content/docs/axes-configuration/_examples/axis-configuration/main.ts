import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Monthly Sales',
    },
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'sales',
            yName: 'Sales',
        },
    ],
    axes: {
        x: {
            type: 'category',
            label: { fontSize: 15 },
        },
        y: {
            type: 'number',
            title: { text: 'Sales (USD)' },
        },
    },
};

AgCharts.create(options);
