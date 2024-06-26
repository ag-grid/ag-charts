import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    theme: {
        palette: {
            up: { fill: '#F3A93C', stroke: '#A8492D' },
            down: { fill: '#1A00F4', stroke: '#75FBFD' },
        },
    },
    container: document.getElementById('myChart'),
    data: getData(),
};

const chart = AgCharts.createFinancialChart(options);
