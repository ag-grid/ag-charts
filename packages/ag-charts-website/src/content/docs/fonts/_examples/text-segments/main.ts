import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import {
    CategoryAxisModule,
    LineSeriesModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';


ModuleRegistry.registerModules([CategoryAxisModule, LineSeriesModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: [
            {
                text: '2025',
                fontStyle: 'italic',
            },
            {
                text: ' Financial Growth ',
                fontSize: 26,
            },
            {
                text: 'Overview',
                color: '#ff7f0e',
                fontFamily: 'monospace',
            },
        ],
        color: '#1f77b4',
        fontSize: 34,
        fontWeight: 'bold',
    },
    subtitle: {
        text: [
            { text: 'Quarterly Revenue vs Expenses Analysis', color: '#2ca02c' },
            { text: ' for Q1 & Q2 2025', color: '#d62728' },
        ],
        fontSize: 18,
        fontWeight: 'bold',
    },
    footnote: {
        text: [
            { text: 'All of this ' },
            { text: 'data is fictitious', fontWeight: 'bold', fontSize: 15 },
            { text: ' and for example purposes only.' },
        ],
    },
    data: [
        { quarter: 'Q1', revenue: 500000, expenses: 450000 },
        { quarter: 'Q2', revenue: 750000, expenses: 600000 },
        { quarter: 'Q3', revenue: 1000000, expenses: 800000 },
        { quarter: 'Q4', revenue: 1200000, expenses: 950000 },
    ],
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'revenue',
            yName: 'Revenue',
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'expenses',
            yName: 'Expenses',
        },
    ],
};

AgCharts.create(options);
