import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { quarter: 'Q1', sales: 100 },
        { quarter: 'Q2', sales: 200 },
        { quarter: 'Q3', sales: 150 },
        { quarter: 'Q4', sales: 300 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'sales',
        },
    ],
};

AgCharts.create(options);
