import {
    AgCartesianChartOptions,
    AgCharts,
    ContextMenuModule,
    CrosshairModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    TimeAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    ContextMenuModule,
    CrosshairModule,
    LineSeriesModule,
    NumberAxisModule,
    TimeAxisModule,
]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Intraday Share Price',
    },
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'price',
            yName: 'Price',
        },
    ],
    axes: {
        x: {
            type: 'time',
            crosshair: {
                enabled: true,
                snapInterval: { unit: 'minute', step: 15 },
            },
        },
        y: {
            type: 'number',
            crosshair: {
                enabled: true,
                snapInterval: 0.25,
            },
        },
    },
    tooltip: {
        enabled: false,
    },
    formatter: {
        y: ({ value }) => Number(value).toFixed(2),
    },
};

AgCharts.create(options);
