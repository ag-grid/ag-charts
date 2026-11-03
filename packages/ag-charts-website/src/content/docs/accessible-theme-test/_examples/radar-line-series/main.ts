import {
    AgChartOptions,
    AgCharts,
    AngleCategoryAxisModule,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    RadarLineSeriesModule,
    RadiusNumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    RadarLineSeriesModule,
    AngleCategoryAxisModule,
    RadiusNumberAxisModule,
    ContextMenuModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    theme: 'ag-accessible',
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
        {
            type: 'radar-line',
            angleKey: 'department',
            radiusKey: 'satisfaction',
            radiusName: 'Satisfaction',
        },
    ],
};

AgCharts.create(options);
