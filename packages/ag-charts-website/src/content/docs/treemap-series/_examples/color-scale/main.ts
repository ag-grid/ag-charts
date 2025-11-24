import { CategoryAxisModule, LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { TreemapSeriesModule } from 'ag-charts-enterprise';

import { data } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CategoryAxisModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    TreemapSeriesModule,
    ZoomModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: data,
    series: [
        {
            type: 'treemap',
            labelKey: 'title',
            sizeKey: 'total',
            sizeName: 'Total',
            colorKey: 'change',
            colorName: 'Change',
            colorRange: ['#43A047', '#FF5722'],
        },
    ],
    title: {
        text: 'UK Government Budget',
    },
    subtitle: {
        text: '2024',
    },
};

AgCharts.create(options);
