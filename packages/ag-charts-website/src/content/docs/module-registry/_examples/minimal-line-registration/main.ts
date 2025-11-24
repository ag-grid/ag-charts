import {
    AgChartOptions,
    AgCharts,
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Registered Line Chart',
    },
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'revenue',
            yName: 'Revenue',
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            title: {
                text: 'Quarter',
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Revenue (USD Millions)',
            },
        },
    },
};

AgCharts.create(options);
