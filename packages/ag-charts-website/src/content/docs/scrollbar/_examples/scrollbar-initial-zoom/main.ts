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
    subtitle: {
        text: 'Initial zoom positions the scrollbar on load',
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
            interval: { maxSpacing: 200 },
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
    },
    initialState: {
        zoom: {
            ratioX: { start: 0.15, end: 0.5 },
        },
    },
};

const chart = AgCharts.create(options);
