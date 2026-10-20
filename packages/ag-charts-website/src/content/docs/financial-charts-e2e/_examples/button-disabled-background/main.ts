import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Button Disabled Background',
    },
    volume: false,
    theme: {
        params: {
            buttonBackgroundColor: '#ff0000',
            chromeBackgroundColor: '#87ceeb',
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
