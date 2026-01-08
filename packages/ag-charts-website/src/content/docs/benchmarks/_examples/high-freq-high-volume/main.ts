/* @ag-options-extract */
import { type AgChartOptions, AgCharts } from 'ag-charts-community';

(window as any).agChartsDebug = ['scene:stats'];

type Datum = {
    timestamp: number;
    value: number;
};

const INITIAL_POINTS = 100_000;
let BATCH_SIZE = 100;
const UPDATE_INTERVAL_MS = 200;
const DATA_INTERVAL_MS = 250;
const START_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0);

function generateDatum(index: number): Datum {
    const timestamp = START_TIMESTAMP + index * DATA_INTERVAL_MS;
    const trend = Math.sin(index / 240) * 40 + Math.cos(index / 80) * 25;
    const volatility = Math.sin(index / 15) * 5;
    const baseline = 1_000 + index * 0.02;
    return {
        timestamp,
        value: Number((baseline + trend + volatility).toFixed(2)),
    };
}

function createSeedData(count: number): Datum[] {
    const result: Datum[] = [];
    for (let i = 0; i < count; i++) {
        result.push(generateDatum(i));
    }
    return result;
}

let data: Datum[] = createSeedData(INITIAL_POINTS);
let nextIndex = data.length;

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    axes: {
        x: {
            type: 'time',
            nice: false,
            label: {
                format: '%H:%M:%S',
            },
        },
        y: {
            type: 'number',
            title: {
                text: 'Value',
            },
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'timestamp',
            yKey: 'value',
            marker: { enabled: false },
            strokeWidth: 1,
        },
    ],
    legend: { enabled: false },
};
/* @ag-options-end */

const chart = AgCharts.create(options);

let currentUpdateMethod: 'applyTransaction' | 'updateDelta' = 'applyTransaction';
let isRunning = false;
let intervalId: ReturnType<typeof setInterval> | undefined;
let updateInFlight = false;
let cpuUsageHistory: number[] = [];
let methodSelect: HTMLSelectElement | null = null;

function createBatch(count: number): Datum[] {
    const batch: Datum[] = [];
    for (let i = 0; i < count; i++) {
        batch.push(generateDatum(nextIndex++));
    }
    return batch;
}

function updateDataCountDisplay() {
    const element = document.getElementById('dataCount');
    if (element) {
        element.textContent = `Points: ${data.length.toLocaleString()}`;
    }
}

function resetCpuIndicator() {
    cpuUsageHistory = [];
    const cpuElement = document.getElementById('cpuUsage');
    if (cpuElement) {
        const label = currentUpdateMethod === 'applyTransaction' ? 'CPU (incremental):' : 'CPU (full):';
        cpuElement.textContent = `${label} 0%`;
        cpuElement.style.color = '';
    }
}

function recordCpuUsage(elapsedMs: number) {
    const cpuUsage = (elapsedMs / UPDATE_INTERVAL_MS) * 100;
    cpuUsageHistory.push(cpuUsage);
    if (cpuUsageHistory.length > 100) {
        cpuUsageHistory.shift();
    }

    const averageCpu = cpuUsageHistory.reduce((sum, value) => sum + value, 0) / cpuUsageHistory.length;
    const cpuElement = document.getElementById('cpuUsage');
    if (!cpuElement) return;

    const label = currentUpdateMethod === 'applyTransaction' ? 'CPU (incremental):' : 'CPU (full):';
    cpuElement.textContent = `${label} ${averageCpu.toFixed(1)}%`;

    if (averageCpu < 30) {
        cpuElement.style.color = 'green';
    } else if (averageCpu < 60) {
        cpuElement.style.color = 'orange';
    } else {
        cpuElement.style.color = 'red';
    }
}

async function dispatchUpdate({ append = [], remove = [] }: { append?: Datum[]; remove?: Datum[] }) {
    const start = performance.now();

    if (currentUpdateMethod === 'applyTransaction') {
        await (chart as any).applyTransaction({
            append: append.length ? append : undefined,
            remove: remove.length ? remove : undefined,
        });
    } else {
        await chart.updateDelta({ data });
    }

    await chart.waitForUpdate();

    const elapsed = performance.now() - start;
    recordCpuUsage(elapsed);
}

async function addPoints(count: number) {
    const append = createBatch(count);
    data = data.concat(append);
    await dispatchUpdate({ append });
    updateDataCountDisplay();
}

async function removePoints(count: number) {
    if (data.length <= count) {
        return;
    }
    const remove = data.slice(0, count);
    data = data.slice(count);
    await dispatchUpdate({ remove });
    updateDataCountDisplay();
}

async function rollBatch() {
    if (data.length <= BATCH_SIZE) {
        return;
    }
    const remove = data.slice(0, BATCH_SIZE);
    const append = createBatch(BATCH_SIZE);
    data = data.slice(BATCH_SIZE).concat(append);
    await dispatchUpdate({ append, remove });
    updateDataCountDisplay();
}

async function runAutoUpdate() {
    if (updateInFlight) {
        return;
    }

    updateInFlight = true;
    try {
        // Maintain a rolling window by appending and removing batch-sized chunks.
        const remove = data.slice(0, BATCH_SIZE);
        const append = createBatch(BATCH_SIZE);
        data = data.slice(BATCH_SIZE).concat(append);
        await dispatchUpdate({ append, remove });
        updateDataCountDisplay();
    } finally {
        updateInFlight = false;
    }
}

function startUpdates() {
    if (isRunning) {
        return;
    }
    intervalId = setInterval(() => {
        void runAutoUpdate();
    }, UPDATE_INTERVAL_MS);
    isRunning = true;
    const button = document.getElementById('toggleBtn');
    if (button) {
        button.textContent = 'Stop Updates';
    }
}

function stopUpdates() {
    if (intervalId != null) {
        clearInterval(intervalId);
        intervalId = undefined;
    }

    isRunning = false;
    const button = document.getElementById('toggleBtn');
    if (button) {
        button.textContent = 'Start Updates';
    }
}

function handleToggleUpdates() {
    if (isRunning) {
        stopUpdates();
    } else {
        startUpdates();
    }
}

function setUpdateMethod(method: string) {
    if (method === currentUpdateMethod) {
        return;
    }
    currentUpdateMethod = method as 'applyTransaction' | 'updateDelta';

    if (methodSelect && methodSelect.value !== currentUpdateMethod) {
        methodSelect.value = currentUpdateMethod;
    }

    resetCpuIndicator();
}

function updateButtonLabels() {
    const rollBtn = document.getElementById('rollBtn');

    if (rollBtn) {
        rollBtn.textContent = `Roll ${BATCH_SIZE.toLocaleString()}`;
    }
}

function setBatchSize(size: number) {
    BATCH_SIZE = size;
    updateButtonLabels();
}

resetCpuIndicator();
updateDataCountDisplay();
updateButtonLabels();

methodSelect = document.getElementById('methodSelect') as HTMLSelectElement | null;
if (methodSelect) {
    methodSelect.value = currentUpdateMethod;
}

(window as any).toggleUpdates = () => {
    handleToggleUpdates();
};
(window as any).updateMethod = (method: string) => {
    setUpdateMethod(method);
};
(window as any).updateBatchSize = (size: string) => {
    setBatchSize(parseInt(size, 10));
};
(window as any).rollBatch = rollBatch;
