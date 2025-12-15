import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    FunnelSeriesModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CategoryAxisModule,
    CrosshairModule,
    FunnelSeriesModule,
    LegendModule,
    NumberAxisModule,
    ContextMenuModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Conversion Drop Off',
    },
    series: [
        {
            type: 'funnel',
            stageKey: 'group',
            valueKey: 'value',
            fills: [
                {
                    type: 'gradient',
                    // bounds: 'series',
                    colorStops: [{ color: 'green' }, { color: 'white' }],
                },
            ],
            // itemStyler: () => {
            //     return { fill: { type: 'gradient' } };
            // },
        },
    ],
};

AgCharts.create(options);
