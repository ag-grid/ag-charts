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
            { label: '1 Month', value: 'month' },
            { label: '3 Months', value: { unit: 'month', step: 3 } },
            { label: '6 Months', value: { unit: 'month', step: 6 } },
            { label: '1 Year', value: 'year' },
            { label: 'All Data', value: undefined },
        ],
    },
};

const chart = AgCharts.create(options);
