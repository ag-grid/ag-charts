import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    MapLineSeriesModule,
    MapMarkerSeriesModule,
    MapShapeBackgroundSeriesModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

import { backgroundTopology } from './backgroundTopology';
import { backgroundTopologyNI } from './backgroundTopologyNI';
import { routeData } from './routeData';
import { routeTopology } from './routeTopology';
import { stationData } from './stationData';
import { stationTopology } from './stationTopology';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    MapLineSeriesModule,
    MapMarkerSeriesModule,
    MapShapeBackgroundSeriesModule,
    ContextMenuModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    theme: 'ag-accessible',
    title: {
        text: 'Irish Rail Network',
    },
    series: [
        {
            type: 'map-shape-background',
            topology: backgroundTopologyNI,
        },
        {
            type: 'map-shape-background',
            topology: backgroundTopology,
        },
        {
            type: 'map-line',
            topology: routeTopology,
            data: routeData,
            idKey: 'name',
        },
        {
            type: 'map-marker',
            topology: stationTopology,
            data: stationData,
            idKey: 'name',
            labelKey: 'name',
            size: 5,
        },
    ],
};

AgCharts.create(options);
