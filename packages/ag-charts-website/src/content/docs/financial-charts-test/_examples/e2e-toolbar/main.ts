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
};

AgCharts.createFinancialChart(options);
