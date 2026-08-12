import {
    AgCartesianChartOptions,
    AgCharts,
    BackgroundRegionsModule,
    BarSeriesModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    BackgroundRegionsModule,
    BarSeriesModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    UnitTimeAxisModule,
]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Reservoir Level and Rainfall',
    },
    seriesArea: {
        backgroundRegions: [
            {
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
