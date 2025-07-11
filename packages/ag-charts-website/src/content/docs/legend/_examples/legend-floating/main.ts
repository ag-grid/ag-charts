import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { ticker: 'AAPL', '2020': 0.7, '2021': 0.6, '2022': 0.5 },
        { ticker: 'KO', '2020': 3.0, '2021': 2.9, '2022': 2.8 },
        { ticker: 'JNJ', '2020': 2.6, '2021': 2.5, '2022': 2.4 },
        { ticker: 'T', '2020': 6.5, '2021': 7.0, '2022': 6.0 },
        { ticker: 'PG', '2020': 2.3, '2021': 2.2, '2022': 2.1 },
    ],
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'ticker',
            yKey: '2020',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'ticker',
            yKey: '2021',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'ticker',
            yKey: '2022',
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'left',
            title: { text: 'Stock Ticker' },
        },
        {
            type: 'number',
            position: 'bottom',
            title: { text: 'Dividend Yield (%)' },
            label: { format: '#{.0f}%' },
        },
    ],
    legend: {
        position: 'right-top',
        floating: true,
    },
};

AgCharts.create(options);
