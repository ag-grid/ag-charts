import { AgCharts, AgFinancialChartOptions, OrdinalTimeAxisModule } from 'ag-charts-enterprise';
import { getData } from './data';

import { NumberAxisModule, TimeAxisModule, UnitTimeAxisModule, ModuleRegistry } from 'ag-charts-community';
import { FinancialChartModule } from 'ag-charts-enterprise';
ModuleRegistry.registerModules([FinancialChartModule, NumberAxisModule, TimeAxisModule, UnitTimeAxisModule, OrdinalTimeAxisModule]);


const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
};

const chart = AgCharts.createFinancialChart(options);
