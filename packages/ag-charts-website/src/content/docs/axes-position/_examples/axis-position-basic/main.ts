import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Company Financials (2023)',
    },
    data: [
        { quarter: 'Q1', revenue: 8.5, profitMargin: 22 },
        { quarter: 'Q2', revenue: 11.2, profitMargin: 27 },
        { quarter: 'Q3', revenue: 9.8, profitMargin: 25 },
        { quarter: 'Q4', revenue: 13.4, profitMargin: 31 },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            title: { text: 'Quarter' },
        },
        y: {
            type: 'number',
            position: 'left',
            title: { text: 'Revenue ($M)' },
            line: {
                stroke: 'red',
                width: 3,
            },
        },
        ySecondary: {
            type: 'number',
            position: 'right',
            title: { text: 'Profit Margin (%)' },
            label: {
                formatter: ({ value }) => `${value}%`,
            },
            line: {
                stroke: 'red',
                width: 3,
            },
        },
    },
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'revenue',
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'profitMargin',
            yKeyAxis: 'ySecondary',
        },
    ],
};

AgCharts.create(options);
