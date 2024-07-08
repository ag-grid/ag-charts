import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { month: 'Jan', price: 148.9, volume: 2.5 },
        { month: 'Feb', price: 153.4, volume: 3.1 },
        { month: 'Mar', price: 155.75, volume: 2.8 },
        { month: 'Apr', price: 158.9, volume: 4.2 },
        { month: 'May', price: 160.6, volume: 5.5 },
        { month: 'Jun', price: 158.45, volume: 3.7 },
        { month: 'Jul', price: 162.3, volume: 4.9 },
        { month: 'Aug', price: 165.8, volume: 6.2 },
        { month: 'Sep', price: 168.5, volume: 7.8 },
        { month: 'Oct', price: 170.25, volume: 5.4 },
        { month: 'Nov', price: 172.1, volume: 6.7 },
        { month: 'Dec', price: 169.75, volume: 4.3 },
    ],
    series: [
        {
            type: 'area',
            xKey: 'month',
            yKey: 'volume',
            yName: 'Trading Volume',
            strokeWidth: 2,
            marker: { enabled: true },
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'price',
            yName: 'Closing Price',
            lineDash: [3, 3],
            marker: { enabled: false },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
            keys: ['price'],
            title: { text: 'Closing Price' },
        },
        {
            type: 'number',
            position: 'right',
            keys: ['volume'],
            title: { enabled: true, text: 'Trading Volume' },
        },
    ],
    legend: {
        item: {
            showSeriesStroke: true,
        },
    },
};

const chart = AgCharts.create(options);

function toggleSeriesStroke() {
    options.legend!.item!.showSeriesStroke = !options.legend!.item!.showSeriesStroke;
    chart.update(options);
}
