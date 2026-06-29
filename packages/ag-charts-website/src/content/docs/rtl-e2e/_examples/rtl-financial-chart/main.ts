// @ag-skip-fws
import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const container = document.getElementById('myChart')!;
container.dir = 'rtl';

const options: AgFinancialChartOptions = {
    container,
    data: getData(),
    rangeButtons: false,
    navigator: false,
    toolbar: true,
    volume: false,
    zoom: false,
};

AgCharts.createFinancialChart(options);
