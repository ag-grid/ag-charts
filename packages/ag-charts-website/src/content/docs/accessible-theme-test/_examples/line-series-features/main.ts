import {
    AgCartesianChartOptions,
    AgCharts,
    AnnotationsModule,
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
    AnnotationsModule,
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
    theme: 'ag-accessible',
    title: {
        text: 'Daily Sales by Region',
    },
    subtitle: {
        text: 'Annotations, crosshairs, navigator, range controls and zoom',
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'north',
            yName: 'North',
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'south',
            yName: 'South',
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            crosshair: {
                enabled: true,
            },
        },
        y: {
            type: 'number',
            crosshair: {
                enabled: true,
            },
        },
    },
    annotations: {
        enabled: true,
    },
    initialState: {
        annotations: [
            {
                type: 'horizontal-line',
                value: 100,
            },
        ],
    },
    navigator: {
        enabled: true,
        miniChart: {
            enabled: true,
        },
    },
    ranges: {
        enabled: true,
    },
    zoom: {
        enabled: true,
    },
};

AgCharts.create(options);
