import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    chartType: 'candlestick', // default!
};

const chart = AgCharts.createFinancialChart(options);

function changeType(type: 'candlestick' | 'ohlc' | 'hollow-candlestick' | 'line' | 'step-line' | 'range-area') {
    options.chartType = type;
    chart.update(options);
}
