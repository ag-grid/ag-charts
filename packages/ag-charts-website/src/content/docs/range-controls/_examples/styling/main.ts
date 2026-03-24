import {
    AgChartOptions,
    AgCharts,
    LineSeriesModule,
    ModuleRegistry,
    NavigatorModule,
    NumberAxisModule,
    RangesModule,
    UnitTimeAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    LineSeriesModule,
    NumberAxisModule,
    UnitTimeAxisModule,
    RangesModule,
    ZoomModule,
    NavigatorModule,
]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'value',
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            label: {
                autoRotate: false,
            },
        },
        y: {
            type: 'number',
        },
    },
    zoom: { enabled: true },
    navigator: { enabled: true },
    ranges: {
        enabled: true,
        fill: '#6366f1',
        cornerRadius: 8,
        textColor: '#ffffff',
        stroke: '#4f46e5',
        strokeWidth: 2,
        active: {
            fill: '#16a34a',
            textColor: '#ffffff',
            stroke: '#15803d',
        },
        hover: {
            fill: '#ea580c',
            textColor: '#ffffff',
            stroke: '#c2410c',
        },
        disabled: {
            fill: '#e5e7eb',
            textColor: '#9ca3af',
            stroke: '#d1d5db',
        },
        button: {
            padding: { top: 6, right: 12, bottom: 6, left: 12 },
        },
        gap: 4,
    },
};

const chart = AgCharts.create(options);
