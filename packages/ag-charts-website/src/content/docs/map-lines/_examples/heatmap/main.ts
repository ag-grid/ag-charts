import { CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { GradientLegendModule, MapLineSeriesModule, MapShapeBackgroundSeriesModule } from 'ag-charts-enterprise';

import { backgroundTopology } from './backgroundTopology';
import { data } from './data';
import { topology } from './topology';

ModuleRegistry.registerModules([
    AnimationModule,
    CategoryAxisModule,
    CrosshairModule,
    GradientLegendModule,
    MapLineSeriesModule,
    MapShapeBackgroundSeriesModule,
    NumberAxisModule,
    ZoomModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'UK Motorways',
    },
    data,
    topology,
    series: [
        {
            type: 'map-shape-background',
            topology: backgroundTopology,
        },
        {
            type: 'map-line',
            idKey: 'name',
            colorKey: 'dailyVehicles',
            colorName: 'Daily Vehicles',
        },
    ],
    gradientLegend: {
        scale: { label: { format: '.2s' } },
        position: 'right-top',
    },
};

AgCharts.create(options);
