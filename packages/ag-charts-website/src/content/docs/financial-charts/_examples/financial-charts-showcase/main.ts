import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Acme Inc.' },
    initialState: {
        annotations: [
            {
                type: 'parallel-channel',
                start: { x: { __type: 'date', value: new Date('2022-03-01').getTime() }, y: 160.15 },
                end: { x: { __type: 'date', value: new Date('2024-06-28').getTime() }, y: 160.15 },
                height: 12,
                stroke: '#808080B0',
                background: {
                    fill: '#808080B0',
                },
            },
            {
                type: 'parallel-channel',
                start: { x: { __type: 'date', value: new Date('2023-03-15').getTime() }, y: 160.0 },
                end: { x: { __type: 'date', value: new Date('2023-07-21').getTime() }, y: 198.0 },
                height: 8,
                stroke: '#4075E0C4',
                background: {
                    fill: '#4075E0C4',
                },
            },
            {
                type: 'horizontal-line',
                value: 180.0,
                stroke: 'lightseagreen',
                axisLabel: {
                    fill: 'lightseagreen',
                },
            },
            {
                type: 'horizontal-line',
                value: 195.0,
                stroke: 'red',
                axisLabel: {
                    fill: 'red',
                },
            },
        ],
    },
};

const chart = AgCharts.createFinancialChart(options);
