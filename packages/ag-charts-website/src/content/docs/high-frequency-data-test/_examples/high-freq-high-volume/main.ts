// @ag-skip-fws
import { type AgCartesianChartOptions, type AgCartesianSeriesOptions, AgCharts, VERSION } from 'ag-charts-enterprise';
import { BenchmarkRunner, type BenchmarkConfig, type BenchmarkCallbacks } from './benchmark';

(window as any).agChartsDebug = ['scene:stats'];

type ValueDatum = {
    timestamp: number;
    value: number;
};

type OhlcDatum = {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
};

type RangeDatum = {
    timestamp: number;
    low: number;
    high: number;
};

type BubbleDatum = {
    timestamp: number;
    value: number;
    size: number;
};

type Datum = ValueDatum | OhlcDatum | RangeDatum | BubbleDatum;
type SeriesType = 'line' | 'area' | 'bar' | 'bubble' | 'ohlc' | 'candlestick' | 'range-bar' | 'range-area';
type AxisType = 'time' | 'ordinal-time' | 'unit-time';

const ALL_SERIES_TYPES: SeriesType[] = [
    'line',
    'area',
    'bar',
    'bubble',
    'ohlc',
    'candlestick',
    'range-bar',
    'range-area',
];
const ALL_AXIS_TYPES: AxisType[] = ['time', 'ordinal-time', 'unit-time'];

// Version utilities
function parseVersion(versionString: string): [number, number, number] {
    // Parse "13.0.0" or "12.2.1-beta.1" into [13, 0, 0]
    const parts = versionString.split('-')[0].split('.');
    const major = parseInt(parts[0] || '0', 10);
    const minor = parseInt(parts[1] || '0', 10);
    const patch = parseInt(parts[2] || '0', 10);
    return [major, minor, patch];
}

function isVersionAtOrAfter(major: number, minor: number, patch: number): boolean {
    const [currentMajor, currentMinor, currentPatch] = parseVersion(VERSION);
    
    if (currentMajor > major) return true;
    if (currentMajor < major) return false;
    if (currentMinor > minor) return true;
    if (currentMinor < minor) return false;
    return currentPatch >= patch;
}

function isVersionBefore(major: number, minor: number, patch: number): boolean {
    return !isVersionAtOrAfter(major, minor, patch);
}

const SUPPORTS_APPLY_TRANSACTION = isVersionAtOrAfter(12, 3, 0);
const SUPPORTS_AXES_DICT = isVersionAtOrAfter(13, 0, 0);

const INITIAL_POINTS = 100_000;
let BATCH_SIZE = 100;
let UPDATE_INTERVAL_MS = 200;
let UPDATE_FREQUENCY_MODE: 'raf' | number = 200;
const DATA_INTERVAL_MS = 250;
const START_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0);

// Unified form configuration
interface FormConfig {
    seriesType?: SeriesType;
    updatesRunning?: boolean;
    frequency?: string;
    axisType?: AxisType;
}

const DEFAULT_CONFIG: Required<FormConfig> = {
    seriesType: 'line',
    updatesRunning: false,
    frequency: '200',
    axisType: 'time',
};

let config: FormConfig = { ...DEFAULT_CONFIG };

