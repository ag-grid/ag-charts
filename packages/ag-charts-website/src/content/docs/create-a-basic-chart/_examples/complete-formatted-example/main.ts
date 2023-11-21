import { AgChartOptions, AgCharts } from 'ag-charts-community';

const options: AgChartOptions = {
    // Container: HTML Element to hold the chart
    container: document.getElementById('myChart') as HTMLElement,
    // Chart Title
    title: { text: 'Ice Cream Sales and Avg Temp' },
    // Chart Subtitle
    subtitle: { text: 'UK Data from 2022' },
    // Theme: Style to apply to the chart
    theme: 'ag-vivid-dark',
    // Data: Data to be displayed within the chart
    data: [
        { month: 'Jan', avgTemp: 2.3, iceCreamSales: 162 },
        { month: 'Mar', avgTemp: 6.3, iceCreamSales: 302 },
        { month: 'May', avgTemp: 16.2, iceCreamSales: 800 },
        { month: 'Jul', avgTemp: 22.8, iceCreamSales: 1254 },
        { month: 'Sep', avgTemp: 14.5, iceCreamSales: 950 },
        { month: 'Nov', avgTemp: 8.9, iceCreamSales: 200 },
    ],
    // Series: Defines which chart type and data to use
    series: [
        { type: 'bar', xKey: 'month', yKey: 'iceCreamSales', yName: 'Ice Cream Sales' },
        { type: 'line', xKey: 'month', yKey: 'avgTemp', yName: 'Average Temperature' },
    ],
    // Axes: Configure the axes for the chart
    axes: [
        // Display category (xKey) as the bottom axis
        { type: 'category', position: 'bottom' },
        // Use left axis for 'iceCreamSales' series
        {
            type: 'number',
            position: 'left',
            keys: ['iceCreamSales'],
        },
        // Use right axis for 'avgTemp' series
        {
            type: 'number',
            position: 'right',
            keys: ['avgTemp'],
            // Format the label applied to this axis (append ' °C')
            label: {
                formatter: (params) => {
                    return params.value + ' °C';
                },
            },
        },
    ],
    // Legend: Matches visual elements to their corresponding series or data categories.
    legend: {
        enabled: true,
        position: 'right',
    },
};

AgCharts.create(options);
