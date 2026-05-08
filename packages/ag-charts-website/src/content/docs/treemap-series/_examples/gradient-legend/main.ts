import {
    AgChartOptions,
    AgCharts,
    GradientLegendModule,
    ModuleRegistry,
    TreemapSeriesModule,
} from 'ag-charts-enterprise';

import { data } from './data';

ModuleRegistry.registerModules([GradientLegendModule, TreemapSeriesModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'treemap',
            labelKey: 'title',
            colorKey: 'change',
            colorName: 'Change',
            colorScale: {
                fills: [{ color: 'tomato' }, { color: 'lightyellow', stop: 0 }, { color: 'seagreen' }],
            },
        },
    ],
    gradientLegend: {
        enabled: true,
    },
    title: {
        text: 'UK Government Budget',
    },
    subtitle: {
        text: '2024 — Change from previous year',
    },
};

AgCharts.create(options);
