import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    TreemapSeriesModule,
} from 'ag-charts-enterprise';

import { data } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    TreemapSeriesModule,
    ContextMenuModule,
]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'treemap',
            labelKey: 'name',
            group: {
                // Two colours over a three-deep hierarchy, so the third band rotates back to the first.
                fills: ['#6f9be8', '#f3a93b'],
            },
        },
    ],
    title: {
        text: 'Group Fills Cycle By Depth',
    },
};

AgCharts.create(options);
