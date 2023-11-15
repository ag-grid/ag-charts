import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'UK Government Budget',
    },
    subtitle: {
        text: 'All values in £ billions',
    },
    series: [
        {
            type: 'waterfall',
            direction: 'horizontal',
            xKey: 'financials',
            xName: 'Financials',
            yKey: 'amount',
            yName: 'Amount',
        },
    ],
};

AgCharts.create(options);
