import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),

    navigator: false, // disabled by default!
    annotations: true,
    rangeToolbar: true,
    volume: true,
    statusBar: true,
    zoom: true,
};

const chart = AgCharts.createFinancialChart(options);

function toggleFeature(type: 'navigator' | 'annotations' | 'rangeToolbar' | 'volume' | 'statusBar' | 'zoom') {
    options[type] = !options[type];
    chart.update(options);
}
