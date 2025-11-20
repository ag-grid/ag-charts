import { AgChartOptions, AgCharts } from 'ag-charts-community';
import { LineSeriesModule, NumberAxisModule, ModuleRegistry } from 'ag-charts-community';


ModuleRegistry.registerModules([LineSeriesModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'A chart with missing data',
    },
    data: [],
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'spending',
        },
    ],
    axes: {
        y: { type: 'number', position: 'left', title: { text: 'Year' } },
        x: { type: 'number', position: 'bottom', title: { text: 'Spending' } },
    },
    overlays: {
        noData: {
            text: 'No data to display',
        },
    },
};

AgCharts.create(options);
