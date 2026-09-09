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

function toString(ev: { datum: DataType; yKey?: keyof DataType; seriesId: string }) {
    return `Temperature in ${ev.datum.month}: ${String(ev.datum[ev.yKey!])}°C. Series: ${ev.seriesId}`;
}

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
                seriesNodeClick: (ev) => console.log('[line click]', toString(ev)),
                seriesNodeDoubleClick: (ev) => console.log('[line double click]', toString(ev)),
            },
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'low',
            listeners: {
                seriesNodeClick: (ev) => console.log('[bar click]', toString(ev)),
                seriesNodeDoubleClick: (ev) => console.log('[bar double click]', toString(ev)),
            },
        },
    ],
    listeners: {
        seriesNodeClick: (ev) => console.log('[chart click]', toString(ev)),
        seriesNodeDoubleClick: (ev) => console.log('[chart double click]', toString(ev)),
    },
};

AgCharts.create(options);
