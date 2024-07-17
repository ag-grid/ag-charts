import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'S&P 500 Index',
    },
    theme: {
        overrides: {
            common: {
                annotations: {
                    line: {
                        stroke: 'lime',
                        strokeWidth: 3,
                        lineDash: [3, 4],
                    },
                    'parallel-channel': {
                        stroke: 'red',
                        strokeWidth: 4,
                        background: {
                            fill: 'red',
                        },
                        middle: {
                            strokeOpacity: 0,
                        },
                    },
                },
            },
        },
    },
    initialState: {
        annotations: [
            {
                type: 'parallel-channel',
                start: { x: { __type: 'date', value: 'Thursday, September 14, 2023' }, y: 4487.78 + 50 },
                end: { x: { __type: 'date', value: 'Tuesday, October 03, 2023' }, y: 4229.45 + 50 },
                height: 100,
            },
            {
                type: 'line',
                start: { x: { __type: 'date', value: 'Friday, August 18, 2023' }, y: 4344.88 },
                end: { x: { __type: 'date', value: 'Tuesday, October 03, 2023' }, y: 4229.45 },
            },
            {
                type: 'line',
                start: { x: { __type: 'date', value: 'Friday, September 01, 2023' }, y: 4530.6 },
                end: { x: { __type: 'date', value: 'Thursday, October 12, 2023' }, y: 4380.94 },
            },
        ],
    },
};

AgCharts.createFinancialChart(options);
