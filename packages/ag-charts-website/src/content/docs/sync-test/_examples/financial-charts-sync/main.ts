import { AgCharts, AgFinancialChartOptions, ContextMenuModule } from 'ag-charts-enterprise';

import { getData } from './data';

const commonOptions: AgFinancialChartOptions = {
    minWidth: 0,
    minHeight: 0,
    zoom: true,
    toolbar: false,
    rangeButtons: false,
    volume: true,
    sync: true,
};

const chartOptions1: AgFinancialChartOptions = {
    ...commonOptions,
    container: document.getElementById('myChart1'),
    title: { text: 'AAPL' },
    data: getData(100),
};

AgCharts.createFinancialChart(chartOptions1);

const chartOptions2: AgFinancialChartOptions = {
    ...commonOptions,
    container: document.getElementById('myChart2'),
    title: { text: 'MSFT' },
    data: getData(200),
};

AgCharts.createFinancialChart(chartOptions2);

const chartOptions3: AgFinancialChartOptions = {
    ...commonOptions,
    container: document.getElementById('myChart3'),
    title: { text: 'GOOG' },
    data: getData(300),
};

AgCharts.createFinancialChart(chartOptions3);

const chartOptions4: AgFinancialChartOptions = {
    ...commonOptions,
    container: document.getElementById('myChart4'),
    title: { text: 'AMZN' },
    data: getData(400),
};

AgCharts.createFinancialChart(chartOptions4);
