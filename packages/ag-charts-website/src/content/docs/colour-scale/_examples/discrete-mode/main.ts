import {
    AgCartesianChartOptions,
    AgCharts,
    AgHeatmapSeriesOptions,
    CategoryAxisModule,
    GradientLegendModule,
    HeatmapSeriesModule,
    LegendModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, GradientLegendModule, HeatmapSeriesModule, LegendModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Service Quality Ratings',
    },
    subtitle: {
        text: 'NPS Score (0–10)',
    },
    series: [
        {
            type: 'heatmap',
            xKey: 'segment',
            xName: 'Segment',
            yKey: 'service',
            yName: 'Service',
            colorKey: 'score',
            colorName: 'Score',
            colorScale: {
                mode: 'discrete',
                domain: [0, 10],
                fills: [{ color: 'tomato', stop: 7 }, { color: 'gold', stop: 9 }, { color: 'seagreen' }],
            },
        },
    ],
    legend: {
        enabled: true,
    },
    gradientLegend: {
        enabled: false,
    },
};

const chart = AgCharts.create(options);

function toggleMode() {
    const series = options.series![0] as AgHeatmapSeriesOptions;
    const current = series.colorScale?.mode;
    const discrete = current !== 'discrete';
    series.colorScale = { ...series.colorScale, mode: discrete ? 'discrete' : 'continuous' };
    options.legend = { enabled: discrete };
    options.gradientLegend = { enabled: !discrete };
    chart.update(options);
}
