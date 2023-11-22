import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const formatNumber = (value: number, dp: number) => `£${value.toFixed(dp)}m`;

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Revenue per Quarter',
    },
    subtitle: {
        text: '£ million',
    },
    series: [
        {
            type: 'heatmap',

            xKey: 'month',
            xName: 'Month',

            yKey: 'year',
            yName: 'Year',

            colorKey: 'revenue',
            colorName: 'Revenue',

            colorRange: ['#e5f5e0', '#a1d99b'],

            label: {
                enabled: true,
                formatter: ({ value }) => formatNumber(value, 1),
            },
        },
    ],
    gradientLegend: {
        stop: {
            label: {
                formatter: ({ value }) => formatNumber(Number(value), 0),
            },
        },
    },
};

AgCharts.create(options);
