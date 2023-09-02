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
            item: {
                positive: {
                    fill: '#4A90E2',
                    stroke: '#4A90E2',
                },
                negative: {
                    fill: '#FF6B6B',
                    stroke: '#FF6B6B',
                },
                total: {
                    name: 'Total / Subtotal',
                    fill: '#7D7D7D',
                    stroke: '#7D7D7D',
                },
            },
            totals: [
                { totalType: 'subtotal', index: 4, axisLabel: 'Total Revenue' },
                {
                    totalType: 'subtotal',
                    index: 9,
                    axisLabel: 'Total Expenditure',
                },
                { totalType: 'total', index: 9, axisLabel: 'Total Borrowing' },
            ],
        },
    ],
};

AgEnterpriseCharts.create(options);
