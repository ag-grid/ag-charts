import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'FTSE: XYZ' },
    data: getData(),
    volume: false,
    navigator: true,
    // toolbar: false,
};

AgCharts.createFinancialChart(options);
