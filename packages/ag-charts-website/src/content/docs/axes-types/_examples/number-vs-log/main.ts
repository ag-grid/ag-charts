import { AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import {
    CategoryAxisModule,
    LineSeriesModule,
    LogAxisModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, LogAxisModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { os: 'A', share: 10 },
        { os: 'B', share: 100 },
        { os: 'C', share: 1000 },
    ],
    series: [
        {
            type: 'line',
            xKey: 'os',
            yKey: 'share',
        },
    ],
};

const chart = AgCharts.create(options);

const axisTypes: Record<string, AgCartesianChartOptions['axes']> = {
    number: { y: { type: 'number', label: { format: '.0f' } } },
    log: { y: { type: 'log', label: { format: '.0f' } } },
    'log-base-2': { y: { type: 'log', label: { format: '.0f' }, base: 2 } },
    'log-fewer-ticks': { y: { type: 'log', interval: { minSpacing: 200 }, label: { format: '.0f' } } },
};

function axisTypeChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    options.axes = axisTypes[value];
    chart.update(options);
}
