import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    MapShapeSeriesModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

import { central, eastern, mountain, pacific } from './data';
import { topology } from './topology';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    MapShapeSeriesModule,
    ContextMenuModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Timezones Across America',
    },
    topology,
    series: [
        {
            type: 'map-shape',
            data: pacific,
            idKey: 'name',
            title: 'Pacific',
            gap: 4,
        },
        {
            type: 'map-shape',
            data: mountain,
            idKey: 'name',
            title: 'Mountain',
            gap: 4,
        },
        {
            type: 'map-shape',
            data: central,
            idKey: 'name',
            title: 'Central',
            gap: 4,
        },
        {
            type: 'map-shape',
            data: eastern,
            idKey: 'name',
            title: 'Eastern',
            gap: 4,
        },
    ],
    legend: {
        enabled: true,
    },
};

AgCharts.create(options);
