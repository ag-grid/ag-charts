import { CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { MapMarkerSeriesModule, MapShapeBackgroundSeriesModule } from 'ag-charts-enterprise';

import { backgroundTopology } from './backgroundTopology';
import { data } from './data';

ModuleRegistry.registerModules([
    CategoryAxisModule,
    MapMarkerSeriesModule,
    MapShapeBackgroundSeriesModule,
    NumberAxisModule,
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
        },
    ],
};

AgCharts.create(options);
