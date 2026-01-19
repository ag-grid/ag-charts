import {
    AgCartesianChartOptions,
    AgCharts,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    ScrollbarModule,
    UnitTimeAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([LineSeriesModule, NumberAxisModule, ScrollbarModule, UnitTimeAxisModule, ZoomModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Museum Visitors',
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'Tate Modern',
            stroke: '#c16068',
            marker: { enabled: false },
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'Tate Britain',
            stroke: '#a2bf8a',
            marker: { enabled: false },
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            interval: { maxSpacing: 200 },
        },
        y: {
            type: 'number',
            label: {
                formatter: (params) => params.value / 1000 + 'k',
            },
        },
    },
    zoom: {
        enabled: true,
    },
    initialState: { zoom: { rangeX: { start: 0, end: 0.4 } } },
    scrollbar: {
        enabled: true,
        thickness: 16,
        track: {
            fill: '#e0e0e0',
            stroke: '#bdbdbd',
            strokeWidth: 1,
            cornerRadius: 8,
        },
        thumb: {
            fill: '#666666',
            stroke: '#444444',
            strokeWidth: 1,
            cornerRadius: 8,
        },
    },
};

const chart = AgCharts.create(options);
