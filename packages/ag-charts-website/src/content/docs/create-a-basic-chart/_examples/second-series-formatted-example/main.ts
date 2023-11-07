import { AgChart, AgChartOptions } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart') as HTMLElement,
    title: { text: '' },
    subtitle: { text: '' },
    theme: 'ag-material-dark',
    data: [
        { month: 'Jan', avgTemp: 2.3, iceCreamSales: 162 },
        { month: 'Mar', avgTemp: 6.3, iceCreamSales: 302 },
        { month: 'May', avgTemp: 16.2, iceCreamSales: 800 },
        { month: 'Jul', avgTemp: 22.8, iceCreamSales: 1254 },
        { month: 'Sep', avgTemp: 14.5, iceCreamSales: 950 },
        { month: 'Nov', avgTemp: 8.9, iceCreamSales: 200 },
    ],
    series: [
        { type: 'bar', xKey: 'month', yKey: 'iceCreamSales', yName: 'Ice Cream Sales' },
        { type: 'line', xKey: 'month', yKey: 'avgTemp', yName: 'Average Temperature' },
    ],
    axes: [
        { type: 'category', position: 'bottom' },
        { type: 'number', position: 'left', keys: ['iceCreamSales'] },
        {
            type: 'number',
            position: 'right',
            keys: ['avgTemp'],
            label: {
                formatter: (params) => {
                    return params.value + ' °C';
                },
            },
        },
    ],
    legend: {
        enabled: true,
        position: 'right',
    },
};

AgChart.create(options);
