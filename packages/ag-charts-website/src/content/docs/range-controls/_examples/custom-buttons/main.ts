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
    ranges: {
        buttons: [
            { label: '6 Months', value: 6 * 30 * 24 * 60 * 60 * 1000 },
            { label: '1 Year', value: 365 * 24 * 60 * 60 * 1000 },
            { label: 'H1 2023', value: [new Date(2023, 0, 1), new Date(2023, 6, 1)] },
            { label: 'All Data', value: undefined },
        ],
    },
};

const chart = AgCharts.create(options);
