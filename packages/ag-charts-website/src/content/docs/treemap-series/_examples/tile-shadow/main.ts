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
            labelKey: 'title',
            tile: {
                shadow: {
                    enabled: true,
                    color: 'rgba(0, 0, 0, 0.4)',
                    xOffset: 3,
                    yOffset: 3,
                    blur: 6,
                },
            },
        },
    ],
    title: {
        text: 'UK Government Budget',
    },
    subtitle: {
        text: '2024',
    },
};

AgCharts.create(options);
