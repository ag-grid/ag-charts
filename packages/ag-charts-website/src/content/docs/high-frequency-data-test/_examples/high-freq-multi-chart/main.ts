// @ag-skip-fws
// @ag-skip-container-check
import { type AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

const chartCount = 10;
const refreshRateInMilliseconds = 50;
const millisecondsOfData = 30 * 1000;
const START_TIMESTAMP = Date.UTC(2024, 0, 1, 12, 0, 0);

(window as any).agChartsDebug = ['scene:stats'];

interface DataPoint {
    time: number;
    system: number;
    user: number;
}

const commonConfig = {
    animation: { enabled: false },
    sync: { axes: 'xy' },
    zoom: { enabled: true },
    legend: { enabled: false },
    padding: {
        top: 5,
        right: 5,
        bottom: 5,
        left: 5,
    },
    theme: {
        palette: {
            fills: ['#ec4d3d', '#4facf2'],
            strokes: ['#ec4d3d', '#4facf2'],
        },
        overrides: {
            area: {
                title: {
                    fontSize: 10,
                    spacing: 5,
                },
                series: {
                    fillOpacity: 0.5,
                },
            },
        },
    },
    series: [
        {
            type: 'area' as const,
            xKey: 'time',
            yKey: 'system',
            stacked: true,
            yName: 'System',
        },
        {
            type: 'area' as const,
            xKey: 'time',
            yKey: 'user',
            stacked: true,
            yName: 'User',
        },
    ],
    axes: {
        x: {
            type: 'time' as const,
            nice: false,
            label: {
                enabled: false,
            },
            tick: {
                size: 3,
            },
        },
        y: {
            type: 'number' as const,
            title: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
            min: 0,
            max: 100,
            tick: {
                size: 3,
            },
        },
    },
};

function createChart(index: number): [AgChartOptions, any] {
    const options = {
        container: document.getElementById('myChart' + index),
        data: getData([], index),
        title: {
            text: 'Host ' + index,
        },
        ...commonConfig,
    } as AgChartOptions;

    return [options, AgCharts.create(options)];
}

function getData(inputData: DataPoint[] = [], hostIndex: number = 1): DataPoint[] {
    const data = [...inputData];
    const dataCount = millisecondsOfData / refreshRateInMilliseconds;

    if (data.length === 0) {
        // Initialize with full history
        let timestamp = START_TIMESTAMP - millisecondsOfData;
        for (let i = 0; i < dataCount; i++) {
            timestamp += refreshRateInMilliseconds;
            const baseSystem = 20 + hostIndex * 3;
            const baseUser = 15 + hostIndex * 2;
            data.push({
                time: timestamp,
                system: baseSystem + Math.random() * 30,
                user: baseUser + Math.random() * 30,
            });
        }
    } else {
        // Update data: remove oldest, add newest
        data.shift();
        const lastTime = data[data.length - 1].time;
        const baseSystem = 20 + hostIndex * 3;
        const baseUser = 15 + hostIndex * 2;
        data.push({
            time: lastTime + refreshRateInMilliseconds,
            system: baseSystem + Math.random() * 30,
            user: baseUser + Math.random() * 30,
        });
    }

    return data;
}

const charts: Array<[AgChartOptions, any, number]> = [];
let intervalId: NodeJS.Timeout | undefined;
let isRunning = false;
let currentUpdateMethod = 'updateDelta';
let cpuUsageHistory: number[] = [];

function updateMethod(method: string) {
    currentUpdateMethod = method;
    console.log('Update method changed to:', method);
}

// Make the function globally accessible for the HTML onclick handler
(window as any).updateMethod = updateMethod;

async function updateChartsData() {
    const startTime = performance.now();

    const updatePromises = charts.map(async ([opts, chart, hostIndex]) => {
        const oldData = opts.data as DataPoint[];
        opts.data = getData(oldData, hostIndex);

        if (currentUpdateMethod === 'applyTransaction') {
            // For applyTransaction, we need to identify what changed
            const removed = oldData.length > 0 ? [oldData.at(0)] : [];
            const added = opts.data.length > 0 ? [opts.data.at(-1)] : [];

            await (chart as any).applyTransaction({ remove: removed, append: added });
        } else {
            await chart.updateDelta({ data: opts.data });
        }

        await chart.waitForUpdate();
    });

    await Promise.all(updatePromises);

    const endTime = performance.now();
    const elapsedTime = endTime - startTime;

    // Calculate CPU usage as percentage of refresh interval
    const cpuUsage = (elapsedTime / refreshRateInMilliseconds) * 100;

    // Keep a rolling average of last 20 samples
    cpuUsageHistory.push(cpuUsage);
    if (cpuUsageHistory.length > 100) {
        cpuUsageHistory.shift();
    }

    const avgCpuUsage = cpuUsageHistory.reduce((a, b) => a + b, 0) / cpuUsageHistory.length;

    // Update the display
    const cpuElement = document.getElementById('cpuUsage');
    if (cpuElement) {
        cpuElement.textContent = `CPU: ${avgCpuUsage.toFixed(1)}%`;
    }
}

function toggleUpdates() {
    const button = document.getElementById('toggleBtn');
    if (isRunning) {
        if (intervalId !== undefined) {
            clearInterval(intervalId);
            intervalId = undefined;
        }
        isRunning = false;
        if (button) button.textContent = 'Start Updates';
        console.log('Stopped updates');
    } else {
        intervalId = setInterval(updateChartsData, refreshRateInMilliseconds);
        isRunning = true;
        if (button) button.textContent = 'Stop Updates';
        console.log(`Started updates every ${refreshRateInMilliseconds}ms`);
    }
}

// Make functions globally accessible for HTML event handlers
(window as any).toggleUpdates = toggleUpdates;

for (let i = 1; i <= chartCount; i++) {
    const [options, chart] = createChart(i);
    charts.push([options, chart, i]);
}
