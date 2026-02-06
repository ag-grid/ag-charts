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
        placement: 'inner',
        thickness: 8,
        spacing: 8,
        track: {
            fillOpacity: 0,
            strokeWidth: 0,
        },
        thumb: {
            fill: '#6b7280',
            strokeWidth: 0,
            cornerRadius: 8,
            hoverStyle: {
                fill: '#374151',
            },
        },
    },
};

const chart = AgCharts.create(options);
