import {
    AgCharts,
    AgFinancialChartOptions,
    ContextMenuModule,
    FinancialChartModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([FinancialChartModule]);

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Acme Inc.' },
    data: getData(),
    volume: false,
    navigator: true,
};

AgCharts.createFinancialChart(options);
