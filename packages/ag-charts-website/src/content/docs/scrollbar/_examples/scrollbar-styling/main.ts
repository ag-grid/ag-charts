import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    ScrollbarModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, NumberAxisModule, OrdinalTimeAxisModule, ScrollbarModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Museum Visitors',
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'date',
            yKey: 'Tate Modern',
            yName: 'Tate Modern',
            width: 12,
        },
        {
            type: 'bar',
            xKey: 'date',
            yKey: 'Tate Britain',
            yName: 'Tate Britain',
            width: 12,
        },
    ],
    axes: {
        x: {
            type: 'ordinal-time',
            position: 'bottom',
        },
        y: {
            type: 'number',
            label: {
                formatter: (params) => `${params.value / 1000}k`,
            },
        },
    },
    scrollbar: {
        enabled: true,
        thickness: 12,
        track: {
            fill: '#e2e8f0',
            cornerRadius: 0,
            strokeWidth: 0,
        },
        thumb: {
            fill: '#3b82f6',
            cornerRadius: 0,
            strokeWidth: 1,
            stroke: '#2563eb',
            hoverStyle: {
                fill: '#2563eb',
            },
        },
    },
};

const chart = AgCharts.create(options);
