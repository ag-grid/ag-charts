import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    rangeButtons: false,
    navigator: false,
    toolbar: true,
    volume: false,
    zoom: false,
    initialState: {
        annotations: [
            {
                type: 'parallel-channel',
                readOnly: true,
                start: {
                    x: { __type: 'date', value: new Date('2024-05-03').getTime() },
                    y: 191.0,
                },
                end: {
                    x: { __type: 'date', value: new Date('2024-05-17').getTime() },
                    y: 205.0,
                },
                height: 5,
            },
            {
                type: 'note',
                readOnly: true,
                text: 'Distribution',
                x: {
                    __type: 'date',
                    value: new Date('2024-05-12').getTime(),
                },
                y: 205,
            },
            {
                type: 'horizontal-line',
                value: 190.0,
                text: {
                    label: 'Support Level',
                    position: 'center',
                    alignment: 'right',
                },
            },
        ],
    },
};

AgCharts.createFinancialChart(options);
