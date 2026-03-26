import {
    AgChartOptions,
    AgCharts,
    BoxPlotSeriesModule,
    CategoryAxisModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BoxPlotSeriesModule, CategoryAxisModule, NumberAxisModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'box-plot',
            xKey: 'department',
            minKey: 'min',
            q1Key: 'q1',
            medianKey: 'median',
            q3Key: 'q3',
            maxKey: 'max',
        },
    ],
    axes: {
        x: {
            type: 'category',
            label: { enabled: false },
            line: { enabled: false },
        },
        y: {
            type: 'number',
            label: { enabled: false },
            gridLine: { enabled: false },
        },
    },
    legend: { enabled: false },
};

AgCharts.create(options);
