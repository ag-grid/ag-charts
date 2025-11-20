import { CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { MapMarkerSeriesModule, MapShapeBackgroundSeriesModule } from 'ag-charts-enterprise';

import { backgroundTopology } from './backgroundTopology';
import { data } from './data';
import { topology } from './topology';

ModuleRegistry.registerModules([
    CategoryAxisModule,
    MapMarkerSeriesModule,
    MapShapeBackgroundSeriesModule,
    NumberAxisModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'UK Cities',
    },
    data,
    topology,
    series: [
        {
            type: 'map-shape-background',
            topology: backgroundTopology,
        },
        {
            type: 'map-marker',
            idKey: 'name',
        },
    ],
};

AgCharts.create(options);
