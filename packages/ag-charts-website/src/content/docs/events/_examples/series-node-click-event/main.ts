import type { AgChartOptions } from 'ag-charts-community';
import {
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LineSeriesModule, NumberAxisModule]);

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Average low/high temperatures in London',
    },
    subtitle: {
        text: '(click a data point for details)',
    },
    data: getData(),
    legend: {
        enabled: false,
    },
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'high',
            listeners: {
                seriesNodeClick: (event) => console.log('[line click]', event),
                seriesNodeDoubleClick: (event) => console.log('[line double click]', event),
            },
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'low',
            listeners: {
                seriesNodeClick: (event) => console.log('[bar click]', event),
                seriesNodeDoubleClick: (event) => console.log('[bar double click]', event),
            },
        },
    ],
    listeners: {
        seriesNodeClick: (event) => console.log('[chart click]', event),
        seriesNodeDoubleClick: (event) => console.log('[chart double click]', event),
    },
};

AgCharts.create(options);
