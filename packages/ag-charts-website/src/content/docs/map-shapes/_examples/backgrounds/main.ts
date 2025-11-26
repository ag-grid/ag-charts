import { LegendModule, ModuleRegistry } from 'ag-charts-community';
import { AgChartOptions, AgCharts, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { MapShapeBackgroundSeriesModule, MapShapeSeriesModule } from 'ag-charts-enterprise';

import { central, eastern, mountain, pacific } from './data';
import { topology } from './topology';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    MapShapeBackgroundSeriesModule,
    MapShapeSeriesModule,
    ZoomModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Timezones Across America',
    },
    topology,
    series: [
        {
            type: 'map-shape-background',
        },
        {
            type: 'map-shape',
            data: pacific,
            idKey: 'name',
            title: 'Pacific',
        },
        {
            type: 'map-shape',
            data: mountain,
            idKey: 'name',
            title: 'Mountain',
            visible: false,
        },
        {
            type: 'map-shape',
            data: central,
            idKey: 'name',
            title: 'Central',
            visible: false,
        },
        {
            type: 'map-shape',
            data: eastern,
            idKey: 'name',
            title: 'Eastern',
            visible: false,
        },
    ],
    legend: {
        enabled: true,
    },
};

AgCharts.create(options);
