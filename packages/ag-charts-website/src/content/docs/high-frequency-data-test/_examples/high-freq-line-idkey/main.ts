import { type AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

(window as any).agChartsDebug = ['scene:stats'];

const STREAM_INTERVAL_MS = 10;
const DATA_INTERVAL_MS = 250;
const MAX_POINTS = 600;

type Datum = {
    id: number;
    timestamp: number;
    price: number;
    volume: number;
};

let nextId = 0;

function createLiveDatumFactory(getData: () => Datum[], mode = 'append') {
    return () => {
        const currentData = getData();

        let timestamp: number;
        let index: number;

        if (mode === 'append') {
            const lastDatum = currentData.at(-1);
            timestamp = lastDatum ? lastDatum.timestamp + DATA_INTERVAL_MS : START_TIMESTAMP;
            index = Math.floor((timestamp - START_TIMESTAMP) / DATA_INTERVAL_MS);
        } else {
            const firstDatum = currentData.at(0);
            timestamp = firstDatum ? firstDatum.timestamp - DATA_INTERVAL_MS : START_TIMESTAMP;
            index = Math.floor((timestamp - START_TIMESTAMP) / DATA_INTERVAL_MS);
        }

        let price = 100;
        for (let i = 0; i <= index; i++) {
            const drift = Math.sin(i / 12) * 0.7 + Math.cos(i / 24) * 0.4;
            price = Number((price + drift).toFixed(2));
        }

        const datum: Datum = {
            id: nextId++,
            timestamp,
            price,
            volume: 600 + Math.round((Math.sin(index / 8) + 1) * 220),
        };
        return datum;
    };
}

class RealTimeDataFeed {
    timerId: NodeJS.Timeout | undefined;
    running = false;
    callback: () => Promise<void>;

    constructor(callback: () => Promise<void>) {
        this.callback = callback;
    }

    start() {
        if (this.running) return;

        this.running = true;

        this.timerId = setInterval(() => this.enqueueUpdate(), STREAM_INTERVAL_MS);
    }

    tick() {
        return this.callback();
    }

    stop() {
        if (!this.running) return;

        this.running = false;
        if (this.timerId != null) {
            clearInterval(this.timerId);
            this.timerId = undefined;
        }
    }

    async enqueueUpdate() {
        if (!this.running) return;

        await this.callback();
    }
}

class RapidDataFeed {
    running = false;
    callback: () => Promise<void>;

    constructor(callback: () => Promise<void>) {
        this.callback = callback;
    }

    start() {
        if (this.running) return;

        this.running = true;
        this.runLoop();
    }

    async runLoop() {
        while (this.running) {
            await this.callback();
            await chart.waitForUpdate();

            await new Promise((resolve) => setTimeout(resolve, 0));
        }
    }

    stop() {
        if (!this.running) return;

        this.running = false;
    }
}

/* @ag-options-extract */
const START_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0);
function createSeedData(count = 30 * 60 * (1000 / DATA_INTERVAL_MS)): Datum[] {
    const data: Datum[] = [];
    let price = 100;
    let timestamp = START_TIMESTAMP;

    for (let i = 0; i < count; i++) {
        const drift = Math.sin(i / 12) * 0.7 + Math.cos(i / 24) * 0.4;
        price = Number((price + drift).toFixed(2));
        data.push({
            id: nextId++,
            timestamp,
            price,
            volume: 600 + Math.round((Math.sin(i / 8) + 1) * 220),
        });
        timestamp += DATA_INTERVAL_MS;
    }

    return data;
}

const initialData = createSeedData();
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    dataIdKey: 'id',
    data: initialData,
    animation: { enabled: false },
    legend: { enabled: false },
    axes: {
        x: {
            type: 'time',
            label: { format: '%H:%M:%S' },
        },
        y: {
            type: 'number',
            label: {
                formatter: (params) => `$${params.value.toFixed(2)}`,
            },
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'timestamp',
            yKey: 'price',
            strokeWidth: 2,
            marker: { enabled: false },
        },
    ],
};
/* @ag-options-end */

const chart = AgCharts.create(options);
let data = [...initialData];
const appendDatumFactory = createLiveDatumFactory(() => data, 'append');
const prependDatumFactory = createLiveDatumFactory(() => data, 'prepend');

