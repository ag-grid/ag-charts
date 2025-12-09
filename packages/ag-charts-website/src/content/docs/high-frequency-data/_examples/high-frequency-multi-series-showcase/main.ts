// @ag-skip-fws
import {
    AgCartesianChartOptions,
    AgChartInstance,
    AgCharts,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    RangeAreaSeriesModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { SensorDataGenerator, SensorDataPoint } from './data';

ModuleRegistry.registerModules([LegendModule, NumberAxisModule, RangeAreaSeriesModule, ZoomModule]);

const MAX_POINTS = 15000;
const POINTS_PER_UPDATE = 1;

const generator = new SensorDataGenerator();
let data: SensorDataPoint[] = generator.generateInitialData(MAX_POINTS);

// Industrial color palette
const COLORS = {
    torque: {
        fill: 'rgba(251, 146, 60, 0.5)', // Orange
        stroke: '#f97316',
    },
    temp: {
        fill: 'rgba(248, 113, 113, 0.5)', // Red/coral
        stroke: '#ef4444',
    },
    velocity: {
        fill: 'rgba(56, 189, 248, 0.5)', // Cyan/blue
        stroke: '#0ea5e9',
    },
};

const chartOptions: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'Manufacturing Sensor Monitor',
        fontSize: 16,
    },
    subtitle: {
        text: 'Real-time Torque, Temperature & Velocity',
        fontSize: 12,
    },
    zoom: {
        enabled: true,
        onDataChange: {
            strategy: 'preserveDomain',
            stickToEnd: true,
        },
    },
    legend: {
        enabled: true,
        position: 'bottom',
    },
    series: [
        {
            type: 'range-area',
            xKey: 'time',
            yLowKey: 'velocityLow',
            yHighKey: 'velocityHigh',
            yName: 'Velocity (rpm)',
            fill: COLORS.velocity.fill,
            stroke: COLORS.velocity.stroke,
            strokeWidth: 1,
            marker: { enabled: false },
            tooltip: { enabled: false },
        },
        {
            type: 'range-area',
            xKey: 'time',
            yLowKey: 'tempLow',
            yHighKey: 'tempHigh',
            yName: 'Temperature (°C)',
            fill: COLORS.temp.fill,
            stroke: COLORS.temp.stroke,
            strokeWidth: 1,
            marker: { enabled: false },
            tooltip: { enabled: false },
        },
        {
            type: 'range-area',
            xKey: 'time',
            yLowKey: 'torqueLow',
            yHighKey: 'torqueHigh',
            yName: 'Torque (Nm)',
            fill: COLORS.torque.fill,
            stroke: COLORS.torque.stroke,
            strokeWidth: 1,
            marker: { enabled: false },
            tooltip: { enabled: false },
        },
    ],
    axes: {
        x: {
            type: 'number',
            position: 'bottom',
            nice: false,
            title: { text: 'Time' },
            label: {
                formatter: ({ value }) => `${(value / 60).toFixed(1)}s`,
            },
            gridLine: { enabled: true, style: [{ stroke: 'rgba(0,0,0,0.1)' }] },
        },
        y: {
            type: 'number',
            position: 'left',
            min: 0,
            max: 100,
            title: { text: 'Sensor Values' },
            gridLine: { enabled: true, style: [{ stroke: 'rgba(0,0,0,0.1)' }] },
            interval: { step: 10 },
        },
    },
};

const chart: AgChartInstance = AgCharts.create(chartOptions);

let isRunning = false;
let animationFrameId: number | undefined;
let updateCount = 0;
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;
let pointsPerSec = 0;

function updateStats() {
    const statsElement = document.getElementById('stats');
    if (statsElement) {
        statsElement.innerHTML = `
            <span class="stat">Points: <strong>${data.length.toLocaleString()}</strong></span>
            <span class="stat">FPS: <strong>${fps}</strong></span>
            <span class="stat">Points/sec: <strong>${pointsPerSec.toLocaleString()}</strong></span>
            <span class="stat">Updates: <strong>${updateCount.toLocaleString()}</strong></span>
        `;
    }
}

function updateButton() {
    const button = document.getElementById('toggleButton');
    if (button) {
        button.textContent = isRunning ? 'Stop' : 'Start';
    }
}

function startUpdates() {
    if (isRunning) return;
    isRunning = true;
    updateButton();
    lastTime = performance.now();
    frameCount = 0;
    animationFrameId = requestAnimationFrame(updateChart);
}

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

(window as any).toggleUpdates = toggleUpdates;

function updateChart() {
    if (!isRunning) return;

    frameCount++;
    const currentTime = performance.now();
    if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        pointsPerSec = fps * POINTS_PER_UPDATE;
        frameCount = 0;
        lastTime = currentTime;
        updateStats();
    }

    const newPoints = generator.generateNextPoints(POINTS_PER_UPDATE);
    const pointsToRemove = data.slice(0, POINTS_PER_UPDATE);

    const transaction = {
        remove: pointsToRemove,
        add: newPoints,
    };

    chart.applyTransaction(transaction);

    data.splice(0, POINTS_PER_UPDATE);
    data.push(...newPoints);

    updateCount++;

    animationFrameId = requestAnimationFrame(updateChart);
}

updateStats();
