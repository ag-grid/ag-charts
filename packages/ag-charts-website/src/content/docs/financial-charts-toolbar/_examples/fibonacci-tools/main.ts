import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Fibonacci Tools',
    },
    rangeButtons: false,
    initialState: {
        annotations: [
            {
                type: 'fibonacci-retracement',
                isMultiColor: true,
                bands: 10,
                start: {
                    x: {
                        __type: 'date',
                        value: '2024-03-21T19:30:00.000Z',
                    },
                    y: 39839.65593310556,
                },
                end: {
                    x: {
                        __type: 'date',
                        value: '2024-03-21T19:12:00.000Z',
                    },
                    y: 39830.30360752416,
                },
            },
        ],
    },
};

AgCharts.createFinancialChart(options);
