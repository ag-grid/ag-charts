import {
    AgChartOptions,
    AgCharts,
    AngleCategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    RadarAreaSeriesModule,
    RadiusNumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([LegendModule, RadarAreaSeriesModule, AngleCategoryAxisModule, RadiusNumberAxisModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
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
            label: {
                enabled: false,
            },
            gridLine: {
                enabled: true,
            },
        },
        radius: {
            type: 'radius-number',
            label: {
                enabled: false,
            },
            gridLine: {
                enabled: true,
            },
        },
    },
    legend: {
        enabled: false,
    },
};

AgCharts.create(options);
