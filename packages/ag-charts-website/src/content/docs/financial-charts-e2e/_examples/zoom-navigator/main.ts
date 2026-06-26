import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    rangeButtons: false,
    navigator: false,
    toolbar: false,
    volume: true,
    zoom: true,
};

const chart = AgCharts.createFinancialChart(options);

function toggleNavigator() {
    options.navigator = !options.navigator;
    chart.update(options);
}
