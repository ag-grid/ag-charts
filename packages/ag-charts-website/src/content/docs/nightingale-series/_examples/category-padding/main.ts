import { LegendModule, ModuleRegistry } from 'ag-charts-community';
import {
    AgChartOptions,
    AgCharts,
    AngleCategoryAxisModule,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    NightingaleSeriesModule,
    RadiusNumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AngleCategoryAxisModule,
    AnimationModule,
    CrosshairModule,
    LegendModule,
    NightingaleSeriesModule,
    RadiusNumberAxisModule,
    ContextMenuModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: `Revenue by product category`,
    },
    subtitle: {
        text: 'Millions USD',
    },
    series: [
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'software',
            radiusName: 'Software',
            grouped: true,
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'hardware',
            radiusName: 'Hardware',
            grouped: true,
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'services',
            radiusName: 'Services',
            grouped: true,
        },
    ],
    axes: {
        angle: {
            type: 'angle-category',
            groupPaddingInner: 0.2,
            paddingInner: 0.3,
        },
        radius: {
            type: 'radius-number',
        },
    },
};

AgCharts.create(options);
