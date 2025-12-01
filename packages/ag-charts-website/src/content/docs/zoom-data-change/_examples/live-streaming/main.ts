import type { AgCartesianChartOptions, AgZoomOnDataChangeStrategy } from 'ag-charts-enterprise';
import { AgCharts } from 'ag-charts-enterprise';

import { getData, getNextDataPoint } from './data';

let data = getData();
let streamingInterval: ReturnType<typeof setInterval> | null = null;

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Live Streaming Data',
    },
    subtitle: {
        text: 'Data updates every second',
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

function setStrategy(strategy: AgZoomOnDataChangeStrategy) {
    options.zoom!.onDataChange = { strategy };
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
