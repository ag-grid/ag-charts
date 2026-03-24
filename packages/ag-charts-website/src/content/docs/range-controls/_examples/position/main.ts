import {
    AgCartesianChartOptions,
    AgCharts,
    AgRangesPosition,
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
    title: { text: 'Daily Readings' },
    series: [{ type: 'line', xKey: 'date', yKey: 'value', yName: 'Value' }],
    axes: {
        x: { type: 'unit-time' },
        y: { type: 'number' },
    },
    zoom: { enabled: true },
    navigator: { enabled: true },
    ranges: {
        enabled: true,
        position: 'top-right',
    },
};

const chart = AgCharts.create(options);

function changePosition(position: AgRangesPosition) {
    options.ranges = {
        ...options.ranges,
        position,
    };
    chart.update(options);
}
