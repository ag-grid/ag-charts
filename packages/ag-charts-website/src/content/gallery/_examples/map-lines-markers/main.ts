import { LegendModule, ModuleRegistry } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import {
    MapLineBackgroundSeriesModule,
    MapLineSeriesModule,
    MapMarkerSeriesModule,
    MapShapeBackgroundSeriesModule,
} from 'ag-charts-enterprise';

import { cycleCounterData } from './cycleCounterData';
import { cycleCounterTopology } from './cycleCounterTopology';
import { cycleRouteData } from './cycleRouteData';
import { cycleRouteTopology } from './cycleRouteTopology';
import { yorkRoadsTopology } from './yorkRoadsTopology';
import { yorkTopology } from './yorkTopology';

ModuleRegistry.registerModules([
    LegendModule,
    MapLineBackgroundSeriesModule,
    MapLineSeriesModule,
    MapMarkerSeriesModule,
    MapShapeBackgroundSeriesModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'York Cycle Network Infrastructure',
    },
    footnote: {
        text: 'Data: York City Council',
    },
    series: [
        {
            type: 'map-shape-background',
            topology: yorkTopology,
        },
        {
            type: 'map-line-background',
            topology: yorkRoadsTopology,
            strokeWidth: 3,
        },
        {
            type: 'map-line',
            title: 'Cycle Lanes',
            topologyIdKey: 'name',
            idKey: 'name',
            topology: cycleRouteTopology,
            data: cycleRouteData,
            strokeOpacity: 0.9,
        },
        {
            type: 'map-marker',
            title: 'Cycle Traffic Cameras',
            idKey: 'RoadName',
            topologyIdKey: 'RoadName',
            topology: cycleCounterTopology,
            data: cycleCounterData,
            fillOpacity: 0.95,
            shape: 'pin',
            size: 18,
            strokeWidth: 1.5,
            strokeOpacity: 0.8,
        },
    ],
    legend: {
        enabled: true,
        position: {
            placement: 'right',
            floating: true,
        },
    },
};

AgCharts.create(options);
