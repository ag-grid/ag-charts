import {
    AgChartOptions,
    AgCharts,
    CategoryAxisModule,
    HeatmapSeriesModule,
    ModuleRegistry,
    ScatterSeriesModule,
} from 'ag-charts-enterprise';

type ScatterDatum = { x: string; y: string; label: string };

type HeatmapDatum = { x: string; y: string; value: number };

ModuleRegistry.registerModules([CategoryAxisModule, HeatmapSeriesModule, ScatterSeriesModule]);

const scatterData: ScatterDatum[] = [{ x: 'B', y: 'High', label: 'B' }];

const heatmapData: HeatmapDatum[] = [
    { x: 'A', y: 'Low', value: 10 },
    { x: 'B', y: 'Low', value: 20 },
    { x: 'A', y: 'High', value: 30 },
    { x: 'B', y: 'High', value: 40 },
];

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    animation: { enabled: false },
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            label: { enabled: false },
        },
        y: {
            type: 'category',
            position: 'left',
            label: { enabled: false },
        },
    },
    series: [
        {
            type: 'heatmap',
            data: heatmapData,
            xKey: 'x',
            yKey: 'y',
            colorKey: 'value',
            tooltip: { enabled: false },
        },
        {
            type: 'scatter',
            data: scatterData,
            xKey: 'x',
            yKey: 'y',
            size: 6,
            tooltip: {
                range: 40,
                renderer: ({ datum }) => `Scatter ${datum.label}`,
            },
        },
    ],
};

const chart = AgCharts.create(options);

// For e2e testing.
(window as any).agE2E = { chart };
