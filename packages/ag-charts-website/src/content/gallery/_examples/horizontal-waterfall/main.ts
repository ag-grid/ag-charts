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
            totals: [
                {
                    totalType: 'total',
                    index: 4,
                    axisLabel: 'Total Budget',
                },
                {
                    totalType: 'subtotal',
                    index: 10,
                    axisLabel: 'Total Spending',
                },
            ],
            line: {
                enabled: false,
            },
            item: {
                positive: {
                    fillOpacity: 0.3,
                    strokeWidth: 1,
                    lineDash: [2],
                    label: {
                        formatter: ({ value }) => `${value < 0 ? '-' : '+'}${Math.abs(value).toFixed(0)}`,
                    },
                },
                negative: {
                    fillOpacity: 0.3,
                    strokeWidth: 1,
                    lineDash: [2],
                    label: {
                        formatter: ({ value }) => `${value < 0 ? '-' : '+'}${Math.abs(value).toFixed(0)}`,
                    },
                },
                total: {
                    fillOpacity: 0.3,
                    label: {
                        placement: 'inside',
                        formatter: ({ value }) => `${value < 0 ? '-' : '+'}£${Math.abs(value).toFixed(0)} bn`,
                    },
                },
            },
        },
    ],
};

AgCharts.create(options);
