import {
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    TimeAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-community';
import {
    AgCharts,
    AgFinancialChartOptions,
    AnimationModule,
    CrosshairModule,
    OrdinalTimeAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';
import { FinancialChartModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    FinancialChartModule,
    LegendModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    TimeAxisModule,
    UnitTimeAxisModule,
    ZoomModule,
]);

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
