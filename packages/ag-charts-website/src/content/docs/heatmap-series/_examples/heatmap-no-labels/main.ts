import {
    AgChartOptions,
    AgCharts,
    CategoryAxisModule,
    GradientLegendModule,
    HeatmapSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, GradientLegendModule, HeatmapSeriesModule, NumberAxisModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'heatmap',
            xKey: 'month',
            yKey: 'year',
            colorKey: 'temperature',
        },
    ],
    axes: {
        x: {
            type: 'category',
            label: { enabled: false },
            line: { enabled: false },
        },
        y: {
            type: 'category',
            label: { enabled: false },
            line: { enabled: false },
        },
    },
    gradientLegend: { enabled: false },
};

AgCharts.create(options);
