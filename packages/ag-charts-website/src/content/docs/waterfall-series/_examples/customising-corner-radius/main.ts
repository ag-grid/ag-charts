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
            xKey: 'financials',
            xName: 'Financials',
            yKey: 'amount',
            yName: 'Amount',
            // item: {
            //     positive: {
            //         cornerRadius: 10,
            //     },
            //     negative: {
            //         cornerRadius: 10,
            //     },
            //     total: {
            //         cornerRadius: 10,
            //     },
            // },
        },
    ],
};

AgCharts.create(options);
