import {
    AgCartesianChartOptions,
    AgCharts,
    BackgroundRegionsModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BackgroundRegionsModule, LineSeriesModule, NumberAxisModule, UnitTimeAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Reservoir Level',
    },
    seriesArea: {
        backgroundRegions: [
            {
                xRange: { start: new Date(2025, 5, 1), end: new Date(2025, 8, 1) },
                yRange: { start: 0, end: 50 },
                label: {
                    text: 'Drought Risk',
                },
            },
        ],
    },
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'level',
            yName: 'Level',
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
        },
        y: {
            type: 'number',
            title: {
                text: 'Capacity (%)',
            },
        },
    },
};

const chart = AgCharts.create(options);
