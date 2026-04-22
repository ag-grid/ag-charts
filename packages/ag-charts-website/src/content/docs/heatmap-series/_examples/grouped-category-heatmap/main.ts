import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    CategoryAxisModule,
    GradientLegendModule,
    GroupedCategoryAxisModule,
    HeatmapSeriesModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CategoryAxisModule,
    GradientLegendModule,
    GroupedCategoryAxisModule,
    HeatmapSeriesModule,
]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Mean temperature by city and quarter',
    },
    series: [
        {
            type: 'heatmap',
            xKey: 'period',
            xName: 'Period',
            yKey: 'city',
            yName: 'City',
            colorKey: 'temperature',
            colorName: 'Temperature',
        },
    ],
    axes: {
        x: {
            type: 'grouped-category',
            depthOptions: [{}, { label: { fontWeight: 'bold' } }],
        },
        y: {
            type: 'category',
        },
    },
};

const chart = AgCharts.create(options);
