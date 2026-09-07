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

ModuleRegistry.registerModules([CategoryAxisModule, GradientLegendModule, LegendModule, HeatmapSeriesModule]);

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

function modeChange(event: Event) {
    const mode = (event.target as HTMLInputElement).value as 'continuous' | 'discrete';
    const series = options.series![0] as AgHeatmapSeriesOptions;
    series.colorScale = { ...series.colorScale, mode };
    chart.update(options);
}

function domainChange(event: Event) {
    const type = (event.target as HTMLInputElement).value as 'auto' | 'fixed';
    const series = options.series![0] as AgHeatmapSeriesOptions;
    series.colorScale = {
        ...series.colorScale,
        domain: type === 'fixed' ? [0, 25] : undefined,
    };
    chart.update(options);
}
