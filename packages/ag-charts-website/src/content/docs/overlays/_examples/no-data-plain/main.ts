import { AgChartOptions, AgCharts } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'A chart with missing data',
    },
    data: [],
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'spending',
        },
    ],
    axes: {
        y: { type: 'number', position: 'left', title: { text: 'Year' } },
        x: { type: 'number', position: 'bottom', title: { text: 'Spending' } },
    },
    overlays: {
        noData: {
            text: 'No data to display',
        },
    },
};

AgCharts.create(options);
