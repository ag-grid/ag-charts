import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    initialState: {
        annotations: [
            {
                type: 'parallel-channel',
                start: { x: { __type: 'date', value: 1672756200000 }, y: 136.28 },
                end: { x: { __type: 'date', value: 1689773400000 }, y: 200 },
                height: 12,
            },
            {
                type: 'line',
                start: { x: { __type: 'date', value: 1701959400000 }, y: 193.63 },
                end: { x: { __type: 'date', value: 1707489000000 }, y: 188.85 },
            },
            {
                type: 'line',
                start: { x: { __type: 'date', value: 1691155800000 }, y: 185.52 },
                end: { x: { __type: 'date', value: 1698413400000 }, y: 166.91 },
            },
        ],
    },
};

const chart = AgCharts.createFinancialChart(options);
