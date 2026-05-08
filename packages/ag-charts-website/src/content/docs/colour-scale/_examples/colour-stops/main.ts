import {
    AgCartesianChartOptions,
    AgCharts,
    AgColorScaleColorStop,
    AgHeatmapSeriesOptions,
    CategoryAxisModule,
    GradientLegendModule,
    HeatmapSeriesModule,
    LegendModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, GradientLegendModule, HeatmapSeriesModule, LegendModule]);

const equalFills: AgColorScaleColorStop[] = [{ color: 'tomato' }, { color: 'gold' }, { color: 'seagreen' }];

const stopFills: AgColorScaleColorStop[] = [
    { color: 'tomato', stop: 7 },
    { color: 'gold', stop: 9 },
    { color: 'seagreen' },
];

const namedFills: AgColorScaleColorStop[] = [
    { color: 'tomato', name: 'Detractor', stop: 7 },
    { color: 'gold', name: 'Passive', stop: 9 },
    { color: 'seagreen', name: 'Promoter' },
];

let currentMode: 'continuous' | 'discrete' = 'continuous';

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
                fills: equalFills,
                domain: [0, 10],
            },
        },
    ],
    gradientLegend: {
        enabled: true,
        position: 'right',
        gradient: {
            preferredLength: 200,
        },
    },
    legend: {
        enabled: false,
    },
};

const chart = AgCharts.create(options);

function setMode(mode: 'continuous' | 'discrete') {
    currentMode = mode;
    const series = options.series![0] as AgHeatmapSeriesOptions;
    const discrete = mode === 'discrete';
    series.colorScale = { ...series.colorScale, mode };
    options.gradientLegend = { ...options.gradientLegend, enabled: !discrete };
    options.legend = { ...options.legend, enabled: discrete };
    chart.update(options);
}

function setFills(type: 'equal' | 'stops' | 'named') {
    const series = options.series![0] as AgHeatmapSeriesOptions;
    const fills = type === 'named' ? namedFills : type === 'stops' ? stopFills : equalFills;
    series.colorScale = { ...series.colorScale, fills };
    chart.update(options);
}
