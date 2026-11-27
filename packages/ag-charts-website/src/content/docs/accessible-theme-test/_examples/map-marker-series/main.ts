import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    MapMarkerSeriesModule,
    MapShapeBackgroundSeriesModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

import { backgroundTopology } from './backgroundTopology';
import { data, stations } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    MapMarkerSeriesModule,
    MapShapeBackgroundSeriesModule,
    ContextMenuModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    theme: 'ag-accessible',
    title: {
        text: 'Crime in Surrey',
    },
    data,
    series: [
        {
            type: 'map-shape-background',
            topology: backgroundTopology,
        },
        {
            type: 'map-marker',
            title: 'Crimes',
            legendItemName: 'Crimes',
            latitudeKey: 'lat',
            longitudeKey: 'lon',
        },
        {
            type: 'map-marker',
            title: 'Police Stations',
            legendItemName: 'Police Stations',
            data: stations,
            latitudeKey: 'lat',
            longitudeKey: 'lon',
            labelKey: 'name',
        },
    ],
};

AgCharts.create(options);
