import { AgChartOptions, AgCharts } from 'ag-charts-community';

// Chart Options
const options: AgChartOptions = {
    container: document.getElementById('myChart'), // Container: HTML Element to hold the chart
    // Data: Data to be displayed in the chart
    data: [
        { data: { month: 'Jan', avgTemp: 2.3, iceCreamSales: 162000 } },
        { data: { month: 'Mar', avgTemp: 6.3, iceCreamSales: 302000 } },
        { data: { month: 'May', avgTemp: 16.2, iceCreamSales: 800000 } },
        { data: { month: 'Jul', avgTemp: 22.8, iceCreamSales: 1254000 } },
        { data: { month: 'Sep', avgTemp: 14.5, iceCreamSales: 950000 } },
        { data: { month: 'Nov', avgTemp: 8.9, iceCreamSales: 200000 } },
    ],
    // Series: Defines which chart type and data to use
    series: [{ type: 'bar', xKey: 'data.month', yKey: 'data.iceCreamSales' }],
};

// Create Chart
AgCharts.create(options);
