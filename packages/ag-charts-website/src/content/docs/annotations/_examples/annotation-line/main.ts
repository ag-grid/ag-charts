import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Dow Jones Industrial Average',
    },
    subtitle: {
        text: 'Candlestick Patterns',
    },
    footnote: {
        text: '1 Minute',
    },
    initialState: {
        annotations: [
            {
                type: 'line',
                locked: true,
                start: { x: { __type: 'date', value: '2024-03-21T18:55:00.000Z' }, y: 39838.38 },
                end: { x: { __type: 'date', value: '2024-03-21T19:02:00.000Z' }, y: 39829.71 },
            },
            {
                type: 'line',
                locked: true,
                start: { x: { __type: 'date', value: '2024-03-21T19:02:00.000Z' }, y: 39830.63 },
                end: { x: { __type: 'date', value: '2024-03-21T19:16:00.000Z' }, y: 39833.59 },
            },
            {
                type: 'line',
                locked: true,
                start: { x: { __type: 'date', value: '2024-03-21T19:16:00.000Z' }, y: 39835.38 },
                end: { x: { __type: 'date', value: '2024-03-21T19:32:00.000Z' }, y: 39833.49 },
            },
        ],
    },
};

AgCharts.createFinancialChart(options);
