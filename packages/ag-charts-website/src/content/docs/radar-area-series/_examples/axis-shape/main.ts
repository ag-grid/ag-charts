import { LegendModule, ModuleRegistry } from 'ag-charts-community';
import {
    AgCharts,
    AgPolarChartOptions,
    AngleCategoryAxisModule,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    RadarAreaSeriesModule,
    RadiusNumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AngleCategoryAxisModule,
    AnimationModule,
    CrosshairModule,
    LegendModule,
    RadarAreaSeriesModule,
    RadiusNumberAxisModule,
    ContextMenuModule,
]);
const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'KPIs by Department',
    },
    series: [
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'quality',
            radiusName: 'Quality',
        },
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'efficiency',
            radiusName: 'Efficiency',
        },
    ],
    axes: {
        angle: {
            type: 'angle-category',
            shape: 'circle',
        },
        radius: {
            type: 'radius-number',
            shape: 'circle',
        },
    },
};

AgCharts.create(options);
