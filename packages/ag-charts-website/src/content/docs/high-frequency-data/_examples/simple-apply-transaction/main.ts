import { AgChartInstance, AgChartOptions, AgCharts } from 'ag-charts-community';

import { DataPoint, getData } from './data';
import { StreamController, createUpdateSource } from './updateSource';

const data = getData();

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: data,
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            stroke: '#5090DC',
            strokeWidth: 1,
            marker: {
                enabled: false,
            },
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
            label: {
                format: '%H:%M:%S',
            },
            nice: false,
        },
        {
            type: 'number',
            position: 'left',
            label: {
                formatter: ({ value }) => value.toFixed(0),
            },
        },
    ],
};

let chart: AgChartInstance;
let stream: StreamController | undefined;
let toggleButtonElement: HTMLButtonElement | null = null;

/** inScope */
function updateButton(isRunning: boolean) {
    const button =
        toggleButtonElement ??
        (toggleButtonElement = document.getElementById('toggleButton') as HTMLButtonElement | null);
    if (button) {
        button.textContent = isRunning ? 'Stop Stream' : 'Start Stream';
    }
}

/** inScope */
function applyStreamUpdate(newPoints: DataPoint[]) {
    if (!chart) {
        return;
    }

    const pointsToRemove = data.slice(0, newPoints.length);

    chart.applyTransaction({
        remove: pointsToRemove,
        add: newPoints,
    });

    data.splice(0, newPoints.length);
    data.push(...newPoints);
}

/** inScope */
function startUpdates() {
    stream?.start();
}

/** inScope */
function stopUpdates() {
    stream?.stop();
}

/** inScope */
function toggleUpdates() {
    stream?.toggle();
}

chart = AgCharts.create(options);

toggleButtonElement = document.getElementById('toggleButton') as HTMLButtonElement | null;

stream = createUpdateSource({
    data,
    onUpdate: applyStreamUpdate,
    onRunningChange: updateButton,
    statsTarget: 'stats',
});

updateButton(false);
