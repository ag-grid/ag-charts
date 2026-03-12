import { type AgCartesianChartOptions, type AgCartesianSeriesOptions, AgCharts } from 'ag-charts-enterprise';

(window as any).agChartsDebug = ['scene:stats'];

type ValueDatum = {
    id: number;
    timestamp: number;
    value: number;
};

type OhlcDatum = {
    id: number;
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
};

type RangeDatum = {
    id: number;
    timestamp: number;
    low: number;
    high: number;
};

type BubbleDatum = {
    id: number;
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

const INITIAL_POINTS = 100_000;
let UPDATE_COUNT = 100;
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

let matchingMode: 'ref' | 'id' = 'ref';

function generateValueDatum(index: number): ValueDatum {
    const timestamp = START_TIMESTAMP + index * DATA_INTERVAL_MS;
    const trend = Math.sin(index / 240) * 40 + Math.cos(index / 80) * 25;
    const volatility = Math.sin(index / 15) * 5;
    const baseline = 1_000 + index * 0.02;
    return {
        id: index,
        timestamp,
        value: Number((baseline + trend + volatility).toFixed(2)),
    };
}

function generateOhlcDatum(index: number, previousClose?: number): { datum: OhlcDatum; basePrice: number } {
    const timestamp = START_TIMESTAMP + index * DATA_INTERVAL_MS;

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
            id: index,
            timestamp,
            open: Number(open.toFixed(2)),
            high,
            low,
            close,
        },
        basePrice: close,
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
        id: index,
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
        id: index,
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

// Mutation functions for each datum type
// Large changes to make updates visually obvious
function mutateValueDatum(item: ValueDatum) {
    const change = (Math.random() - 0.5) * 200; // ±100 on values ~1000
    item.value = Number((item.value + change).toFixed(2));
}

function mutateOhlcDatum(item: OhlcDatum) {
    const change = (Math.random() - 0.5) * 100; // ±50 on values ~1000
    item.open = Number((item.open + change).toFixed(2));
    item.close = Number((item.close + change).toFixed(2));
    item.high = Number((Math.max(item.open, item.close) + Math.random() * 20).toFixed(2));
    item.low = Number((Math.min(item.open, item.close) - Math.random() * 20).toFixed(2));
}

function mutateRangeDatum(item: RangeDatum) {
    const change = (Math.random() - 0.5) * 200; // ±100 on values ~1000
    item.low = Number((item.low + change).toFixed(2));
    item.high = Number((item.high + change).toFixed(2));
    // Ensure low < high
    if (item.low > item.high) {
        const temp = item.low;
        item.low = item.high;
        item.high = temp;
    }
}

function mutateBubbleDatum(item: BubbleDatum) {
    const change = (Math.random() - 0.5) * 200; // ±100 on values ~1000
    item.value = Number((item.value + change).toFixed(2));
    item.size = Math.max(1, item.size + (Math.random() - 0.5) * 10);
}

function mutateDatum(item: Datum) {
    if (currentSeriesType === 'ohlc' || currentSeriesType === 'candlestick') {
        mutateOhlcDatum(item as OhlcDatum);
    } else if (currentSeriesType === 'range-bar' || currentSeriesType === 'range-area') {
        mutateRangeDatum(item as RangeDatum);
    } else if (currentSeriesType === 'bubble') {
        mutateBubbleDatum(item as BubbleDatum);
    } else {
        mutateValueDatum(item as ValueDatum);
    }
}

// ID-based replacement functions — create new objects instead of mutating in place
function replaceValueDatum(item: ValueDatum): ValueDatum {
    const change = (Math.random() - 0.5) * 200;
    return {
        id: item.id,
        timestamp: item.timestamp,
        value: Number((item.value + change).toFixed(2)),
    };
}

function replaceOhlcDatum(item: OhlcDatum): OhlcDatum {
    const change = (Math.random() - 0.5) * 100;
    const open = Number((item.open + change).toFixed(2));
    const close = Number((item.close + change).toFixed(2));
    return {
        id: item.id,
        timestamp: item.timestamp,
        open,
        close,
        high: Number((Math.max(open, close) + Math.random() * 20).toFixed(2)),
        low: Number((Math.min(open, close) - Math.random() * 20).toFixed(2)),
    };
}

function replaceRangeDatum(item: RangeDatum): RangeDatum {
    const change = (Math.random() - 0.5) * 200;
    let low = Number((item.low + change).toFixed(2));
    let high = Number((item.high + change).toFixed(2));
    if (low > high) {
        const temp = low;
        low = high;
        high = temp;
    }
    return { id: item.id, timestamp: item.timestamp, low, high };
}

function replaceBubbleDatum(item: BubbleDatum): BubbleDatum {
    const change = (Math.random() - 0.5) * 200;
    return {
        id: item.id,
        timestamp: item.timestamp,
        value: Number((item.value + change).toFixed(2)),
        size: Math.max(1, item.size + (Math.random() - 0.5) * 10),
    };
}

function replaceDatum(item: Datum): Datum {
    if (currentSeriesType === 'ohlc' || currentSeriesType === 'candlestick') {
        return replaceOhlcDatum(item as OhlcDatum);
    } else if (currentSeriesType === 'range-bar' || currentSeriesType === 'range-area') {
        return replaceRangeDatum(item as RangeDatum);
    } else if (currentSeriesType === 'bubble') {
        return replaceBubbleDatum(item as BubbleDatum);
    } else {
        return replaceValueDatum(item as ValueDatum);
    }
}

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
            nice: false,
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
    axes: createAxesConfig(currentAxisType),
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

async function dispatchUpdate(itemsToUpdate: Datum[]) {
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
    // Select random indices to update
    const indicesToUpdate = new Set<number>();
    while (indicesToUpdate.size < UPDATE_COUNT && indicesToUpdate.size < data.length) {
        indicesToUpdate.add(Math.floor(Math.random() * data.length));
    }

    const itemsToUpdate: Datum[] = [];
    if (matchingMode === 'id') {
        // ID-based: create replacement objects instead of mutating in place
        for (const idx of indicesToUpdate) {
            const replacement = replaceDatum(data[idx]);
            data[idx] = replacement;
            itemsToUpdate.push(replacement);
        }
    } else {
        // Ref-based: mutate existing objects in place
        for (const idx of indicesToUpdate) {
            const item = data[idx];
            mutateDatum(item);
            itemsToUpdate.push(item);
        }
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

async function setSeriesType(newSeriesType: SeriesType) {
    if (newSeriesType === currentSeriesType || seriesTypeUpdateInProgress) {
        return;
    }

    seriesTypeUpdateInProgress = true;
    const wasRunning = isRunning;

    try {
        if (isRunning) {
            stopUpdates();
        }

        const dataCount = data.length;
        const seedResult = createSeedData(dataCount, newSeriesType);
        data = seedResult.data;

        await chart.update({
            ...options,
            data,
            series: createSeriesConfig(newSeriesType),
        });

        currentSeriesType = newSeriesType;

        setConfigValue('seriesType', currentSeriesType);

        const seriesTypeSelect = document.getElementById('seriesTypeSelect') as HTMLSelectElement | null;
        if (seriesTypeSelect && seriesTypeSelect.value !== currentSeriesType) {
            seriesTypeSelect.value = currentSeriesType;
        }

        resetCpuIndicator();
        updateDataCountDisplay();

        if (wasRunning) {
            startUpdates();
        }
    } finally {
        seriesTypeUpdateInProgress = false;
    }
}

function setMatchingMode(mode: string) {
    const wasRunning = isRunning;
    if (wasRunning) stopUpdates();

    matchingMode = mode as 'ref' | 'id';

    // Recreate chart data with or without dataIdKey
    const seedResult = createSeedData(data.length);
    data = seedResult.data;
    chart.updateDelta({ data, dataIdKey: matchingMode === 'id' ? 'id' : undefined });

    resetCpuIndicator();
    resetFpsCounter();
    if (wasRunning) startUpdates();
}

let axisTypeUpdateInProgress = false;

async function setAxisType(newAxisType: AxisType) {
    if (newAxisType === currentAxisType || axisTypeUpdateInProgress) {
        return;
    }

    axisTypeUpdateInProgress = true;
    const wasRunning = isRunning;

    try {
        if (isRunning) {
            stopUpdates();
        }

        await chart.update({
            ...options,
            data,
            axes: createAxesConfig(newAxisType),
            series: createSeriesConfig(currentSeriesType),
        });

        currentAxisType = newAxisType;

        setConfigValue('axisType', currentAxisType);

        const axisTypeSelect = document.getElementById('axisTypeSelect') as HTMLSelectElement | null;
        if (axisTypeSelect && axisTypeSelect.value !== currentAxisType) {
            axisTypeSelect.value = currentAxisType;
        }

        resetCpuIndicator();

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
(window as any).updateUpdateCount = (count: string) => {
    setUpdateCount(parseInt(count, 10));
};
(window as any).updateSeriesType = (seriesType: string) => {
    void setSeriesType(seriesType as SeriesType);
};
(window as any).updateAxisType = (axisType: string) => {
    void setAxisType(axisType as AxisType);
};
(window as any).tickUpdate = () => {
    void updateRandomSubset();
};
(window as any).setMatchingMode = (mode: string) => {
    setMatchingMode(mode);
};

export {};
