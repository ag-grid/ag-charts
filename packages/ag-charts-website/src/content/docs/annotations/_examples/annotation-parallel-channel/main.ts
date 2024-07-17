import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'S&P 500 Index',
    },
    initialState: {
        annotations: [
            {
                type: 'parallel-channel',
                locked: true,
                start: { x: { __type: 'date', value: 'Thursday, September 14, 2023' }, y: 4487.78 + 50 },
                end: { x: { __type: 'date', value: 'Tuesday, October 03, 2023' }, y: 4229.45 + 50 },
                height: 100,
            },
        ],
    },
};

AgCharts.createFinancialChart(options);
