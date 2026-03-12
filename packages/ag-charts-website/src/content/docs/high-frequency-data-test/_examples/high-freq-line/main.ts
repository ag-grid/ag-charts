import { type AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

(window as any).agChartsDebug = ['scene:stats'];
// (window as any).agChartsDebug = ['scene:stats', 'data-model', 'data-ref'];

const STREAM_INTERVAL_MS = 10;
const DATA_INTERVAL_MS = 250;
const MAX_POINTS = 600;

type Datum = {
    id: number;
    timestamp: number;
    price: number;
    volume: number;
};

type MatchingMode = 'ref' | 'id';

const ALL_METHODS = [
    'applyTransaction-append',
    'applyTransaction-prepend',
    'applyTransaction-remove-first',
    'applyTransaction-remove-last',
    'updateDelta-append',
    'updateDelta-prepend',
    'updateDelta-remove-first',
    'updateDelta-remove-last',
];

interface FormConfig {
    matchingMode?: MatchingMode;
    method?: string;
}

const DEFAULT_CONFIG: Required<FormConfig> = {
    matchingMode: 'ref',
    method: 'applyTransaction-append',
};

let config: FormConfig = { ...DEFAULT_CONFIG };

function loadConfig(): FormConfig {
    const loaded: FormConfig = {};
    try {
        const hash = window.location.hash.slice(1);
        if (hash) {
            const params = new URLSearchParams(hash);

            const matchingMode = params.get('matchingMode');
            if (matchingMode === 'ref' || matchingMode === 'id') {
                loaded.matchingMode = matchingMode;
            }

            const method = params.get('method');
            if (method && ALL_METHODS.includes(method)) {
                loaded.method = method;
            }
        }
    } catch {
        // Ignore parsing errors
    }

    return { ...DEFAULT_CONFIG, ...loaded };
}

function saveConfig(newConfig: FormConfig) {
    try {
        if (window.parent === window) {
            const params = new URLSearchParams();

            if (newConfig.matchingMode && newConfig.matchingMode !== DEFAULT_CONFIG.matchingMode) {
                params.set('matchingMode', newConfig.matchingMode);
            }
            if (newConfig.method && newConfig.method !== DEFAULT_CONFIG.method) {
                params.set('method', newConfig.method);
            }

            const newHash = params.toString();
            history.replaceState(null, '', newHash ? `#${newHash}` : window.location.pathname);
        }
    } catch {
        // Ignore hash update errors
    }
}

function setConfigValue<K extends keyof FormConfig>(key: K, value: FormConfig[K]) {
    config[key] = value;
    saveConfig(config);
}

let nextId = 0;
let matchingMode: MatchingMode;

function createLiveDatumFactory(getData: () => Datum[], mode = 'append') {
    return () => {
        const currentData = getData();

        // Get timestamp based on current data state
        let timestamp: number;
        let index: number;

        if (mode === 'append') {
            const lastDatum = currentData.at(-1);
            timestamp = lastDatum ? lastDatum.timestamp + DATA_INTERVAL_MS : START_TIMESTAMP;
            // Calculate index for append based on timestamp
            index = Math.floor((timestamp - START_TIMESTAMP) / DATA_INTERVAL_MS);
        } else {
            const firstDatum = currentData.at(0);
            timestamp = firstDatum ? firstDatum.timestamp - DATA_INTERVAL_MS : START_TIMESTAMP;
            // Calculate index for prepend based on timestamp
            index = Math.floor((timestamp - START_TIMESTAMP) / DATA_INTERVAL_MS);
        }

        // Calculate price using the deterministic formula based on index
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

            // Yield to the main thread to prevent blocking
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
    }

    stop() {
        if (!this.running) return;

        this.running = false;
    }
}

// Load config first
config = loadConfig();
matchingMode = config.matchingMode ?? DEFAULT_CONFIG.matchingMode;

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
    dataIdKey: matchingMode === 'id' ? 'id' : undefined,
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

function setMatchingMode(mode: string) {
    const newMode = mode as MatchingMode;
    if (newMode === matchingMode) return;

    const wasRunning = feed.running;
    if (wasRunning) toggleFeed();

    matchingMode = newMode;
    setConfigValue('matchingMode', matchingMode);

    // Recreate chart data with or without dataIdKey
    nextId = 0;
    const newData = createSeedData();
    data = [...newData];
    chart.updateDelta({ data: newData, dataIdKey: matchingMode === 'id' ? 'id' : undefined });

    const matchingModeSelect = document.getElementById('matchingModeSelect') as HTMLSelectElement | null;
    if (matchingModeSelect && matchingModeSelect.value !== matchingMode) {
        matchingModeSelect.value = matchingMode;
    }

    if (wasRunning) toggleFeed();
}

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
    if (rapidFeed.running) {
        rapidFeed.stop();
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
    }
}

function tickFeed() {
    feed.tick();
}

let method = config.method ?? DEFAULT_CONFIG.method;
let cpuUsageHistory: number[] = [];
let updateCount = 0;
let updateCountStartTime = performance.now();
let updateRateHistory: number[] = [];

function use(newMethod: string) {
    method = newMethod;
    setConfigValue('method', method);
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
                if (matchingMode === 'id') {
                    chart.applyTransaction({ remove: [{ id: removed.id } as any] });
                } else {
                    chart.applyTransaction({ remove: [removed] });
                }
                break;
            }
            case 'applyTransaction-remove-last': {
                const removed = data.pop()!;
                if (matchingMode === 'id') {
                    chart.applyTransaction({ remove: [{ id: removed.id } as any] });
                } else {
                    chart.applyTransaction({ remove: [removed] });
                }
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

// Initialize form controls from config
const methodSelect = document.getElementById('methodSelect') as HTMLSelectElement | null;
if (methodSelect) {
    methodSelect.value = method;
}

const matchingModeSelectInit = document.getElementById('matchingModeSelect') as HTMLSelectElement | null;
if (matchingModeSelectInit) {
    matchingModeSelectInit.value = matchingMode;
}

// Listen for hash changes
window.addEventListener('hashchange', () => {
    const newConfig = loadConfig();

    const newMatchingMode = newConfig.matchingMode ?? DEFAULT_CONFIG.matchingMode;
    if (newMatchingMode !== matchingMode) {
        setMatchingMode(newMatchingMode);
    }

    const newMethod = newConfig.method ?? DEFAULT_CONFIG.method;
    if (newMethod !== method) {
        method = newMethod;
        if (methodSelect && methodSelect.value !== method) {
            methodSelect.value = method;
        }
    }

    config = newConfig;
});
