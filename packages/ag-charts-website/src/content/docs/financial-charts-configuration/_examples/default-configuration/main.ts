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
    data: getData(),
};

const chart = AgCharts.createFinancialChart(options);
