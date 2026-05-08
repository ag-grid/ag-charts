import {
    AgChartOptions,
    AgCharts,
    GradientLegendModule,
    LegendModule,
    ModuleRegistry,
    TreemapSeriesModule,
} from 'ag-charts-enterprise';

import { data } from './data';

ModuleRegistry.registerModules([GradientLegendModule, LegendModule, TreemapSeriesModule]);

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
                mode: 'discrete',
                fills: [
                    { color: 'tomato', stop: -0.1, name: 'Decline' },
                    { color: 'gold', stop: 0.1, name: 'Flat' },
                    { color: 'seagreen', name: 'Growth' },
                ],
            },
        },
    ],
    legend: {
        enabled: true,
    },
    gradientLegend: {
        enabled: false,
    },
    title: {
        text: 'UK Government Budget',
    },
    subtitle: {
        text: '2024 — Change from previous year',
    },
};

AgCharts.create(options);
