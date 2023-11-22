import { Component } from '@angular/core';

// AG Charts Angular Imports
import { AgChartsAngularModule } from 'ag-charts-angular';
import { AgBarSeriesOptions, AgChartOptions, AgLineSeriesOptions } from 'ag-charts-community';

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
        };
    }
}
