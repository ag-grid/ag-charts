import {
    AgCartesianChartOptions,
    AgChartHighlightMode,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    highlight: {
        mode: 'single',
    },
    series: [
        { type: 'bar', xKey: 'quarter', yKey: 'productA', yName: 'Product A', stacked: true },
        { type: 'bar', xKey: 'quarter', yKey: 'productB', yName: 'Product B', stacked: true },
        { type: 'bar', xKey: 'quarter', yKey: 'productC', yName: 'Product C', stacked: true },
    ],
};

const chart = AgCharts.create(options);

function setHighlightMode(event: Event) {
    const mode = (event.target as HTMLInputElement).value as AgChartHighlightMode;
    options.highlight!.mode = mode;
    chart.update(options);
}
