import { ModuleRegistry } from 'ag-charts-community';
import { AgCharts, AgFinancialChartOptions, ContextMenuModule, FinancialChartModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([FinancialChartModule, ContextMenuModule]);
const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Acme Inc.' },
    data: getData(),
    volume: false,
    navigator: true,
};

AgCharts.createFinancialChart(options);
