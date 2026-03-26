import { type AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

(window as any).agChartsDebug = ['scene:stats'];
// (window as any).agChartsDebug = ['scene:stats', 'data-model', 'data-ref'];

const STREAM_INTERVAL_MS = 10;

// Simple LCG pseudo-random number generator for repeatable randomness
function createSeededRandom(seed: number) {
    let state = seed;
    return () => {
        state = (state * 1664525 + 1013904223) % 2 ** 32;
        return state / 2 ** 32;
    };
}

function createLiveDatumFactory(getData: () => any[], mode = 'append') {
    return () => {
        const currentData = getData();

        // Get index based on current data state
        let index: number;

        if (mode === 'append') {
            const lastDatum = currentData.at(-1);
            index = lastDatum ? lastDatum.index + 1 : 0;
        } else {
            const firstDatum = currentData.at(0);
            index = firstDatum ? firstDatum.index - 1 : 0;
        }

        // Create seeded random for this specific index
        const random = createSeededRandom(index * 12345 + 67890);

        // Generate pseudo-random value with a normal-like distribution
        // Using sum of multiple random values to approximate normal distribution (Central Limit Theorem)
        let value = 0;
        for (let i = 0; i < 6; i++) {
            value += random();
        }
        // Scale and shift to center around 100 with some variation
        value = 70 + value * 10;

        const datum = {
            index,
            value: Number(value.toFixed(2)),
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

            // Yield to the main thread to prevent blocking
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
    }

    stop() {
        if (!this.running) return;

        this.running = false;
    }
}

/* @ag-options-extract */
function createSeedData(count = 7200) {
    const data: { index: number; value: number }[] = [];

    for (let i = 0; i < count; i++) {
        // Create seeded random for this specific index
        const random = createSeededRandom(i * 12345 + 67890);

        // Generate pseudo-random value with a normal-like distribution
        let value = 0;
        for (let j = 0; j < 6; j++) {
            value += random();
        }
        value = 70 + value * 10;

        data.push({
            index: i,
            value: Number(value.toFixed(2)),
        });
    }

    return data;
}

const initialData = createSeedData();
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: initialData,
    animation: { enabled: false },
    legend: { enabled: false },
    series: [
        {
            type: 'histogram',
            xKey: 'value',
            xName: 'Measurement',
            binCount: 50,
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
        // Stop rapid feed if running
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
        // Stop regular feed if running
        if (feed.running) {
            toggleFeed();
        }
        // Reset update tracking for rapid feed
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
            case 'applyTransaction-remove-first':
                const removedFirst = data.shift();
                if (removedFirst) {
                    chart.applyTransaction({ remove: [removedFirst] });
                }
                break;
            case 'applyTransaction-remove-last':
                const removedLast = data.pop();
                if (removedLast) {
                    chart.applyTransaction({ remove: [removedLast] });
                }
                break;
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

    // Wait for chart update to complete
    await chart.waitForUpdate();

    const endTime = performance.now();
    const elapsedTime = endTime - startTime;

    // Update stats display
    const statsElement = document.getElementById('cpuUsage');
    if (statsElement) {
        if (rapidFeed.running) {
            // Show updates per second for rapid feed
            const currentTime = performance.now();
            const timeDiff = currentTime - updateCountStartTime;

            // Calculate updates/sec every 100ms
            if (timeDiff >= 100) {
                const updateRate = (updateCount / timeDiff) * 1000;
                updateRateHistory.push(updateRate);
                if (updateRateHistory.length > 10) {
                    updateRateHistory.shift();
                }
                const avgUpdateRate = updateRateHistory.reduce((a, b) => a + b, 0) / updateRateHistory.length;
                statsElement.textContent = `Updates/sec: ${avgUpdateRate.toFixed(0)}`;

                // Reset counters periodically
                if (timeDiff > 1000) {
                    updateCount = 0;
                    updateCountStartTime = currentTime;
                }
            }
        } else if (feed.running) {
            // Show CPU usage for regular feed
            const effectiveInterval = STREAM_INTERVAL_MS;
            const cpuUsage = (elapsedTime / effectiveInterval) * 100;

            // Keep a rolling average of last 100 samples
            cpuUsageHistory.push(cpuUsage);
            if (cpuUsageHistory.length > 100) {
                cpuUsageHistory.shift();
            }

            const avgCpuUsage = cpuUsageHistory.reduce((a, b) => a + b, 0) / cpuUsageHistory.length;
            statsElement.textContent = `CPU: ${avgCpuUsage.toFixed(1)}%`;
        } else {
            // Default display when feeds are stopped
            statsElement.textContent = `CPU: 0%`;
        }
    }
};

const feed = new RealTimeDataFeed(updateCallback);
const rapidFeed = new RapidDataFeed(updateCallback);
