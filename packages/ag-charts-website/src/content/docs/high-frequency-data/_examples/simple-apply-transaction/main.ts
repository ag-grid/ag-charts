import { AgChartInstance, AgChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { LineSeriesModule, ModuleRegistry, NumberAxisModule, TimeAxisModule } from 'ag-charts-community';

import { DataPoint, getData } from './data';

ModuleRegistry.registerModules([LegendModule, LineSeriesModule, NumberAxisModule, TimeAxisModule]);
const POINTS_PER_UPDATE = 10;

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
    axes: {
        x: {
            type: 'time',
            label: {
                format: '%H:%M:%S',
            },
            nice: false,
        },
        y: {
            type: 'number',
            label: {
                formatter: ({ value }) => value.toFixed(0),
            },
        },
    },
};

let chart: AgChartInstance;
let isRunning = false;
let animationFrameId: number | undefined;
let updateCount = 0;
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

/** inScope */
function updateChart() {
    if (!isRunning || !chart) return;

    // Calculate FPS
    frameCount++;
    const currentTime = performance.now();
    if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
        updateStats();
    }

    // Create new data points
    const newPoints: DataPoint[] = [];
    const lastPoint = data[data.length - 1];
    const baseTime = lastPoint.time;
    const baseValue = lastPoint.value;

    for (let i = 0; i < POINTS_PER_UPDATE; i++) {
        newPoints.push({
            time: baseTime + (i + 1) * 100,
            value: baseValue + (Math.random() - 0.5) * 5,
        });
    }

    // Remove old points from the start
    const pointsToRemove: DataPoint[] = data.slice(0, POINTS_PER_UPDATE);

    // Apply transaction for efficient update
    chart.applyTransaction({
        remove: pointsToRemove,
        add: newPoints,
    });

    // Update data array
    data.splice(0, POINTS_PER_UPDATE);
    data.push(...newPoints);

    updateCount++;

    // Continue animation loop
    animationFrameId = requestAnimationFrame(updateChart);
}

/** inScope */
function updateStats() {
    const statsElement = document.getElementById('stats');
    if (statsElement) {
        statsElement.textContent = `Updates: ${updateCount} | FPS: ${fps} | Points: ${data.length.toLocaleString()}`;
    }
}

/** inScope */
function startUpdates() {
    if (isRunning || !chart) return;
    isRunning = true;
    updateButton();
    lastTime = performance.now();
    frameCount = 0;
    animationFrameId = requestAnimationFrame(updateChart);
}

/** inScope */
function stopUpdates() {
    if (!isRunning) return;
    isRunning = false;
    updateButton();
    if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = undefined;
    }
}

function toggleUpdates() {
    if (isRunning) {
        stopUpdates();
    } else {
        startUpdates();
    }
}

/** inScope */
function updateButton() {
    const button = document.getElementById('toggleButton');
    if (button) {
        button.textContent = isRunning ? 'Stop Stream' : 'Start Stream';
    }
}

chart = AgCharts.create(options);
