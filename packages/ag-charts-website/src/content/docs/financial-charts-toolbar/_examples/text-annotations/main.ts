import { AgChartState, AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Text Annotations',
    },
    initialState: {
        annotations: [
            {
                type: 'text',
                text: 'Text',
                visible: true,
                fontSize: 14,
                fontFamily: 'Verdana, sans-serif',
                x: {
                    __type: 'date',
                    value: 'Thu Mar 21 2024 19:21:00 GMT+0000 (Greenwich Mean Time)',
                },
                y: 39851.06756756757,
            },
            {
                type: 'comment',
                text: 'Comment',
                visible: true,
                fontSize: 14,
                fontFamily: 'Verdana, sans-serif',
                x: {
                    __type: 'date',
                    value: 'Thu Mar 21 2024 19:06:00 GMT+0000 (Greenwich Mean Time)',
                },
                y: 39844.91891891892,
            },
        ],
    },
};

const chart = AgCharts.createFinancialChart(options);
