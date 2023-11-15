import { AgCharts, AgChartOptions } from 'ag-charts-community';

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
            calloutLabelKey: 'asset',
            angleKey: 'amount',
            innerRadiusRatio: 0.7,
        },
    ],
};

AgCharts.create(options);