function loadConfig(): FormConfig {
    const loaded: FormConfig = {};
    try {
        const hash = window.location.hash.slice(1);
        if (hash) {
            const params = new URLSearchParams(hash);
            
            const seriesType = params.get('seriesType');
            if (seriesType && ALL_SERIES_TYPES.includes(seriesType as SeriesType)) {
                loaded.seriesType = seriesType as SeriesType;
            }
            
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
            
            const axisType = params.get('axisType');
            if (axisType && ALL_AXIS_TYPES.includes(axisType as AxisType)) {
                loaded.axisType = axisType as AxisType;
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
            if (newConfig.seriesType && newConfig.seriesType !== DEFAULT_CONFIG.seriesType) {
                params.set('seriesType', newConfig.seriesType);
            }
            if (newConfig.updatesRunning !== undefined && newConfig.updatesRunning !== DEFAULT_CONFIG.updatesRunning) {
                params.set('updatesRunning', String(newConfig.updatesRunning));
            }
            if (newConfig.frequency && newConfig.frequency !== DEFAULT_CONFIG.frequency) {
                params.set('frequency', newConfig.frequency);
            }
            if (newConfig.axisType && newConfig.axisType !== DEFAULT_CONFIG.axisType) {
                params.set('axisType', newConfig.axisType);
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

let currentSeriesType: SeriesType;
let currentAxisType: AxisType;

function generateValueDatum(index: number): ValueDatum {
    const timestamp = START_TIMESTAMP + index * DATA_INTERVAL_MS;
    const trend = Math.sin(index / 240) * 40 + Math.cos(index / 80) * 25;
    const volatility = Math.sin(index / 15) * 5;
    const baseline = 1_000 + index * 0.02;
    return {
        timestamp,
        value: Number((baseline + trend + volatility).toFixed(2)),
    };
}

function generateOhlcDatum(index: number, previousClose?: number): { datum: OhlcDatum; basePrice: number } {
    const timestamp = START_TIMESTAMP + index * DATA_INTERVAL_MS;

    // Use same baseline calculation as other series types for consistency
    const trend = Math.sin(index / 240) * 40 + Math.cos(index / 80) * 25;
    const volatility = Math.sin(index / 15) * 5;
    const baseline = 1_000 + index * 0.02;
    const midPrice = baseline + trend + volatility;

    // Open is previous close (or midPrice for first datum)
    const open = previousClose ?? midPrice;

    // Close varies around midPrice
    const closeOffset = Math.sin(index / 7) * 2 + Math.cos(index / 11) * 1.5;
    const close = Number((midPrice + closeOffset).toFixed(2));

    // High and low extend beyond open/close by a small random amount
    const range = 2 + Math.abs(Math.sin(index / 13)) * 3;
    const high = Number((Math.max(open, close) + range).toFixed(2));
    const low = Number((Math.min(open, close) - range).toFixed(2));

    return {
        datum: {
            timestamp,
            open: Number(open.toFixed(2)),
            high,
            low,
            close,
        },
        basePrice: close, // Pass close as next open
    };
}

function generateRangeDatum(index: number): RangeDatum {
    const timestamp = START_TIMESTAMP + index * DATA_INTERVAL_MS;
    const trend = Math.sin(index / 240) * 40 + Math.cos(index / 80) * 25;
    const volatility = Math.sin(index / 15) * 5;
    const baseline = 1_000 + index * 0.02;
    const midValue = baseline + trend + volatility;
    const range = 10 + Math.abs(Math.sin(index / 30)) * 20;
    return {
        timestamp,
        low: Number((midValue - range / 2).toFixed(2)),
        high: Number((midValue + range / 2).toFixed(2)),
    };
}

function generateBubbleDatum(index: number): BubbleDatum {
    const timestamp = START_TIMESTAMP + index * DATA_INTERVAL_MS;
    const trend = Math.sin(index / 240) * 40 + Math.cos(index / 80) * 25;
    const volatility = Math.sin(index / 15) * 5;
    const baseline = 1_000 + index * 0.02;
    return {
        timestamp,
        value: Number((baseline + trend + volatility).toFixed(2)),
        size: 5 + Math.abs(Math.sin(index / 50)) * 20,
    };
}

function createSeedData(
    count: number,
    seriesType: SeriesType = currentSeriesType
): { data: Datum[]; lastBasePrice?: number } {
    const result: Datum[] = [];
    let basePrice: number | undefined = undefined;

    for (let i = 0; i < count; i++) {
        if (seriesType === 'ohlc' || seriesType === 'candlestick') {
            const { datum, basePrice: newBasePrice } = generateOhlcDatum(i, basePrice);
            result.push(datum);
            basePrice = newBasePrice;
        } else if (seriesType === 'range-bar' || seriesType === 'range-area') {
            result.push(generateRangeDatum(i));
        } else if (seriesType === 'bubble') {
            result.push(generateBubbleDatum(i));
        } else {
            result.push(generateValueDatum(i));
        }
    }
    return { data: result, lastBasePrice: basePrice };
}

const seedResult = createSeedData(INITIAL_POINTS);
let data: Datum[] = seedResult.data;
let nextIndex = data.length;
// Track last base price for OHLC generation to maintain O(n) complexity
let lastBasePrice: number | undefined = seedResult.lastBasePrice;

function createSeriesConfig(seriesType: SeriesType): AgCartesianSeriesOptions[] {
    switch (seriesType) {
        case 'ohlc':
        case 'candlestick':
            return [
                {
                    type: seriesType,
                    xKey: 'timestamp',
                    openKey: 'open',
                    highKey: 'high',
                    lowKey: 'low',
                    closeKey: 'close',
                },
            ];
        case 'line':
            return [
                {
                    type: 'line',
                    xKey: 'timestamp',
                    yKey: 'value',
                    marker: { enabled: false },
                    strokeWidth: 1,
                },
            ];
        case 'area':
            return [
                {
                    type: 'area',
                    xKey: 'timestamp',
                    yKey: 'value',
                    marker: { enabled: false },
                    strokeWidth: 1,
                },
            ];
        case 'bar':
            return [
                {
                    type: 'bar',
                    xKey: 'timestamp',
                    yKey: 'value',
                },
            ];
        case 'bubble':
            return [
                {
                    type: 'bubble',
                    xKey: 'timestamp',
                    yKey: 'value',
                    sizeKey: 'size',
                },
            ];
        case 'range-bar':
            return [
                {
                    type: 'range-bar',
                    xKey: 'timestamp',
                    yLowKey: 'low',
                    yHighKey: 'high',
                },
            ];
        case 'range-area':
            return [
                {
                    type: 'range-area',
                    xKey: 'timestamp',
                    yLowKey: 'low',
                    yHighKey: 'high',
                },
            ];
    }
}

function createAxesConfig(axisType: AxisType) {
    return {
        x: {
            type: axisType,
            position: 'bottom' as const,
            ...(axisType === 'time' || axisType === 'unit-time' ? { nice: false } : {}),
            label: {
                format: '%H:%M:%S',
            },
        },
        y: {
            type: 'number' as const,
            position: 'left' as const,
            title: {
                text: 'Value',
            },
        },
    };
}

function createAxesConfigCompat(axisType: AxisType) {
    const axesDict = createAxesConfig(axisType);
    
    if (SUPPORTS_AXES_DICT) {
        // Version >= 13: return dictionary format
        return axesDict;
    } else {
        // Version < 13: return array format
        return [
            axesDict.x,
            axesDict.y,
        ];
    }
}

// Load config first
config = loadConfig();
currentSeriesType = getConfigValue('seriesType') as SeriesType;
currentAxisType = getConfigValue('axisType') as AxisType;

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

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data,
    animation: { enabled: false },
    zoom: { enabled: true },
    axes: createAxesConfigCompat(currentAxisType) as any,
    series: createSeriesConfig(currentSeriesType),
    legend: { enabled: false },
};

const chart = AgCharts.create(options);

let currentUpdateMethod: 'applyTransaction' | 'updateDelta' = 'applyTransaction';
let isRunning = false;
let intervalId: ReturnType<typeof setInterval> | undefined;
let rafId: number | undefined;
let updateInFlight = false;
let cpuUsageHistory: number[] = [];
let fpsHistory: number[] = [];
let lastFrameTime: number | undefined;
let methodSelect: HTMLSelectElement | null = null;
let seriesTypeUpdateInProgress = false;

function createBatch(count: number): Datum[] {
    const batch: Datum[] = [];
    for (let i = 0; i < count; i++) {
        if (currentSeriesType === 'ohlc' || currentSeriesType === 'candlestick') {
            const { datum, basePrice: newBasePrice } = generateOhlcDatum(nextIndex++, lastBasePrice);
            batch.push(datum);
            lastBasePrice = newBasePrice;
        } else if (currentSeriesType === 'range-bar' || currentSeriesType === 'range-area') {
            batch.push(generateRangeDatum(nextIndex++));
        } else if (currentSeriesType === 'bubble') {
            batch.push(generateBubbleDatum(nextIndex++));
        } else {
            batch.push(generateValueDatum(nextIndex++));
        }
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

        // Keep only last 60 frames for smooth average
        if (fpsHistory.length > 60) {
            fpsHistory.shift();
        }

        const averageFps = fpsHistory.reduce((sum, value) => sum + value, 0) / fpsHistory.length;
        const fpsElement = document.getElementById('fpsCounter');
        if (fpsElement) {
            fpsElement.textContent = `FPS: ${averageFps.toFixed(1)}`;

            // Color code based on FPS
            if (UPDATE_FREQUENCY_MODE === 'raf') {
                // For requestAnimationFrame, expect ~60fps
                if (averageFps >= 55) {
                    fpsElement.style.color = 'green';
                } else if (averageFps >= 30) {
                    fpsElement.style.color = 'orange';
                } else {
                    fpsElement.style.color = 'red';
                }
            } else {
                // For fixed intervals, calculate expected FPS
                const expectedFps = 1000 / UPDATE_INTERVAL_MS;
                const tolerance = expectedFps * 0.1; // 10% tolerance
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
    // For requestAnimationFrame, use 16.67ms (60fps) as baseline
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
    return elapsed;
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
        // Record FPS before update
        recordFps();

        // Maintain a rolling window by appending and removing batch-sized chunks.
        const remove = data.slice(0, BATCH_SIZE);
        const append = createBatch(BATCH_SIZE);
        data = data.slice(BATCH_SIZE).concat(append);
        await dispatchUpdate({ append, remove });
        updateDataCountDisplay();
    } finally {
        updateInFlight = false;
    }

    // Schedule next update if using requestAnimationFrame
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
        // Use requestAnimationFrame for smooth 60fps updates
        rafId = requestAnimationFrame(() => {
            void runAutoUpdate();
        });
    } else {
        // Use setInterval for fixed interval updates
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

    // Stop current updates if running
    if (wasRunning) {
        stopUpdates();
    }

    // Parse frequency value
    if (frequency === 'raf') {
        UPDATE_FREQUENCY_MODE = 'raf';
    } else {
        const intervalMs = parseInt(frequency, 10);
        if (!isNaN(intervalMs) && intervalMs > 0) {
            UPDATE_FREQUENCY_MODE = intervalMs;
            UPDATE_INTERVAL_MS = intervalMs;
        }
    }

    // Persist the frequency selection
    setConfigValue('frequency', frequency);

    // Restart updates if they were running
    if (wasRunning) {
        startUpdates();
    }

    resetCpuIndicator();
    resetFpsCounter();
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

async function setSeriesType(newSeriesType: SeriesType) {
    if (newSeriesType === currentSeriesType || seriesTypeUpdateInProgress) {
        return;
    }

    seriesTypeUpdateInProgress = true;
    const wasRunning = isRunning;

    try {
        // Stop updates temporarily
        if (isRunning) {
            stopUpdates();
        }

        // Preserve data count and regenerate data for the new series type
        const dataCount = data.length;
        const seedResult = createSeedData(dataCount, newSeriesType);
        data = seedResult.data;
        lastBasePrice = seedResult.lastBasePrice;

        // Reset nextIndex to maintain continuity
        nextIndex = data.length;

        // Update chart with new series configuration using full update
        await chart.update({
            ...options,
            data,
            series: createSeriesConfig(newSeriesType),
        });

        currentSeriesType = newSeriesType;

        // Persist the selection
        setConfigValue('seriesType', currentSeriesType);

        // Update selector if it exists
        // The seriesTypeUpdateInProgress flag prevents recursive calls from onchange
        const seriesTypeSelect = document.getElementById('seriesTypeSelect') as HTMLSelectElement | null;
        if (seriesTypeSelect && seriesTypeSelect.value !== currentSeriesType) {
            seriesTypeSelect.value = currentSeriesType;
        }

        // Reset indicators
        resetCpuIndicator();
        updateDataCountDisplay();

        // Resume updates if they were running before the switch
        if (wasRunning) {
            startUpdates();
        }
    } finally {
        seriesTypeUpdateInProgress = false;
    }
}

let axisTypeUpdateInProgress = false;

async function setAxisType(newAxisType: AxisType) {
    if (newAxisType === currentAxisType || axisTypeUpdateInProgress) {
        return;
    }

    axisTypeUpdateInProgress = true;
    const wasRunning = isRunning;

    try {
        // Stop updates temporarily
        if (isRunning) {
            stopUpdates();
        }

        // Update chart with new axis configuration
        await chart.update({
            ...options,
            data,
            axes: createAxesConfigCompat(newAxisType) as any,
            series: createSeriesConfig(currentSeriesType),
        });

        currentAxisType = newAxisType;

        // Persist the selection
        setConfigValue('axisType', currentAxisType);

        // Update selector if it exists
        const axisTypeSelect = document.getElementById('axisTypeSelect') as HTMLSelectElement | null;
        if (axisTypeSelect && axisTypeSelect.value !== currentAxisType) {
            axisTypeSelect.value = currentAxisType;
        }

        // Reset indicators
        resetCpuIndicator();

        // Resume updates if they were running before the switch
        if (wasRunning) {
            startUpdates();
        }
    } finally {
        axisTypeUpdateInProgress = false;
    }
}

resetCpuIndicator();
resetFpsCounter();
updateDataCountDisplay();
updateButtonLabels();

// Initialize form controls with config values
methodSelect = document.getElementById('methodSelect') as HTMLSelectElement | null;
if (methodSelect) {
    methodSelect.value = currentUpdateMethod;
}

const frequencySelect = document.getElementById('frequencySelect') as HTMLSelectElement | null;
if (frequencySelect) {
    frequencySelect.value = persistedFrequency;
}

const seriesTypeSelect = document.getElementById('seriesTypeSelect') as HTMLSelectElement | null;
if (seriesTypeSelect) {
    seriesTypeSelect.value = currentSeriesType;
}

const axisTypeSelect = document.getElementById('axisTypeSelect') as HTMLSelectElement | null;
if (axisTypeSelect) {
    axisTypeSelect.value = currentAxisType;
}

// Start updates AFTER config has been loaded and controls initialized
if (getConfigValue('updatesRunning')) {
    startUpdates();
}

// Check for benchmark URL parameter
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('benchmark') === 'true') {
    // Auto-start benchmark after a short delay to ensure everything is initialized
    setTimeout(() => {
        void benchmarkRunner.run();
    }, 1000);
}

// Listen for hash changes (e.g., when switching to full-screen mode)
window.addEventListener('hashchange', () => {
    const newConfig = loadConfig();
    
    const newSeriesType = (newConfig.seriesType ?? DEFAULT_CONFIG.seriesType) as SeriesType;
    if (newSeriesType !== currentSeriesType && !seriesTypeUpdateInProgress) {
        void setSeriesType(newSeriesType);
    }
    
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
    
    const newAxisType = (newConfig.axisType ?? DEFAULT_CONFIG.axisType) as AxisType;
    if (newAxisType !== currentAxisType && !axisTypeUpdateInProgress) {
        void setAxisType(newAxisType);
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
(window as any).updateBatchSize = (size: string) => {
    setBatchSize(parseInt(size, 10));
};
(window as any).updateSeriesType = (seriesType: string) => {
    void setSeriesType(seriesType as SeriesType);
};
(window as any).updateAxisType = (axisType: string) => {
    void setAxisType(axisType as AxisType);
};
(window as any).rollBatch = rollBatch;

// Create benchmark runner instance
const benchmarkConfig: BenchmarkConfig<SeriesType> = {
    testCases: ALL_SERIES_TYPES,
    updatesPerTest: 500,
    maxCollectionTimeMs: 10000,
    warmupUpdates: 20,
    version: VERSION,
    versionWarnings: [
        ...(!SUPPORTS_APPLY_TRANSACTION ? ['applyTransaction not available (requires >= 12.3.0). Only updateDelta will be tested.'] : []),
        ...(!SUPPORTS_AXES_DICT ? ['Using axes array format for compatibility (requires >= 13.0.0 for dictionary format).'] : []),
    ],
    metadata: {
        initialDataPoints: INITIAL_POINTS,
        batchSize: BATCH_SIZE,
        axisType: currentAxisType,
        dataIntervalMs: DATA_INTERVAL_MS,
    },
};

const benchmarkCallbacks: BenchmarkCallbacks<SeriesType> = {
    setupTestCase: async (seriesType: SeriesType) => {
        await setSeriesType(seriesType);
    },
    performUpdate: async (seriesType: SeriesType, method: string) => {
        // Ensure no regular updates are running
        if (isRunning) {
            stopUpdates();
        }

        // Set the update method
        currentUpdateMethod = method as 'applyTransaction' | 'updateDelta';

        // Create rolling window update
        if (data.length <= BATCH_SIZE) {
            return 0;
        }
        const remove = data.slice(0, BATCH_SIZE);
        const append = createBatch(BATCH_SIZE);
        data = data.slice(BATCH_SIZE).concat(append);

        const start = performance.now();
        if (method === 'applyTransaction') {
            await (chart as any).applyTransaction({
                append,
                remove,
            });
        } else {
            await chart.updateDelta({ data });
        }
        await chart.waitForUpdate();
        return performance.now() - start;
    },
    getMethods: (seriesType: SeriesType) => {
        return SUPPORTS_APPLY_TRANSACTION ? ['applyTransaction', 'updateDelta'] : ['updateDelta'];
    },
    formatTestCase: (seriesType: SeriesType) => seriesType,
    formatMethod: (method: string) => method,
};

const benchmarkRunner = new BenchmarkRunner<SeriesType>(benchmarkConfig, benchmarkCallbacks);

(window as any).runBenchmark = () => benchmarkRunner.run();

export {};
