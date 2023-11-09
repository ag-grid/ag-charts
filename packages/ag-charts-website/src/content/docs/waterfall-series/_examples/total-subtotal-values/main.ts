import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

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
            totals: [
                { totalType: 'subtotal', index: 4, axisLabel: 'Total Revenue' },
                { totalType: 'subtotal', index: 9, axisLabel: 'Total Expenditure' },
                { totalType: 'total', index: 9, axisLabel: 'Total Borrowing' },
            ],
        },
    ],
};

AgEnterpriseCharts.create(options);
