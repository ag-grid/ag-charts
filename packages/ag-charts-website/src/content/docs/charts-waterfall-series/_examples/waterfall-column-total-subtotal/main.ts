import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'UK Govornment Budget',
    },
    subtitle: {
        text: 'All values in £bns',
    },
    series: [
        {
            type: 'waterfall-column',
            xKey: 'source',
            xName: 'Source',
            yKey: 'amount',
            yName: 'Amount',
            totals: [
                { totalType: 'total', index: 4, axisLabel: 'Total \nRevenue' },
                { totalType: 'subtotal', index: 10, axisLabel: 'Total \nExpenditure' },
                { totalType: 'total', index: 10, axisLabel: 'Borrowing' },
            ],
        },
    ],
};

AgEnterpriseCharts.create(options);
