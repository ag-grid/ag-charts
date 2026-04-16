import {
    AgCartesianChartOptions,
    AgCharts,
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
                mode: 'discrete',
                fills: [
                    { color: 'steelblue', name: 'Cold', stop: 5 },
                    { color: 'lightblue', name: 'Cool', stop: 10 },
                    { color: 'lightyellow', name: 'Mild', stop: 15 },
                    { color: 'coral', name: 'Warm' },
                ],
            },
        },
    ],
    gradientLegend: {
        gradient: {
            preferredLength: 300,
        },
    },
};

const chart = AgCharts.create(options);

function toggleMode() {
    const series = options.series![0] as any;
    const current = series.colorScale.mode;
    series.colorScale.mode = current === 'discrete' ? 'continuous' : 'discrete';
    chart.update(options);
}
