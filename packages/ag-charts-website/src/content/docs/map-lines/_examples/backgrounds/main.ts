import { CategoryAxisModule, LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { MapLineBackgroundSeriesModule, MapShapeBackgroundSeriesModule } from 'ag-charts-enterprise';

import { backgroundTopology } from './backgroundTopology';
import { topology } from './topology';

ModuleRegistry.registerModules([
    CategoryAxisModule,
    LegendModule,
    MapLineBackgroundSeriesModule,
    MapShapeBackgroundSeriesModule,
    NumberAxisModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'UK Motorways',
    },
    series: [
        {
            type: 'map-shape-background',
            topology: backgroundTopology,
        },
        {
            type: 'map-line-background',
            topology,
        },
    ],
    overlays: {
        noData: { text: '' },
    },
};

AgCharts.create(options);
