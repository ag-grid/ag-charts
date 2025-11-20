import { ModuleRegistry, NumberAxisModule, TimeAxisModule, UnitTimeAxisModule } from 'ag-charts-community';
import { AgCharts, AgFinancialChartOptions, OrdinalTimeAxisModule } from 'ag-charts-enterprise';
import { FinancialChartModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    FinancialChartModule,
    NumberAxisModule,
    TimeAxisModule,
    UnitTimeAxisModule,
    OrdinalTimeAxisModule,
]);

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
};

const chart = AgCharts.createFinancialChart(options);
