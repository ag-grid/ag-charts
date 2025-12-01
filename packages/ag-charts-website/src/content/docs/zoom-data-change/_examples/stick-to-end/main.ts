import type { AgCartesianChartOptions } from 'ag-charts-enterprise';
import { AgCharts } from 'ag-charts-enterprise';

import { getData, getNextDataPoint } from './data';

let data = getData();
let streamingInterval: ReturnType<typeof setInterval> | null = null;
let stickToEnd = true;

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Stick to End',
    },
    subtitle: {
        text: 'Pan to the end of data, then new data stays in view',
    },
    data,
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'price',
            marker: { enabled: true, size: 4 },
        },
    ],
    axes: {
        x: {
            type: 'time',
        },
        y: {
            type: 'number',
            title: { text: 'Price' },
        },
    },
    zoom: {
        enabled: true,
        onDataChange: {
            strategy: 'preserveDomain',
            stickToEnd: true,
        },
    },
    navigator: {
        enabled: true,
        miniChart: {
            enabled: true,
        },
    },
};

const chart = AgCharts.create(options);

function setStickToEnd(value: boolean) {
    stickToEnd = value;
    options.zoom!.onDataChange = {
        ...options.zoom!.onDataChange,
        stickToEnd,
    };
    chart.update(options);
}

function startStreaming() {
    if (streamingInterval) return;

    streamingInterval = setInterval(() => {
        const nextPoint = getNextDataPoint(data);
        data = [...data, nextPoint];
        options.data = data;
        chart.update(options);
    }, 1000);
}

function stopStreaming() {
    if (streamingInterval) {
        clearInterval(streamingInterval);
        streamingInterval = null;
    }
}

function resetData() {
    stopStreaming();
    data = getData();
    options.data = data;
    chart.update(options);
}
