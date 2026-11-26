import {
    AgCharts,
    AgPolarChartOptions,
    AngleCategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NightingaleSeriesModule,
    RadarAreaSeriesModule,
    RadarLineSeriesModule,
    RadiusNumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AngleCategoryAxisModule,
    LegendModule,
    NightingaleSeriesModule,
    RadarAreaSeriesModule,
    RadarLineSeriesModule,
    RadiusNumberAxisModule,
]);
const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    theme: 'ag-accessible',
    title: {
        text: 'Key Performance Indicators',
    },
    data: getData(),
    series: [
        {
            type: 'nightingale',
            angleKey: 'department',
            radiusKey: 'efficiency',
            radiusName: 'Efficiency',
        },
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'quality',
            radiusName: 'Quality',
        },
        {
            type: 'radar-line',
            angleKey: 'department',
            radiusKey: 'customerSatisfaction',
            radiusName: 'Customer Satisfaction',
        },
    ],
    axes: {
        angle: {
            type: 'angle-category',
        },
        radius: {
            type: 'radius-number',
        },
    },
};

AgCharts.create(options);
