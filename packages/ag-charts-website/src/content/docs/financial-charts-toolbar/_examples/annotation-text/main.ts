import { AgChartState, AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Annotations',
    },
    initialState: {
        annotations: [
            {
                type: 'text',
                text: 'Text Annotation',
                fontSize: 14,
                fontFamily: 'Verdana, sans-serif',
                color: 'black',
                x: {
                    __type: 'date',
                    value: 'Thu Mar 21 2024 18:49:00 GMT+0000 (Greenwich Mean Time)',
                },
                y: 39855.23676880223,
            },
        ],
    },
};

const chart = AgCharts.createFinancialChart(options);
