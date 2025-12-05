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

import { getData, getNextDataPoint } from './data';

ModuleRegistry.registerModules([LineSeriesModule, NavigatorModule, NumberAxisModule, TimeAxisModule, ZoomModule]);

let data = getData();
let streamingInterval: ReturnType<typeof setInterval> | null = null;

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data,
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
            strategy: 'preserveRatios',
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
            ratioX: { start: 0.8, end: 1 },
        },
    },
};

const chart = AgCharts.create(options);

function startUpdates() {
    if (streamingInterval) return;

    streamingInterval = setInterval(() => {
        const newPoints = [];
        for (let i = 0; i < 10; i++) {
            const nextPoint = getNextDataPoint(data);
            data.push(nextPoint);
            newPoints.push(nextPoint);
        }
        chart.applyTransaction({ add: newPoints });
    }, 200);
}

function stopUpdates() {
    if (streamingInterval) {
        clearInterval(streamingInterval);
        streamingInterval = null;
    }
}

function resetData() {
    stopUpdates();
    data = getData();
    options.data = data;
    chart.update(options);
}
