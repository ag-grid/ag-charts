import { CategoryAxisModule, LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { MapMarkerSeriesModule, MapShapeBackgroundSeriesModule } from 'ag-charts-enterprise';

import { backgroundTopology } from './backgroundTopology';
import { data } from './data';
import { topology } from './topology';

ModuleRegistry.registerModules([
    AnimationModule,
    CategoryAxisModule,
    CrosshairModule,
    LegendModule,
    MapMarkerSeriesModule,
    MapShapeBackgroundSeriesModule,
    NumberAxisModule,
    ZoomModule,
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
