import { AgChart, AgChartOptions } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Portfolio Composition',
    },
    subtitle: {
        text: 'Showing Annual Yield',
    },
    series: [
        {
            type: 'pie',
            angleKey: 'amount',
            radiusKey: 'yield',
        },
    ],
};

AgChart.create(options);
