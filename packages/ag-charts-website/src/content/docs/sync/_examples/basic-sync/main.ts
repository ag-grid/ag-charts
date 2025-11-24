import {
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    TimeAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { NavigatorModule, SyncModule, ZoomModule } from 'ag-charts-enterprise';

import { AAPL, MSFT } from './data';

ModuleRegistry.registerModules([
    LegendModule,
    LineSeriesModule,
    NavigatorModule,
    NumberAxisModule,
    SyncModule,
    TimeAxisModule,
    UnitTimeAxisModule,
    ZoomModule,
]);
const commonOptions: AgChartOptions = {
    minWidth: 0,
    minHeight: 0,
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'value',
        },
    ],
    sync: {
        enabled: true,
        axes: 'x',
        nodeInteraction: true,
    },
    zoom: {
        enabled: true,
        enableSelecting: true,
    },
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
            interval: {
                maxSpacing: 180,
            },
            crosshair: {
                label: {
                    format: '%d %b %Y',
                },
            },
        },
        y: {
            type: 'number',
            position: 'left',
            label: {
                format: '$~s',
            },
        },
    },
};

const chartOptions1: AgChartOptions = {
    ...commonOptions,
    container: document.getElementById('myChart1'),
    data: AAPL,
    title: {
        text: 'Apple (AAPL)',
        textAlign: 'left',
    },
};

AgCharts.create(chartOptions1);

const chartOptions2: AgChartOptions = {
    ...commonOptions,
    container: document.getElementById('myChart2'),
    data: MSFT,
    title: {
        text: 'Microsoft (MSFT)',
        textAlign: 'left',
    },
    navigator: {
        enabled: true,
    },
    initialState: {
        zoom: {
            ratioX: { start: 0.8, end: 1 },
        },
    },
};

AgCharts.create(chartOptions2);
