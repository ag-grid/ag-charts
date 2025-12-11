import { AgCharts, AgFinancialChartOptions, FinancialChartModule, ModuleRegistry } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([FinancialChartModule]);

(window as any).agChartsDebug = ['scene:stats'];

const INITIAL_POINTS = 100_000;
let BATCH_SIZE = 100;
let UPDATE_INTERVAL_MS = 200;
let UPDATE_FREQUENCY_MODE: 'raf' | number = 200;
const DATA_INTERVAL_MS = 250;
const START_DATE = new Date(Date.UTC(2024, 0, 1, 0, 0, 0));

// Unified form configuration
interface FormConfig {
    updatesRunning?: boolean;
    frequency?: string;
}

const DEFAULT_CONFIG: Required<FormConfig> = {
    updatesRunning: false,
    frequency: '200',
};

let config: FormConfig = { ...DEFAULT_CONFIG };

function loadConfig(): FormConfig {
    const loaded: FormConfig = {};
    try {
        const hash = window.location.hash.slice(1);
        if (hash) {
            const params = new URLSearchParams(hash);

            const updatesRunning = params.get('updatesRunning');
            if (updatesRunning === 'true') {
                loaded.updatesRunning = true;
            } else if (updatesRunning === 'false') {
                loaded.updatesRunning = false;
            }

            const frequency = params.get('frequency');
            if (frequency && (frequency === 'raf' || ['50', '100', '200', '500', '1000'].includes(frequency))) {
                loaded.frequency = frequency;
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

            // Only persist non-default values
            if (newConfig.updatesRunning !== undefined && newConfig.updatesRunning !== DEFAULT_CONFIG.updatesRunning) {
                params.set('updatesRunning', String(newConfig.updatesRunning));
            }
            if (newConfig.frequency && newConfig.frequency !== DEFAULT_CONFIG.frequency) {
                params.set('frequency', newConfig.frequency);
            }

            const newHash = params.toString();
            history.replaceState(null, '', newHash ? `#${newHash}` : window.location.pathname);
        }
    } catch {
        // Ignore hash update errors
    }
}

function getConfigValue<K extends keyof FormConfig>(key: K): FormConfig[K] {
    return config[key] ?? DEFAULT_CONFIG[key];
}

function setConfigValue<K extends keyof FormConfig>(key: K, value: FormConfig[K]) {
    config[key] = value;
    saveConfig(config);
}

type OhlcDatum = {
    date: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

function generateOhlcDatum(index: number, previousClose?: number): { datum: OhlcDatum; basePrice: number } {
    const date = START_DATE.getTime() + index * DATA_INTERVAL_MS;

    const trend = Math.sin(index / 240) * 40 + Math.cos(index / 80) * 25;
    const volatility = Math.sin(index / 15) * 5;
    const baseline = 1_000 + index * 0.02;
    const midPrice = baseline + trend + volatility;

    const open = previousClose ?? midPrice;
    const closeOffset = Math.sin(index / 7) * 2 + Math.cos(index / 11) * 1.5;
    const close = Number((midPrice + closeOffset).toFixed(2));

    const range = 2 + Math.abs(Math.sin(index / 13)) * 3;
    const high = Number((Math.max(open, close) + range).toFixed(2));
    const low = Number((Math.min(open, close) - range).toFixed(2));

    return {
        datum: {
            date,
            open: Number(open.toFixed(2)),
            high,
            low,
            close,
            volume: 600 + Math.round((Math.sin(index / 8) + 1) * 220),
        },
        basePrice: close,
    };
}

function createSeedData(count: number): { data: OhlcDatum[]; lastBasePrice: number } {
    const result: OhlcDatum[] = [];
    let basePrice: number | undefined = undefined;

    for (let i = 0; i < count; i++) {
        const { datum, basePrice: newBasePrice } = generateOhlcDatum(i, basePrice);
        result.push(datum);
        basePrice = newBasePrice;
    }
    return { data: result, lastBasePrice: basePrice! };
}

const seedResult = createSeedData(INITIAL_POINTS);
let data: OhlcDatum[] = seedResult.data;
let nextIndex = data.length;
let lastBasePrice: number = seedResult.lastBasePrice;

// Load config first
config = loadConfig();

// Initialize frequency from config
const persistedFrequency = getConfigValue('frequency') as string;
if (persistedFrequency === 'raf') {
    UPDATE_FREQUENCY_MODE = 'raf';
} else {
    const intervalMs = parseInt(persistedFrequency, 10);
    if (!isNaN(intervalMs) && intervalMs > 0) {
        UPDATE_FREQUENCY_MODE = intervalMs;
        UPDATE_INTERVAL_MS = intervalMs;
    }
}

/* @ag-options-extract */
const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data,
    title: { text: 'High Volume Financial Chart (100k points)' },
    dateKey: 'date',
    openKey: 'open',
    highKey: 'high',
    lowKey: 'low',
    closeKey: 'close',
    volumeKey: 'volume',
    volume: true,
    navigator: false,
    rangeButtons: false,
    statusBar: true,
    toolbar: false,
    zoom: true,
};
/* @ag-options-end */

const chart = AgCharts.createFinancialChart(options);

let currentUpdateMethod: 'applyTransaction' | 'updateDelta' = 'applyTransaction';
let isRunning = false;
let intervalId: ReturnType<typeof setInterval> | undefined;
let rafId: number | undefined;
let cpuUsageHistory: number[] = [];
let fpsHistory: number[] = [];
let lastFrameTime: number | undefined;

function createBatch(count: number): OhlcDatum[] {
    const batch: OhlcDatum[] = [];
    for (let i = 0; i < count; i++) {
        const { datum, basePrice: newBasePrice } = generateOhlcDatum(nextIndex++, lastBasePrice);
        batch.push(datum);
        lastBasePrice = newBasePrice;
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

function resetFpsCounter() {
    fpsHistory = [];
    lastFrameTime = undefined;
    const fpsElement = document.getElementById('fpsCounter');
    if (fpsElement) {
        fpsElement.textContent = 'FPS: 0';
        fpsElement.style.color = '';
    }
}

function recordFps() {
    const now = performance.now();

    if (lastFrameTime !== undefined) {
        const frameTime = now - lastFrameTime;
        const fps = 1000 / frameTime;
        fpsHistory.push(fps);

        if (fpsHistory.length > 60) {
            fpsHistory.shift();
        }

        const averageFps = fpsHistory.reduce((sum, value) => sum + value, 0) / fpsHistory.length;
        const fpsElement = document.getElementById('fpsCounter');
        if (fpsElement) {
            fpsElement.textContent = `FPS: ${averageFps.toFixed(1)}`;

            if (UPDATE_FREQUENCY_MODE === 'raf') {
                if (averageFps >= 55) {
                    fpsElement.style.color = 'green';
                } else if (averageFps >= 30) {
                    fpsElement.style.color = 'orange';
                } else {
                    fpsElement.style.color = 'red';
                }
            } else {
                const expectedFps = 1000 / UPDATE_INTERVAL_MS;
                const tolerance = expectedFps * 0.1;
                if (averageFps >= expectedFps - tolerance) {
                    fpsElement.style.color = 'green';
                } else if (averageFps >= expectedFps * 0.7) {
                    fpsElement.style.color = 'orange';
                } else {
                    fpsElement.style.color = 'red';
                }
            }
        }
    }

    lastFrameTime = now;
}

function recordCpuUsage(elapsedMs: number) {
    const baselineMs = UPDATE_FREQUENCY_MODE === 'raf' ? 16.67 : UPDATE_INTERVAL_MS;
    const cpuUsage = (elapsedMs / baselineMs) * 100;
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

async function dispatchUpdate({ append = [], remove = [] }: { append?: OhlcDatum[]; remove?: OhlcDatum[] }) {
    const start = performance.now();

    if (currentUpdateMethod === 'applyTransaction') {
        await (chart as any).applyTransaction({
            add: append.length ? append : undefined,
            remove: remove.length ? remove : undefined,
        });
    } else {
        await chart.updateDelta({ data });
    }

    await chart.waitForUpdate();

    const elapsed = performance.now() - start;
    recordCpuUsage(elapsed);
}

async function rollBatch() {
    const append = createBatch(BATCH_SIZE);
    const remove = data.slice(0, BATCH_SIZE);
    data = data.slice(BATCH_SIZE).concat(append);
    await dispatchUpdate({ append, remove });
    updateDataCountDisplay();
    recordFps();
}

function toggleUpdates() {
    const button = document.getElementById('toggleBtn');
    if (isRunning) {
        stopUpdates();
        if (button) button.textContent = 'Start Updates';
    } else {
        startUpdates();
        if (button) button.textContent = 'Stop Updates';
    }
}

function startUpdates() {
    if (isRunning) return;
    isRunning = true;
    setConfigValue('updatesRunning', true);
    resetCpuIndicator();
    resetFpsCounter();

    if (UPDATE_FREQUENCY_MODE === 'raf') {
        const runFrame = async () => {
            if (!isRunning) return;
            await rollBatch();
            rafId = requestAnimationFrame(runFrame);
        };
        rafId = requestAnimationFrame(runFrame);
    } else {
        intervalId = setInterval(rollBatch, UPDATE_INTERVAL_MS);
    }
}

function stopUpdates() {
    isRunning = false;
    setConfigValue('updatesRunning', false);
    if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
    }
    if (rafId !== undefined) {
        cancelAnimationFrame(rafId);
        rafId = undefined;
    }
}

function updateBatchSize(value: string) {
    BATCH_SIZE = parseInt(value, 10);
}

function updateMethod(value: string) {
    currentUpdateMethod = value as 'applyTransaction' | 'updateDelta';
    resetCpuIndicator();
}

function updateFrequency(value: string) {
    const wasRunning = isRunning;
    if (wasRunning) {
        stopUpdates();
    }

    if (value === 'raf') {
        UPDATE_FREQUENCY_MODE = 'raf';
    } else {
        const intervalMs = parseInt(value, 10);
        UPDATE_FREQUENCY_MODE = intervalMs;
        UPDATE_INTERVAL_MS = intervalMs;
    }

    setConfigValue('frequency', value);

    if (wasRunning) {
        startUpdates();
    }
}

// Initialize UI
updateDataCountDisplay();

// Initialize form controls with config values
const methodSelect = document.getElementById('methodSelect') as HTMLSelectElement | null;
if (methodSelect) {
    methodSelect.value = currentUpdateMethod;
}

const frequencySelect = document.getElementById('frequencySelect') as HTMLSelectElement | null;
if (frequencySelect) {
    frequencySelect.value = persistedFrequency;
}

// Start updates AFTER config has been loaded and controls initialized
if (getConfigValue('updatesRunning')) {
    startUpdates();
}

// Listen for hash changes (e.g., when switching to full-screen mode)
window.addEventListener('hashchange', () => {
    const newConfig = loadConfig();

    const newUpdatesRunning = newConfig.updatesRunning ?? DEFAULT_CONFIG.updatesRunning;
    if (newUpdatesRunning !== isRunning) {
        if (newUpdatesRunning) {
            startUpdates();
        } else {
            stopUpdates();
        }
    }

    const newFrequency = (newConfig.frequency ?? DEFAULT_CONFIG.frequency) as string;
    const currentFrequency = typeof UPDATE_FREQUENCY_MODE === 'string' ? 'raf' : String(UPDATE_FREQUENCY_MODE);
    if (newFrequency !== currentFrequency) {
        updateFrequency(newFrequency);
    }

    // Update config object
    config = newConfig;
});

(window as any).toggleUpdates = toggleUpdates;
(window as any).rollBatch = rollBatch;
(window as any).updateBatchSize = updateBatchSize;
(window as any).updateMethod = updateMethod;
(window as any).updateFrequency = updateFrequency;

export {};
