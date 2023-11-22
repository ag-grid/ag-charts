import { Component } from '@angular/core';

// AG Charts Angular Imports
import { AgChartsAngularModule } from 'ag-charts-angular';
import {
    AgBarSeriesOptions,
    AgCategoryAxisOptions,
    AgChartCaptionOptions,
    AgChartLegendOptions,
    AgChartOptions,
    AgChartSubtitleOptions,
    AgChartThemeName,
    AgCharts,
    AgLineSeriesOptions,
    AgNumberAxisOptions,
} from 'ag-charts-community';

// Chart Data Interface
interface IData {
    month: 'Jan' | 'Feb' | 'Mar' | 'Apr' | 'May' | 'Jun' | 'Jul' | 'Aug' | 'Sep' | 'Oct' | 'Nov' | 'Dec';
    avgTemp: number;
    iceCreamSales: number;
}

@Component({
    selector: 'my-app',
    standalone: true,
    // Import AG Charts Module for Angular
    imports: [AgChartsAngularModule],
    // ag-charts-angular component with chartOptions attribute
    template: `<ag-charts-angular style="height: 100%" [options]="chartOptions"> </ag-charts-angular>`,
})
export class AppComponent {
    // Chart Options
    public chartOptions: AgChartOptions;
    constructor() {
        this.chartOptions = {
            // Container: HTML Element to hold the chart
            container: document.getElementById('myChart') as HTMLElement,
            // Chart Title
            title: { text: 'Ice Cream Sales and Avg Temp' } as AgChartCaptionOptions,
            // Chart Subtitle
            subtitle: { text: 'UK Data from 2022' } as AgChartSubtitleOptions,
            // Theme: Style to apply to the chart
            theme: 'ag-vivid-dark' as AgChartThemeName,
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
                { type: 'bar', xKey: 'month', yKey: 'iceCreamSales', yName: 'Ice Cream Sales' } as AgBarSeriesOptions,
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
                    // Format the label applied to this axis (append ' °C')
                    label: {
                        formatter: (params) => {
                            return params.value + ' °C';
                        },
                    },
                } as AgNumberAxisOptions,
            ],
            // Legend: Matches visual elements to their corresponding series or data categories.
            legend: {
                position: 'right',
            } as AgChartLegendOptions,
        };
    }
}
