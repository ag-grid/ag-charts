import {
    AgBarSeriesOptions,
    AgCategoryAxisOptions,
    AgChartCaptionOptions,
    AgChartLegendOptions,
    AgChartOptions,
    AgChartSubtitleOptions,
    AgCharts,
    AgLineSeriesOptions,
    AgNumberAxisOptions,
} from 'ag-charts-community';
import {
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';


ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);
interface IData {
    // Chart Data Interface
    month: 'Jan' | 'Feb' | 'Mar' | 'Apr' | 'May' | 'Jun' | 'Jul' | 'Aug' | 'Sep' | 'Oct' | 'Nov' | 'Dec';
    avgTemp: number;
    iceCreamSales: number;
}

// Chart Options Configuration
const options: AgChartOptions = {
    container: document.getElementById('myChart'), // Container: HTML Element to hold the chart
    // Chart Title
    title: { text: 'Ice Cream Sales and Avg Temp' } as AgChartCaptionOptions,
    // Chart Subtitle
    subtitle: { text: 'Data from 2022' } as AgChartSubtitleOptions,
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
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'iceCreamSales',
            yName: 'Ice Cream Sales',
        } as AgBarSeriesOptions,
        {
            type: 'line',
            xKey: 'month',
            yKey: 'avgTemp',
            yName: 'Average Temperature (°C)',
            yKeyAxis: 'ySecondary',
        } as AgLineSeriesOptions,
    ],
    // Axes: Configure the axes for the chart
    axes: {
        // Display category (xKey) as the bottom axis
        x: {
            type: 'category',
            position: 'bottom',
        } as AgCategoryAxisOptions,
        // Use left axis for 'iceCreamSales' series
        y: {
            type: 'number',
            position: 'left',
            // Format the label applied to this axis
            label: {
                formatter: (params) => {
                    return parseFloat(params.value).toLocaleString();
                },
            },
        } as AgNumberAxisOptions,
        // Use right axis for 'avgTemp' series
        ySecondary: {
            type: 'number',
            position: 'right',
            // Format the label applied to this axis (append ' °C')
            label: {
                formatter: (params) => {
                    return params.value + ' °C';
                },
            },
        } as AgNumberAxisOptions,
    },
    // Legend: Matches visual elements to their corresponding series or data categories.
    legend: {
        position: 'right',
    } as AgChartLegendOptions,
};

// Create the chart using the Chart Options defined above
AgCharts.create(options);
