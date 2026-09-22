import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, LegendModule, LineSeriesModule, NumberAxisModule, UnitTimeAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Reservoir Capacity and Rainfall',
    },
    seriesArea: {
        backgroundRegions: [
            {
                xRange: { start: new Date(2025, 0, 1), end: new Date(2025, 4, 1) },
                yRange: { axis: 'rainfall', start: 100 },
                label: {
                    text: 'Heavy Rainfall',
                    position: 'inside-top-left',
                },
            },
        ],
    },
    series: [
        {
            type: 'bar',
            xKey: 'date',
            yKey: 'rainfall',
            yName: 'Rainfall',
            yKeyAxis: 'rainfall',
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'capacity',
            yName: 'Capacity',
            yKeyAxis: 'capacity',
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
        },
        capacity: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Capacity (%)',
            },
        },
        rainfall: {
            type: 'number',
            position: 'right',
            title: {
                text: 'Rainfall (mm)',
            },
        },
    },
};

const chart = AgCharts.create(options);
