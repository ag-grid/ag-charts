import { AgCharts, AgChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Average High and Low Temperatures',
    },
    series: [
        {
            type: 'range-area',
            xKey: 'month',
            xName: 'Month',
            yLowKey: 'low',
            yHighKey: 'high',
        } as any,
    ],
};

AgCharts.create(options);
