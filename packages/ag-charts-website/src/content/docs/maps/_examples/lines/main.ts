import { CategoryAxisModule, LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { MapLineSeriesModule, MapMarkerSeriesModule, MapShapeBackgroundSeriesModule } from 'ag-charts-enterprise';

import { backgroundTopology } from './backgroundTopology';
import { backgroundTopologyNI } from './backgroundTopologyNI';
import { routeData } from './routeData';
import { routeTopology } from './routeTopology';
import { stationData } from './stationData';
import { stationTopology } from './stationTopology';

ModuleRegistry.registerModules([
    AnimationModule,
    CategoryAxisModule,
    CrosshairModule,
    LegendModule,
    MapLineSeriesModule,
    MapMarkerSeriesModule,
    MapShapeBackgroundSeriesModule,
    NumberAxisModule,
    ZoomModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    series: [
        {
            type: 'map-shape-background',
            topology: backgroundTopologyNI,
            fill: '#badc58',
            fillOpacity: 0.4,
        },
        {
            type: 'map-shape-background',
            topology: backgroundTopology,
            fill: '#badc58',
        },
        {
            type: 'map-line',
            topology: routeTopology,
            data: routeData,
            idKey: 'name',
            stroke: '#4834d4',
            strokeWidth: 2,
        },
        {
            type: 'map-marker',
            topology: stationTopology,
            data: stationData,
            idKey: 'name',
            labelKey: 'name',
            fill: '#4834d4',
            fillOpacity: 1,
            strokeWidth: 0,
            size: 5,
            label: {
                color: '#535c68',
                fontSize: 8,
            },
        },
    ],
};

AgCharts.create(options);
