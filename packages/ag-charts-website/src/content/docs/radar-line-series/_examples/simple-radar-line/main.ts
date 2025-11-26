import { LegendModule, ModuleRegistry } from 'ag-charts-community';
import {
    AgChartOptions,
    AgCharts,
    AngleCategoryAxisModule,
    AnimationModule,
    CrosshairModule,
    RadarLineSeriesModule,
    RadiusNumberAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    RadarLineSeriesModule,
    ZoomModule,
    AngleCategoryAxisModule,
    RadiusNumberAxisModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'KPIs by Department',
    },
    series: [
        {
            type: 'radar-line',
            angleKey: 'department',
            radiusKey: 'quality',
            radiusName: 'Quality',
        },
        {
            type: 'radar-line',
            angleKey: 'department',
            radiusKey: 'efficiency',
            radiusName: 'Efficiency',
        },
    ],
};

AgCharts.create(options);
