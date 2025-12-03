// @ag-skip-fws
import { type AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

// Configuration
let refreshRateInMilliseconds = 50;
const millisecondsOfData = 60 * 1000; // 1 minute of data
const START_TIMESTAMP = Date.UTC(2024, 0, 1, 12, 0, 0);

// Enable scene stats for performance monitoring
(window as any).agChartsDebug = ['scene:stats'];

interface DataPoint {
    time: number;
    series1: number;
    series2: number;
    series3: number;
    series4: number;
}

// Initialize data first
let currentData: DataPoint[] = [];

// Data generation function (moved up)
function getData(inputData: DataPoint[] = []): [DataPoint[], DataPoint[], DataPoint[]] {
    const data = [...inputData];
    const dataCount = millisecondsOfData / refreshRateInMilliseconds;
    const added: DataPoint[] = [];
    const removed: DataPoint[] = [];

    if (data.length === 0) {
        // Initialize with full history
        let timestamp = START_TIMESTAMP - millisecondsOfData;
        for (let i = 0; i < dataCount; i++) {
            timestamp += refreshRateInMilliseconds;
            data.push({
                time: timestamp,
                series1: 10 + Math.random() * 20,
                series2: 15 + Math.random() * 25,
                series3: 20 + Math.random() * 30,
                series4: 25 + Math.random() * 35,
            });
        }
        added.push(...data);
    } else {
        // Update data: remove oldest, add newest
        removed.push(data.shift()!);
        const lastTime = data[data.length - 1].time;
        data.push({
            time: lastTime + refreshRateInMilliseconds,
            series1: 10 + Math.random() * 20,
            series2: 15 + Math.random() * 25,
            series3: 20 + Math.random() * 30,
            series4: 25 + Math.random() * 35,
        });
        added.push(data.at(-1)!);
    }

    return [data, added, removed];
}

// Initialize data
[currentData] = getData();

// Chart options with stacked line configuration
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'High-Frequency Stacked Line Chart',
    },
    subtitle: {
        text: 'Comparing updateDelta vs applyTransaction with incremental grouping',
    },
    data: currentData,
    animation: { enabled: false },
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'series1',
            yName: 'Series 1',
            stacked: true,
            strokeWidth: 2,
            marker: {
                enabled: false,
            },
        },
        {
            type: 'line',
            xKey: 'time',
            yKey: 'series2',
            yName: 'Series 2',
            stacked: true,
            strokeWidth: 2,
            marker: {
                enabled: false,
            },
        },
        {
            type: 'line',
            xKey: 'time',
            yKey: 'series3',
            yName: 'Series 3',
            stacked: true,
            strokeWidth: 2,
            marker: {
                enabled: false,
            },
        },
        {
            type: 'line',
            xKey: 'time',
            yKey: 'series4',
            yName: 'Series 4',
            stacked: true,
            strokeWidth: 2,
            marker: {
                enabled: false,
            },
        },
    ],
    axes: {
        x: {
            type: 'time',
            position: 'bottom',
            nice: false,
            label: {
                format: '%H:%M:%S',
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Stacked Value',
            },
        },
    },
    legend: {
        position: 'bottom',
    },
};

let chart: any; // Declare chart variable first
chart = AgCharts.create(options); // Create the chart

// Update control variables
let intervalId: NodeJS.Timeout | undefined;
let isRunning = false;
let currentUpdateMethod = 'updateDelta';
let cpuUsageHistory: number[] = [];

// Update methods
async function updateMethod(method: string) {
    currentUpdateMethod = method;
    console.log('Update method changed to:', method);

    // Clear CPU history when switching methods to get fresh measurements
    cpuUsageHistory = [];
    const cpuElement = document.getElementById('cpuUsage');
    if (cpuElement) {
        cpuElement.textContent = `CPU: 0%`;
    }
}

function updateRate(value: string) {
    refreshRateInMilliseconds = parseInt(value);
    const rateElement = document.getElementById('updateRate');
    if (rateElement) {
        rateElement.textContent = `Updates: ${value}ms`;
    }

    // Restart updates if running
    if (isRunning) {
        stopUpdates();
        startUpdates();
    }
}

async function updateChartData() {
    const startTime = performance.now();

    try {
        const [updatedData, appended, removed] = getData(currentData);
        currentData = updatedData;

        if (currentUpdateMethod === 'applyTransaction') {
            await (chart as any).applyTransaction({
                remove: removed,
                append: appended,
            });
        } else {
            await chart.updateDelta({ data: currentData });
        }

        await chart.waitForUpdate();
    } catch (error) {
        console.error('Update error:', error);
    }

    const endTime = performance.now();
    const elapsedTime = endTime - startTime;

    // Calculate CPU usage as percentage of refresh interval
    const cpuUsage = (elapsedTime / refreshRateInMilliseconds) * 100;

    // Keep a rolling average of last 100 samples
    cpuUsageHistory.push(cpuUsage);
    if (cpuUsageHistory.length > 100) {
        cpuUsageHistory.shift();
    }

    const avgCpuUsage = cpuUsageHistory.reduce((a, b) => a + b, 0) / cpuUsageHistory.length;

    // Update the display
    const cpuElement = document.getElementById('cpuUsage');
    if (cpuElement) {
        const methodLabel = currentUpdateMethod === 'applyTransaction' ? 'CPU (incremental):' : 'CPU (full):';
        cpuElement.textContent = `${methodLabel} ${avgCpuUsage.toFixed(1)}%`;

        // Color code based on usage
        if (avgCpuUsage < 30) {
            cpuElement.style.color = 'green';
        } else if (avgCpuUsage < 60) {
            cpuElement.style.color = 'orange';
        } else {
            cpuElement.style.color = 'red';
        }
    }
}

function startUpdates() {
    if (!isRunning) {
        intervalId = setInterval(updateChartData, refreshRateInMilliseconds);
        isRunning = true;
        const button = document.getElementById('toggleBtn');
        if (button) button.textContent = 'Stop Updates';
        console.log(`Started ${currentUpdateMethod} updates every ${refreshRateInMilliseconds}ms`);
    }
}

function stopUpdates() {
    if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
    }
    isRunning = false;
    const button = document.getElementById('toggleBtn');
    if (button) button.textContent = 'Start Updates';
    console.log('Stopped updates');
}

function toggleUpdates() {
    if (isRunning) {
        stopUpdates();
    } else {
        startUpdates();
    }
}

// Make functions globally accessible for HTML event handlers
(window as any).toggleUpdates = toggleUpdates;
(window as any).updateMethod = updateMethod;
(window as any).updateRate = updateRate;

// Display initial state
const rateElement = document.getElementById('updateRate');
if (rateElement) {
    rateElement.textContent = `Updates: ${refreshRateInMilliseconds}ms`;
}
