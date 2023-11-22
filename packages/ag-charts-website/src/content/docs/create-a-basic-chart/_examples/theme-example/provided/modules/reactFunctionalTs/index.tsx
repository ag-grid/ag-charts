import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

// Ag Charts Imports
import {
    AgBarSeriesOptions,
    AgCategoryAxisOptions,
    AgChartCaptionOptions,
    AgChartLegendOptions,
    AgChartOptions,
    AgChartSubtitleOptions,
    AgChartThemeName,
    AgLineSeriesOptions,
    AgNumberAxisOptions,
} from 'ag-charts-community';
import { AgChartsReact } from 'ag-charts-react';

// Chart Data Interface
interface IData {
    month: 'Jan' | 'Feb' | 'Mar' | 'Apr' | 'May' | 'Jun' | 'Jul' | 'Aug' | 'Sep' | 'Oct' | 'Nov' | 'Dec';
    avgTemp: number;
    iceCreamSales: number;
}

// Chart Component
const ChartExample = () => {
    // Chart Options: Control & configure the chart
    const [chartOptions, setChartOptions] = useState<AgChartOptions>({
        // Container: HTML Element to hold the chart
        container: document.getElementById('myChart') as HTMLElement,
        // Theme: Style to apply to the chart
        theme: 'ag-material-dark' as AgChartThemeName,
        // Data: Data to be displayed within the chart
        data: [
            { month: 'Jan', avgTemp: 2.3, iceCreamSales: 162 },
            { month: 'Mar', avgTemp: 6.3, iceCreamSales: 302 },
            { month: 'May', avgTemp: 16.2, iceCreamSales: 800 },
            { month: 'Jul', avgTemp: 22.8, iceCreamSales: 1254 },
            { month: 'Sep', avgTemp: 14.5, iceCreamSales: 950 },
            { month: 'Nov', avgTemp: 8.9, iceCreamSales: 200 },
        ] as IData[],
        // Series: Defines which chart type and data to use
        series: [
            { type: 'bar', xKey: 'month', yKey: 'iceCreamSales' } as AgBarSeriesOptions,
            { type: 'line', xKey: 'month', yKey: 'avgTemp' } as AgLineSeriesOptions,
        ],
        // Axes: Configure the axes for the chart
        axes: [
            // Display category (xKey) as the bottom axis
            {
                type: 'category',
                position: 'bottom',
            } as AgCategoryAxisOptions,
            // Use left axis for 'iceCreamSales' series
            {
                type: 'number',
                position: 'left',
                keys: ['iceCreamSales'],
            } as AgNumberAxisOptions,
            // Use right axis for 'avgTemp' series
            {
                type: 'number',
                position: 'right',
                keys: ['avgTemp'],
            } as AgNumberAxisOptions,
        ],
    });

    return (
        // AgChartsReact component with options passed as prop
        <AgChartsReact options={chartOptions} />
    );
};

// Render ChartExample
const root = createRoot(document.getElementById('root')!);
root.render(<ChartExample />);
