import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
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
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    NavigatorModule,
    NumberAxisModule,
    RangesModule,
    UnitTimeAxisModule,
    ZoomModule,
]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(800),
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'price',
            marker: {
                enabled: false,
            },
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            parentLevel: {
                enabled: true,
            },
        },
    },
    ranges: {
        enabled: true,
    },
    zoom: {
        enabled: true,
    },
    navigator: {
        enabled: true,
    },
};

AgCharts.create(options);
