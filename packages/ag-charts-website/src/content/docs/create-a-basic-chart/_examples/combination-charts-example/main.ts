import { AgChartOptions, AgCharts } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart') as HTMLElement,
    data: [
        { month: 'Jan', avgTemp: 2.3, iceCreamSales: 162 },
        { month: 'Mar', avgTemp: 6.3, iceCreamSales: 302 },
        { month: 'May', avgTemp: 16.2, iceCreamSales: 800 },
        { month: 'Jul', avgTemp: 22.8, iceCreamSales: 1254 },
        { month: 'Sep', avgTemp: 14.5, iceCreamSales: 950 },
        { month: 'Nov', avgTemp: 8.9, iceCreamSales: 200 },
    ],
    series: [
        { type: 'bar', xKey: 'month', yKey: 'iceCreamSales' },
        { type: 'line', xKey: 'month', yKey: 'avgTemp' },
    ],
};

AgCharts.create(options);
