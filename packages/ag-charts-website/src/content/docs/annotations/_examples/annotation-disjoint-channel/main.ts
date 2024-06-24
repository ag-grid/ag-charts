import { AgChartOptions, AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'S&P 500 Index',
    },
    subtitle: {
        text: 'Daily High and Low Prices',
    },
    footnote: {
        text: '1 Aug 2023 - 1 Nov 2023',
    },
    initialState: {
        annotations: [
            {
                type: 'disjoint-channel',
                locked: true,
                start: { x: { __type: 'date', value: 'Thursday, September 14, 2023' }, y: 4487.78 + 25 },
                end: { x: { __type: 'date', value: 'Tuesday, October 03, 2023' }, y: 4229.45 + 100 },
                startHeight: 50,
                endHeight: 150,
            },
        ],
    },
};

AgCharts.createFinancialChart(options);
