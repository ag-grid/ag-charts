import {
    AgCartesianChartOptions,
    AgCharts,
    LineSeriesModule,
    ModuleRegistry,
    NavigatorModule,
    NumberAxisModule,
    TimeAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { getDatasetA, getDatasetB } from './data';

ModuleRegistry.registerModules([LineSeriesModule, NavigatorModule, NumberAxisModule, TimeAxisModule, ZoomModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getDatasetA(),
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'price',
            marker: { enabled: false },
        },
    ],
    axes: {
        x: {
            type: 'time',
            nice: false,
        },
        y: {
            type: 'number',
            title: { text: 'Price' },
        },
    },
    zoom: {
        enabled: true,
        onDataChange: {
            strategy: 'reset',
        },
    },
    navigator: {
        enabled: true,
        miniChart: {
            enabled: true,
        },
    },
    initialState: {
        zoom: {
            ratioX: { start: 0.9, end: 1 },
        },
    },
};

const chart = AgCharts.create(options);

function loadDatasetA() {
    options.data = getDatasetA();
    chart.update(options);
}

function loadDatasetB() {
    options.data = getDatasetB();
    chart.update(options);
}
