import {
    AgChartOptions,
    AgCharts,
    LineSeriesModule,
    ModuleRegistry,
    NavigatorModule,
    NumberAxisModule,
    RangesModule,
    UnitTimeAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    LineSeriesModule,
    NumberAxisModule,
    UnitTimeAxisModule,
    RangesModule,
    ZoomModule,
    NavigatorModule,
]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Daily Readings' },
    series: [{ type: 'line', xKey: 'date', yKey: 'value', yName: 'Value' }],
    axes: {
        x: { type: 'unit-time' },
        y: { type: 'number' },
    },
    zoom: { enabled: true },
    navigator: { enabled: true },
    ranges: { enabled: true },
};

const chart = AgCharts.create(options);
