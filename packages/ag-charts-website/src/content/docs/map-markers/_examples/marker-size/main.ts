import { LegendModule, ModuleRegistry } from 'ag-charts-community';
import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    MapMarkerSeriesModule,
    MapShapeBackgroundSeriesModule,
} from 'ag-charts-enterprise';

import { backgroundTopology } from './backgroundTopology';
import { data } from './data';

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
            latitudeKey: 'lat',
            longitudeKey: 'lon',
            sizeKey: 'count',
            sizeName: 'Count',
            size: 3,
            maxSize: 50,
        },
    ],
};

AgCharts.create(options);
