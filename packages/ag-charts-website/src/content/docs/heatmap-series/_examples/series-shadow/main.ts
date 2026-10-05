import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    GradientLegendModule,
    HeatmapSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CategoryAxisModule,
    CrosshairModule,
    GradientLegendModule,
    HeatmapSeriesModule,
    NumberAxisModule,
    ContextMenuModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'UK monthly mean temperature °C',
    },
    series: [
        {
            type: 'heatmap',
            xKey: 'month',
            xName: 'Month',
            yKey: 'year',
            yName: 'Year',
            colorKey: 'temperature',
            colorName: 'Temperature',
            shadow: {
                enabled: true,
                color: 'rgba(0, 0, 0, 0.4)',
                xOffset: 3,
                yOffset: 3,
                blur: 6,
            },
        },
    ],
};

const chart = AgCharts.create(options);
