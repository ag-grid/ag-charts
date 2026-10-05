import {
    AgChartOptions,
    AgCharts,
    AngleCategoryAxisModule,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    RadarAreaSeriesModule,
    RadiusNumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    RadarAreaSeriesModule,
    AngleCategoryAxisModule,
    RadiusNumberAxisModule,
    ContextMenuModule,
]);
const options: AgChartOptions = {
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
            shadow: {
                enabled: true,
                color: 'rgba(0, 0, 0, 0.4)',
                xOffset: 3,
                yOffset: 3,
                blur: 6,
            },
        },
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'efficiency',
            radiusName: 'Efficiency',
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

AgCharts.create(options);
