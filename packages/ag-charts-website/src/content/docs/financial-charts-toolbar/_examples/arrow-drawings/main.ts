import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Arrow Drawings',
    },
    rangeButtons: false,
    initialState: {
        annotations: [
            {
                type: 'arrow',
                start: {
                    x: {
                        __type: 'date',
                        value: 'Thu Mar 21 2024 18:25:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 39870.926928281464,
                },
                end: {
                    x: {
                        __type: 'date',
                        value: 'Thu Mar 21 2024 18:44:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 39827.35453315291,
                },
            },
            {
                type: 'arrow-up',
                x: {
                    __type: 'date',
                    value: 'Thu Mar 21 2024 18:56:00 GMT+0000 (Greenwich Mean Time)',
                },
                y: 39842.13125845738,
            },
            {
                type: 'arrow-down',
                x: {
                    __type: 'date',
                    value: 'Thu Mar 21 2024 19:11:00 GMT+0000 (Greenwich Mean Time)',
                },
                y: 39814.188092016244,
            },
        ],
    },
};

AgCharts.createFinancialChart(options);
