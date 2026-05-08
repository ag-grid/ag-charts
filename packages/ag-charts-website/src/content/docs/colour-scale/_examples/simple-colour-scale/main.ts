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
        },
    ],
};

const chart = AgCharts.create(options);
