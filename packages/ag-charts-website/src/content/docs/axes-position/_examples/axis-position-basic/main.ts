import { AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import {
    BarSeriesModule,
    CategoryAxisModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);
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
            title: { text: 'Quarter' },
        },
        y: {
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
