import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Button State Borders',
    },
    volume: false,
    theme: {
        params: {
            buttonBorder: { color: '#000000', width: 4 },
            buttonHoverBorder: { color: '#ff6d00' },
            buttonActiveBorder: { color: '#00c853' },
            buttonDisabledBorder: { color: '#d50000' },
        },
        overrides: {
            common: {
                zoom: {
                    buttons: {
                        visible: 'always',
                    },
                },
            },
        },
    },
};

AgCharts.createFinancialChart(options);
