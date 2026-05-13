import {
    AgCharts,
    AgStandaloneChartOptions,
    AgTreemapSeriesOptions,
    GradientLegendModule,
    LegendModule,
    ModuleRegistry,
    TreemapSeriesModule,
} from 'ag-charts-enterprise';

import { data } from './data';

ModuleRegistry.registerModules([GradientLegendModule, LegendModule, TreemapSeriesModule]);

const options: AgStandaloneChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'treemap',
            labelKey: 'title',
            colorKey: 'change',
            colorName: 'Change',
            colorScale: {
                fills: [{ color: 'tomato' }, { color: 'gold' }, { color: 'seagreen' }],
                domain: [-40, 40],
            },
        },
    ],
    legend: {
        enabled: false,
    },
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

const chart = AgCharts.create(options);

function toggleMode(mode: 'stops' | 'gradient') {
    const series = options.series![0] as AgTreemapSeriesOptions;
    if (mode === 'stops') {
        series.colorScale = {
            mode: 'discrete',
            fills: [
                { color: 'tomato', stop: -0.1, name: 'Decline' },
                { color: 'gold', stop: 0.1, name: 'Flat' },
                { color: 'seagreen', name: 'Growth' },
            ],
        };
        options.legend = { enabled: true };
        options.gradientLegend = { enabled: false };
    } else {
        series.colorScale = {
            fills: [{ color: 'tomato' }, { color: 'gold' }, { color: 'seagreen' }],
            domain: [-40, 40],
        };
        options.legend = { enabled: false };
        options.gradientLegend = { enabled: true };
    }
    chart.update(options);
}
