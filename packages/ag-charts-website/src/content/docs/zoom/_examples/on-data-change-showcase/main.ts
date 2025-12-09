import {
    AgCartesianChartOptions,
    AgCharts,
    AgZoomOnDataChangeStrategy,
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

let currentStrategy: AgZoomOnDataChangeStrategy = 'preserveDomain';
let currentStickToEnd = false;

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
            strategy: currentStrategy,
            stickToEnd: currentStickToEnd,
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
            ratioX: { start: 0.5, end: 1 },
        },
    },
};

const chart = AgCharts.create(options);

function updateButton() {
    const button = document.getElementById('toggleBtn');
    if (button) {
        button.textContent = streamingInterval ? 'Stop' : 'Start';
    }
}

function startUpdates() {
    if (streamingInterval) return;

    streamingInterval = setInterval(() => {
        const nextPoint = getNextDataPoint(data);
        data.push(nextPoint);
        chart.applyTransaction({ add: [nextPoint] });
    }, 100);
    updateButton();
}

function stopUpdates() {
    if (streamingInterval) {
        clearInterval(streamingInterval);
        streamingInterval = null;
    }
    updateButton();
}

function toggleUpdates() {
    if (streamingInterval) {
        stopUpdates();
    } else {
        startUpdates();
    }
}

function resetData() {
    stopUpdates();
    data = getData();
    options.data = data;
    chart.update(options);
}

function setStrategy(strategy: string) {
    currentStrategy = strategy as AgZoomOnDataChangeStrategy;
    options.zoom = {
        ...options.zoom,
        onDataChange: {
            strategy: currentStrategy,
            stickToEnd: currentStickToEnd,
        },
    };
    chart.update(options);
}

function setStickToEnd(enabled: boolean) {
    currentStickToEnd = enabled;
    options.zoom = {
        ...options.zoom,
        onDataChange: {
            strategy: currentStrategy,
            stickToEnd: currentStickToEnd,
        },
    };
    chart.update(options);
}
