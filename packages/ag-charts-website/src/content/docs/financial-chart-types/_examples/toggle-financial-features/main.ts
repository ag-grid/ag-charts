import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),

    // Default configuration.
    volume: true,
    annotations: true,
    rangeToolbar: true,
    statusBar: true,
    zoom: true,
    navigator: false,
};

const chart = AgCharts.createFinancialChart(options);

function toggleFeature(type: 'volume' | 'annotations' | 'rangeToolbar' | 'statusBar' | 'zoom' | 'navigator') {
    options[type] = !options[type];
    chart.update(options);
}
