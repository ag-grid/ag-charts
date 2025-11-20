import { AgCharts, AgFinancialChartOptions, OrdinalTimeAxisModule } from 'ag-charts-enterprise';
import { getData } from './data';

import { NumberAxisModule, TimeAxisModule, UnitTimeAxisModule, ModuleRegistry } from 'ag-charts-community';
import { FinancialChartModule } from 'ag-charts-enterprise';
ModuleRegistry.registerModules([FinancialChartModule, NumberAxisModule, TimeAxisModule, UnitTimeAxisModule, OrdinalTimeAxisModule]);


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
