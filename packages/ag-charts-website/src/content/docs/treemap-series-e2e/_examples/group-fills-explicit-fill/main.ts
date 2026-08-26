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
                // An explicit fill wins at every depth; the fills array is never consulted.
                fill: '#8e6fb8',
                fills: ['#6f9be8', '#f3a93b'],
            },
        },
    ],
    title: {
        text: 'Explicit Group Fill Wins Over Group Fills',
    },
};

AgCharts.create(options);
