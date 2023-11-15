import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Portfolio Composition',
    },
    series: [
        {
            type: 'pie',
            angleKey: 'amount',
            legendItemKey: 'asset',
        },
    ],
};

AgCharts.create(options);
