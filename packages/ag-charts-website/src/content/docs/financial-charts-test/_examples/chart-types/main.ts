import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    chartType: 'candlestick', // default!
};

const chart = AgCharts.createFinancialChart(options);

function changeType(event: Event) {
    options.chartType = (event.target as HTMLInputElement).value as typeof options.chartType;
    chart.update(options);
}
