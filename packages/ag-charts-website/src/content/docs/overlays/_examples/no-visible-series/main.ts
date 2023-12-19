import { AgChartOptions, AgCharts } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { quarter: 'Q1', petrol: 200, diesel: 100 },
        { quarter: 'Q2', petrol: 300, diesel: 130 },
        { quarter: 'Q3', petrol: 350, diesel: 160 },
        { quarter: 'Q4', petrol: 400, diesel: 200 },
    ],
    series: [
        { xKey: 'quarter', yKey: 'petrol', visible: false },
        { xKey: 'quarter', yKey: 'diesel', visible: false },
    ],
};

AgCharts.create(options);
