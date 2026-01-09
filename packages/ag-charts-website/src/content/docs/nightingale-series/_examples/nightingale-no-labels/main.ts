import {
    AgChartOptions,
    AgCharts,
    AngleCategoryAxisModule,
    ModuleRegistry,
    NightingaleSeriesModule,
    RadiusNumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([NightingaleSeriesModule, AngleCategoryAxisModule, RadiusNumberAxisModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'software',
            radiusName: 'Software',
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'hardware',
            radiusName: 'Hardware',
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'services',
            radiusName: 'Services',
        },
    ],
    axes: {
        angle: {
            type: 'angle-category',
            label: { enabled: false },
            line: { enabled: false },
            gridLine: { enabled: false },
        },
        radius: {
            type: 'radius-number',
            label: { enabled: false },
            gridLine: { enabled: false },
        },
    },
    legend: { enabled: false },
};

AgCharts.create(options);
