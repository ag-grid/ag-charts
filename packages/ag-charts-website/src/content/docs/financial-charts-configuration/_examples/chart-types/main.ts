import { ModuleRegistry } from 'ag-charts-community';
import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';
import { FinancialChartModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([FinancialChartModule]);

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    chartType: 'candlestick', // default!
};

const chart = AgCharts.createFinancialChart(options);

function changeType(type: 'candlestick' | 'ohlc' | 'hollow-candlestick' | 'line' | 'step-line' | 'hlc' | 'high-low') {
    options.chartType = type;
    chart.update(options);
}
