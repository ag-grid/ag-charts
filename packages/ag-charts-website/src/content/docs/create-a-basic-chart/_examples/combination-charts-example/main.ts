import { AgBarSeriesOptions, AgChartOptions, AgCharts, AgLineSeriesOptions } from 'ag-charts-community';

interface IData {
    // Chart Data Interface
    month: 'Jan' | 'Feb' | 'Mar' | 'Apr' | 'May' | 'Jun' | 'Jul' | 'Aug' | 'Sep' | 'Oct' | 'Nov' | 'Dec';
    avgTemp: number;
    iceCreamSales: number;
}

// Chart Options Configuration
const options: AgChartOptions = {
    container: document.getElementById('myChart'), // Container: HTML Element to hold the chart
    // Data: Data to be displayed within the chart
    data: [
        { month: 'Jan', avgTemp: 2.3, iceCreamSales: 162000 },
        { month: 'Mar', avgTemp: 6.3, iceCreamSales: 302000 },
        { month: 'May', avgTemp: 16.2, iceCreamSales: 800000 },
        { month: 'Jul', avgTemp: 22.8, iceCreamSales: 1254000 },
        { month: 'Sep', avgTemp: 14.5, iceCreamSales: 950000 },
        { month: 'Nov', avgTemp: 8.9, iceCreamSales: 200000 },
    ] as IData[],
    // Series: Defines which chart type and data to use
    series: [
        { type: 'bar', xKey: 'month', yKey: 'iceCreamSales' } as AgBarSeriesOptions,
        { type: 'line', xKey: 'month', yKey: 'avgTemp' } as AgLineSeriesOptions,
    ],
};

// Create the chart using the Chart Options defined above
AgCharts.create(options);
