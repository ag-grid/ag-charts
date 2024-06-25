import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

(window as any).agChartsDebug = 'opts';

const options: AgFinancialChartOptions = {
    theme: {},
    container: document.getElementById('myChart'),
    data: getData(),
};

const chart = AgCharts.createFinancialChart(options);
