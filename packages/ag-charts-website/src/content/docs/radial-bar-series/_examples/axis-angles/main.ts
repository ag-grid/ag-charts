import {
    AgChartOptions,
    AgCharts,
    AngleNumberAxisModule,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    RadialBarSeriesModule,
    RadiusCategoryAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AngleNumberAxisModule,
    AnimationModule,
    CrosshairModule,
    LegendModule,
    RadialBarSeriesModule,
    RadiusCategoryAxisModule,
    ContextMenuModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Revenue by Product Category',
    },
    subtitle: {
        text: 'Millions USD',
    },
    series: [
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'software',
            angleName: 'Software',
        },
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'hardware',
            angleName: 'Hardware',
        },
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'services',
            angleName: 'Services',
        },
    ],
    axes: {
        angle: {
            type: 'angle-number',
            startAngle: -90,
            endAngle: 90,
        },
        radius: {
            type: 'radius-category',
            positionAngle: 270,
        },
    },
};

AgCharts.create(options);
