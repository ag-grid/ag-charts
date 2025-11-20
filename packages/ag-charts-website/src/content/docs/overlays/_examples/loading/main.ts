import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { LineSeriesModule, NumberAxisModule, ModuleRegistry } from 'ag-charts-community';


ModuleRegistry.registerModules([LineSeriesModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    dataSource: {
        getData: () =>
            new Promise(() => {
                // Never resolve so the loading spinner remains
            }),
    },
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
};

AgCharts.create(options);
