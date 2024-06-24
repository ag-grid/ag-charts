import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
};

const chart = AgCharts.createFinancialChart(options);

function changeType(type: 'line' | 'candlestick' | 'ohlc') {
    options.chartType = type;
    chart.update(options);
}
