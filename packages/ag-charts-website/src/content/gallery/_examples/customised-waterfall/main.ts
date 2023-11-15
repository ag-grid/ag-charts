import { AgCharts, AgChartOptions } from 'ag-charts-enterprise';

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
            item: {
                total: {
                    name: 'Total / Subtotal',
                },
            },
            totals: [
                { totalType: 'subtotal', index: 4, axisLabel: 'Total\nRevenue' },
                {
                    totalType: 'subtotal',
                    index: 9,
                    axisLabel: 'Total\nExpenditure',
                },
                { totalType: 'total', index: 9, axisLabel: 'Total\nBorrowing' },
            ],
        },
    ],
};

AgCharts.create(options);
