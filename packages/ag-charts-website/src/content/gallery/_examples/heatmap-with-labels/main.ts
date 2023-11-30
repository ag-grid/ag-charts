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

            labelKey: 'revenue',
            secondaryLabelKey: 'change',

            label: {
                formatter: ({ value }) => `£${value.toFixed(1)}m`,
            },
            secondaryLabel: {
                formatter: ({ value }) => `${value > 0 ? '+' : '-'}${Math.abs(value * 100).toFixed(0)}%`,
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