function toggleFeed() {
    const button = document.getElementById('toggleFeedBtn');
    if (feed.running) {
        feed.stop();
        if (button) button.textContent = 'Start Feed';
    } else {
        if (rapidFeed.running) {
            toggleRapidFeed();
        }
        feed.start();
        if (button) button.textContent = 'Stop Feed';
    }
}

function toggleRapidFeed() {
    const button = document.getElementById('toggleRapidFeedBtn');
    if (rapidFeed.running) {
        rapidFeed.stop();
        if (button) button.textContent = 'Start Rapid Feed';
    } else {
        if (feed.running) {
            toggleFeed();
        }
        updateCount = 0;
        updateCountStartTime = performance.now();
        updateRateHistory = [];
        rapidFeed.start();
        if (button) button.textContent = 'Stop Rapid Feed';
    }
}

function tickFeed() {
    feed.tick();
}

let method = 'applyTransaction-append';
let cpuUsageHistory: number[] = [];
let updateCount = 0;
let updateCountStartTime = performance.now();
let updateRateHistory: number[] = [];

function use(newMethod: string) {
    method = newMethod;
    console.log(method);
}

const updateCallback = async () => {
    const startTime = performance.now();
    updateCount++;
    const isPrepend = method.includes('prepend');
    const isRemove = method.includes('remove');

    if (isRemove) {
        if (data.length === 0) {
            console.warn('No data to remove');
            return;
        }

        switch (method) {
            case 'applyTransaction-remove-first': {
                const removed = data.shift()!;
                // Use partial object with only the ID field
                chart.applyTransaction({ remove: [{ id: removed.id } as any] });
                break;
            }
            case 'applyTransaction-remove-last': {
                const removed = data.pop()!;
                // Use partial object with only the ID field
                chart.applyTransaction({ remove: [{ id: removed.id } as any] });
                break;
            }
            case 'updateDelta-remove-first':
                data.shift();
                chart.updateDelta({ data });
                break;
            case 'updateDelta-remove-last':
                data.pop();
                chart.updateDelta({ data });
                break;
        }
    } else {
        const datumFactory = isPrepend ? prependDatumFactory : appendDatumFactory;
        const newDatum = datumFactory();

        switch (method) {
            case 'applyTransaction-append':
                data = data.concat(newDatum);
                chart.applyTransaction({ add: [newDatum] });
                break;
            case 'applyTransaction-prepend':
                data = [newDatum].concat(data);
                chart.applyTransaction({ add: [newDatum], addIndex: 0 });
                break;
            case 'updateDelta-append':
                data = data.concat(newDatum);
                chart.updateDelta({ data });
                break;
            case 'updateDelta-prepend':
                data = [newDatum].concat(data);
                chart.updateDelta({ data });
                break;
        }
    }

    await chart.waitForUpdate();

    const endTime = performance.now();
    const elapsedTime = endTime - startTime;

    const statsElement = document.getElementById('cpuUsage');
    if (statsElement) {
        if (rapidFeed.running) {
            const currentTime = performance.now();
            const timeDiff = currentTime - updateCountStartTime;

            if (timeDiff >= 100) {
                const updateRate = (updateCount / timeDiff) * 1000;
                updateRateHistory.push(updateRate);
                if (updateRateHistory.length > 10) {
                    updateRateHistory.shift();
                }
                const avgUpdateRate = updateRateHistory.reduce((a, b) => a + b, 0) / updateRateHistory.length;
                statsElement.textContent = `Updates/sec: ${avgUpdateRate.toFixed(0)}`;

                if (timeDiff > 1000) {
                    updateCount = 0;
                    updateCountStartTime = currentTime;
                }
            }
        } else if (feed.running) {
            const effectiveInterval = STREAM_INTERVAL_MS;
            const cpuUsage = (elapsedTime / effectiveInterval) * 100;

            cpuUsageHistory.push(cpuUsage);
            if (cpuUsageHistory.length > 100) {
                cpuUsageHistory.shift();
            }

            const avgCpuUsage = cpuUsageHistory.reduce((a, b) => a + b, 0) / cpuUsageHistory.length;
            statsElement.textContent = `CPU: ${avgCpuUsage.toFixed(1)}%`;
        } else {
            statsElement.textContent = `CPU: 0%`;
        }
    }
};

const feed = new RealTimeDataFeed(updateCallback);
const rapidFeed = new RapidDataFeed(updateCallback);
