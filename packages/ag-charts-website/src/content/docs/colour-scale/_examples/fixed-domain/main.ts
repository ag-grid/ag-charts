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
        text: 'Average Rating',
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
                fills: [{ color: 'tomato' }, { color: 'gold' }, { color: 'seagreen' }],
            },
        },
    ],
    gradientLegend: { gradient: { preferredLength: 200 }, scale: { interval: { step: 1 } } },
};

const chart = AgCharts.create(options);

function setDomain(type: 'auto' | 'fixed') {
    const series = options.series![0] as AgHeatmapSeriesOptions;
    series.colorScale = {
        ...series.colorScale,
        domain: type === 'fixed' ? [1, 10] : undefined,
    };
    chart.update(options);
}
