import {
    AgCartesianChartOptions,
    AgCharts,
    AgHeatmapSeriesOptions,
    CategoryAxisModule,
    GradientLegendModule,
    HeatmapSeriesModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, GradientLegendModule, HeatmapSeriesModule]);

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
                missingDataFill: '#e0e0e0',
            },
        },
    ],
};

const chart = AgCharts.create(options);

function setMissingFill(enabled: boolean) {
    const series = options.series![0] as AgHeatmapSeriesOptions;
    series.colorScale = {
        ...series.colorScale,
        missingDataFill: enabled ? '#e0e0e0' : undefined,
    };
    chart.update(options);
}
