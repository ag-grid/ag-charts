import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Measuring Tools',
    },
    rangeButtons: false,
    initialState: {
        annotations: [
            {
                type: 'date-range',
                extendBelow: true,
                text: {
                    label: 'Date Range',
                    position: 'top',
                    alignment: 'center',
                },
                start: {
                    x: {
                        __type: 'date',
                        value: 'Thu Mar 21 2024 18:29:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 39863.005115089516,
                },
                end: {
                    x: {
                        __type: 'date',
                        value: 'Thu Mar 21 2024 18:41:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 39840.089514066494,
                },
            },
            {
                type: 'price-range',
                text: {
                    label: 'Price Range',
                    position: 'top',
                    alignment: 'right',
                },
                start: {
                    x: {
                        __type: 'date',
                        value: 'Thu Mar 21 2024 18:57:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 39822.54475703325,
                },
                end: {
                    x: {
                        __type: 'date',
                        value: 'Thu Mar 21 2024 18:49:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 39839.373401534525,
                },
            },
            {
                type: 'date-price-range',
                text: {
                    label: 'Date and Price Range',
                    position: 'center',
                    alignment: 'left',
                },
                start: {
                    x: {
                        __type: 'date',
                        value: 'Thu Mar 21 2024 19:02:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 39834.62915601023,
                },
                end: {
                    x: {
                        __type: 'date',
                        value: 'Thu Mar 21 2024 19:31:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 39844.833759590794,
                },
            },
        ],
    },
};

const chart = AgCharts.createFinancialChart(options);
