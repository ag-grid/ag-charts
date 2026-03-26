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
    zoom: { enabled: true },
    navigator: { enabled: true },
    ranges: {
        enabled: true,
    },
};

const chart = AgCharts.create(options);

function toggleOutOfRange(enabled: boolean) {
    options.ranges = {
        ...options.ranges,
        enableOutOfRange: enabled,
    };
    chart.update(options);
}
