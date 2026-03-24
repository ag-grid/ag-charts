import {
    AgCartesianChartOptions,
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

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'value',
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            label: {
                autoRotate: false,
            },
        },
        y: {
            type: 'number',
        },
    },
    ranges: {
        enabled: true,
        dropdown: { visible: 'auto' },
        buttons: [
            { label: '1 Month', value: 'month' },
            { label: '3 Months', value: { unit: 'month', step: 3 } },
            { label: '6 Months', value: { unit: 'month', step: 6 } },
            { label: '1 Year', value: 'year' },
            { label: 'All Data', value: undefined },
        ],
    },
    zoom: { enabled: true },
    navigator: { enabled: true },
};

const chart = AgCharts.create(options);

function changeDropdown(visible: 'auto' | 'always' | 'never') {
    options.ranges = {
        ...options.ranges,
        dropdown: { visible },
    };
    chart.update(options);
}
