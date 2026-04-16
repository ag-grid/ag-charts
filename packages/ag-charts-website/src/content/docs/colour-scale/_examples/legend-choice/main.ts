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

let useGradientLegend = true;

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
        enabled: true,
        gradient: {
            preferredLength: 300,
        },
    },
    legend: {
        enabled: false,
    },
};

const chart = AgCharts.create(options);

function setMode(mode: 'continuous' | 'discrete') {
    const series = options.series![0] as any;
    series.colorScale.mode = mode;
    chart.update(options);
}

function toggleLegendType() {
    useGradientLegend = !useGradientLegend;
    options.gradientLegend = { ...options.gradientLegend, enabled: useGradientLegend };
    options.legend = { ...options.legend, enabled: !useGradientLegend };
    chart.update(options);
}
