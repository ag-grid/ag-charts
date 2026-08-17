import {
    AgCartesianChartOptions,
    AgCharts,
    AgSeriesAreaBackgroundRegion,
    BackgroundRegionsModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BackgroundRegionsModule, LineSeriesModule, NumberAxisModule, UnitTimeAxisModule]);

const bounds: Record<string, AgSeriesAreaBackgroundRegion> = {
    closed: {
        xRange: { start: new Date(2025, 5, 1), end: new Date(2025, 8, 1) },
        yRange: { start: 20, end: 50 },
    },
    open: {
        xRange: { start: new Date(2025, 5, 1) },
        yRange: { end: 50 },
    },
    full: {
        yRange: { end: 50 },
    },
};

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Reservoir Level',
    },
    seriesArea: {
        backgroundRegions: [
            {
                ...bounds.closed,
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

function setBounds(mode: string) {
    const region = options.seriesArea!.backgroundRegions![0];

    region.xRange = bounds[mode].xRange;
    region.yRange = bounds[mode].yRange;

    chart.update(options);
}
