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
            buttonHoverBorderColor: '#ff6d00',
            buttonActiveBorderColor: '#00c853',
            buttonDisabledBorderColor: '#d50000',
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
