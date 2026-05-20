import {
    AgCharts,
    AgStandaloneChartOptions,
    AgSunburstSeriesOptions,
    GradientLegendModule,
    LegendModule,
    ModuleRegistry,
    SunburstSeriesModule,
} from 'ag-charts-enterprise';

import { data } from './data';

ModuleRegistry.registerModules([GradientLegendModule, LegendModule, SunburstSeriesModule]);

const options: AgStandaloneChartOptions = {
    container: document.getElementById('myChart'),
    data: data,
    series: [
        {
            type: 'sunburst',
            labelKey: 'name',
            colorKey: 'gdpChange',
            colorName: 'Change',
            colorScale: {
                fills: [{ color: 'tomato' }, { color: 'gold' }, { color: 'seagreen' }],
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
        text: 'Top Economies by GDP',
    },
    subtitle: {
        text: '2023 — Year-on-year change',
    },
};

const chart = AgCharts.create(options);

function toggleMode(mode: 'stops' | 'gradient') {
    const series = options.series![0] as AgSunburstSeriesOptions;
    if (mode === 'stops') {
        series.colorScale = {
            mode: 'discrete',
            fills: [
                { color: 'tomato', stop: -0.01, name: 'Decline' },
                { color: 'gold', stop: 0.01, name: 'Flat' },
                { color: 'seagreen', name: 'Growth' },
            ],
        };
        options.legend = { enabled: true };
        options.gradientLegend = { enabled: false };
    } else {
        series.colorScale = {
            fills: [{ color: 'tomato' }, { color: 'gold' }, { color: 'seagreen' }],
        };
        options.legend = { enabled: false };
        options.gradientLegend = { enabled: true };
    }
    chart.update(options);
}
