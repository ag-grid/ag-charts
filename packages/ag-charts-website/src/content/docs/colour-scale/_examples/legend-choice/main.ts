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
                domain: [0, 10],
                fills: [{ color: 'tomato', stop: 7 }, { color: 'gold', stop: 9 }, { color: 'seagreen' }],
            },
        },
    ],
    gradientLegend: {
        enabled: true,
        gradient: {
            preferredLength: 200,
        },
    },
    legend: {
        enabled: false,
    },
};

const chart = AgCharts.create(options);

function modeChange(event: Event) {
    const mode = (event.target as HTMLInputElement).value as 'continuous' | 'discrete';
    const series = options.series![0] as AgHeatmapSeriesOptions;
    series.colorScale = { ...series.colorScale, mode };
    chart.update(options);
}

function gradientLegendChange(event: Event) {
    const enabled = (event.target as HTMLInputElement).value === 'on';
    options.gradientLegend = { ...options.gradientLegend, enabled };
    chart.update(options);
}

function categoryLegendChange(event: Event) {
    const enabled = (event.target as HTMLInputElement).value === 'on';
    options.legend = { ...options.legend, enabled };
    chart.update(options);
}
