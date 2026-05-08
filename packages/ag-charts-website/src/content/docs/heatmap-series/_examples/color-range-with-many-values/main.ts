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
        text: 'UK Monthly Mean Temperature',
    },
    series: [
        {
            type: 'heatmap',
            xKey: 'month',
            xName: 'Month',
            yKey: 'year',
            yName: 'Year',
            colorKey: 'temperature',
            colorName: 'Temperature',
            colorScale: {
                fills: [{ color: 'navy' }, { color: 'lightyellow', stop: 10 }, { color: 'darkred' }],
            },
        },
    ],
};

const chart = AgCharts.create(options);

function setMode(mode: 'continuous' | 'discrete') {
    const series = options.series![0] as AgHeatmapSeriesOptions;
    series.colorScale = { ...series.colorScale, mode };
    chart.update(options);
}

function setDomain(type: 'auto' | 'fixed') {
    const series = options.series![0] as AgHeatmapSeriesOptions;
    series.colorScale = {
        ...series.colorScale,
        domain: type === 'fixed' ? [0, 25] : undefined,
    };
    chart.update(options);
}
