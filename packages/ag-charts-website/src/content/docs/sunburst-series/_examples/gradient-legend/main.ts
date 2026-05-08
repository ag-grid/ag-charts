import {
    AgChartOptions,
    AgCharts,
    GradientLegendModule,
    LegendModule,
    ModuleRegistry,
    SunburstSeriesModule,
} from 'ag-charts-enterprise';

import { data } from './data';

ModuleRegistry.registerModules([GradientLegendModule, LegendModule, SunburstSeriesModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: data,
    series: [
        {
            type: 'sunburst',
            labelKey: 'name',
            colorKey: 'gdpChange',
            colorName: 'Change',
            colorScale: {
                mode: 'discrete',
                fills: [
                    { color: 'tomato', stop: -0.01, name: 'Decline' },
                    { color: 'gold', stop: 0.01, name: 'Flat' },
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
        text: 'Top Economies by GDP',
    },
    subtitle: {
        text: '2023 — Year-on-year change',
    },
};

AgCharts.create(options);
