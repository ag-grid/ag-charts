import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

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
                x: {
                    __type: 'date',
                    value: 'Thu Mar 21 2024 19:21:00 GMT+0000 (Greenwich Mean Time)',
                },
                y: 39851.06756756757,
            },
            {
                type: 'comment',
                text: 'Comment',
                x: {
                    __type: 'date',
                    value: 'Thu Mar 21 2024 19:06:00 GMT+0000 (Greenwich Mean Time)',
                },
                y: 39844.91891891892,
            },
            {
                type: 'callout',
                text: 'Callout',
                color: '#040404',
                fill: '#6baaf3',
                fillOpacity: 0.6,
                stroke: '#2395ff',
                strokeOpacity: 1,
                strokeWidth: 2,
                start: {
                    x: {
                        __type: 'date',
                        value: 'Thu Mar 21 2024 18:31:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 39856.820512820515,
                },
                end: {
                    x: {
                        __type: 'date',
                        value: 'Thu Mar 21 2024 18:39:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 39859.282051282054,
                },
            },
            {
                type: 'note',
                text: 'Note',
                x: {
                    __type: 'date',
                    value: 'Thu Mar 21 2024 18:54:00 GMT+0000 (Greenwich Mean Time)',
                },
                y: 39843.28205128205,
            },
        ],
    },
};

const chart = AgCharts.createFinancialChart(options);
