import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';
import { NumberAxisModule, TimeAxisModule, UnitTimeAxisModule, ModuleRegistry } from 'ag-charts-community';
import { FinancialChartModule, OrdinalTimeAxisModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([FinancialChartModule, NumberAxisModule, TimeAxisModule, UnitTimeAxisModule, OrdinalTimeAxisModule]);
const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Acme Inc.' },
    data: getData(),
    volume: false,
    navigator: true,
};

AgCharts.createFinancialChart(options);
