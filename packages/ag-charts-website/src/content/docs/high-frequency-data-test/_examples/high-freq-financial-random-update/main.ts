import { AgCharts, AgFinancialChartOptions, FinancialChartModule, ModuleRegistry } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([FinancialChartModule]);

(window as any).agChartsDebug = ['scene:stats'];

type OhlcDatum = {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

const INITIAL_POINTS = 100_000;
let UPDATE_COUNT = 100;
let UPDATE_INTERVAL_MS = 200;
let UPDATE_FREQUENCY_MODE: 'raf' | number = 200;
const DATA_INTERVAL_MS = 60_000; // 1-minute data for financial charts
const START_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0);

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


function generateOhlcDatum(index: number, previousClose?: number): OhlcDatum {
    const date = new Date(START_TIMESTAMP + index * DATA_INTERVAL_MS);

    const trend = Math.sin(index / 240) * 40 + Math.cos(index / 80) * 25;
    const volatility = Math.sin(index / 15) * 5;
    const baseline = 100 + index * 0.001;
    const midPrice = baseline + trend + volatility;

    const open = previousClose ?? midPrice;

    const closeOffset = Math.sin(index / 7) * 2 + Math.cos(index / 11) * 1.5;
    const close = Number((midPrice + closeOffset).toFixed(2));

    const range = 2 + Math.abs(Math.sin(index / 13)) * 3;
    const high = Number((Math.max(open, close) + range).toFixed(2));
    const low = Number((Math.min(open, close) - range).toFixed(2));

    const baseVolume = 1_000_000 + Math.sin(index / 100) * 500_000;
    const volumeVariation = Math.random() * 200_000;
    const volume = Math.floor(baseVolume + volumeVariation);

    return {
        date,
        open: Number(open.toFixed(2)),
        high,
        low,
        close,
        volume,
    };
}

function createSeedData(count: number): OhlcDatum[] {
    const result: OhlcDatum[] = [];
    let previousClose: number | undefined = undefined;

    for (let i = 0; i < count; i++) {
        const datum = generateOhlcDatum(i, previousClose);
        result.push(datum);
        previousClose = datum.close;
    }
    return result;
}

let data: OhlcDatum[] = createSeedData(INITIAL_POINTS);

function mutateDatum(item: OhlcDatum) {
    const change = (Math.random() - 0.5) * 20;
    item.open = Number((item.open + change).toFixed(2));
    item.close = Number((item.close + change).toFixed(2));
    item.high = Number((Math.max(item.open, item.close) + Math.random() * 5).toFixed(2));
    item.low = Number((Math.min(item.open, item.close) - Math.random() * 5).toFixed(2));
    item.volume = Math.max(100_000, Math.floor(item.volume + (Math.random() - 0.5) * 500_000));
}

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

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data,
    title: { text: 'Financial Chart - Random Updates (100K points)' },
    volume: true,
    navigator: false,
    rangeButtons: true,
    statusBar: true,
    toolbar: true,
    zoom: true,
};

const chart = AgCharts.createFinancialChart(options);

let currentUpdateMethod: 'applyTransaction' | 'updateDelta' = 'applyTransaction';
let isRunning = false;
let intervalId: ReturnType<typeof setInterval> | undefined;
let rafId: number | undefined;
let updateInFlight = false;
let cpuUsageHistory: number[] = [];
let fpsHistory: number[] = [];
let lastFrameTime: number | undefined;
let methodSelect: HTMLSelectElement | null = null;

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

function updateUpdateCountDisplay() {
    const element = document.getElementById('updateCountDisplay');
    if (element) {
        element.textContent = `Updates: ${UPDATE_COUNT.toLocaleString()}`;
    }
}

async function dispatchUpdate(itemsToUpdate: OhlcDatum[]) {
    const start = performance.now();

    if (currentUpdateMethod === 'applyTransaction') {
        await (chart as any).applyTransaction({
            update: itemsToUpdate,
        });
    } else {
        await chart.updateDelta({ data });
    }

    await chart.waitForUpdate();

    const elapsed = performance.now() - start;
    recordCpuUsage(elapsed);
}

async function updateRandomSubset() {
    const indicesToUpdate = new Set<number>();
    while (indicesToUpdate.size < UPDATE_COUNT && indicesToUpdate.size < data.length) {
        indicesToUpdate.add(Math.floor(Math.random() * data.length));
    }

    const itemsToUpdate: OhlcDatum[] = [];
    for (const idx of indicesToUpdate) {
        const item = data[idx];
        mutateDatum(item);
        itemsToUpdate.push(item);
    }

    await dispatchUpdate(itemsToUpdate);
}

async function runAutoUpdate() {
    if (updateInFlight) {
        return;
    }

    updateInFlight = true;
    try {
        recordFps();
        await updateRandomSubset();
    } finally {
        updateInFlight = false;
    }

    if (isRunning && UPDATE_FREQUENCY_MODE === 'raf') {
        rafId = requestAnimationFrame(() => {
            void runAutoUpdate();
        });
    }
}

function startUpdates() {
    if (isRunning) {
        return;
    }
    isRunning = true;
    setConfigValue('updatesRunning', true);
    const button = document.getElementById('toggleBtn');
    if (button) {
        button.textContent = 'Stop Updates';
    }

    if (UPDATE_FREQUENCY_MODE === 'raf') {
        rafId = requestAnimationFrame(() => {
            void runAutoUpdate();
        });
    } else {
        UPDATE_INTERVAL_MS = UPDATE_FREQUENCY_MODE;
        intervalId = setInterval(() => {
            void runAutoUpdate();
        }, UPDATE_INTERVAL_MS);
    }
}

function stopUpdates() {
    if (intervalId != null) {
        clearInterval(intervalId);
        intervalId = undefined;
    }
    if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = undefined;
    }

    isRunning = false;
    setConfigValue('updatesRunning', false);
    resetFpsCounter();
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

function setUpdateFrequency(frequency: string) {
    const wasRunning = isRunning;

    if (wasRunning) {
        stopUpdates();
    }

    if (frequency === 'raf') {
        UPDATE_FREQUENCY_MODE = 'raf';
    } else {
        const intervalMs = parseInt(frequency, 10);
        if (!isNaN(intervalMs) && intervalMs > 0) {
            UPDATE_FREQUENCY_MODE = intervalMs;
            UPDATE_INTERVAL_MS = intervalMs;
        }
    }

    setConfigValue('frequency', frequency);

    if (wasRunning) {
        startUpdates();
    }

    resetCpuIndicator();
    resetFpsCounter();
}

function setUpdateCount(count: number) {
    UPDATE_COUNT = count;
    updateUpdateCountDisplay();
}

resetCpuIndicator();
resetFpsCounter();
updateDataCountDisplay();
updateUpdateCountDisplay();

// Initialize form controls with config values
methodSelect = document.getElementById('methodSelect') as HTMLSelectElement | null;
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
        setUpdateFrequency(newFrequency);
    }
    
    // Update config object
    config = newConfig;
});

(window as any).toggleUpdates = () => {
    handleToggleUpdates();
};
(window as any).updateMethod = (method: string) => {
    setUpdateMethod(method);
};
(window as any).updateFrequency = (frequency: string) => {
    setUpdateFrequency(frequency);
};
(window as any).updateUpdateCount = (count: string) => {
    setUpdateCount(parseInt(count, 10));
};
(window as any).tickUpdate = () => {
    void updateRandomSubset();
};

export {};
