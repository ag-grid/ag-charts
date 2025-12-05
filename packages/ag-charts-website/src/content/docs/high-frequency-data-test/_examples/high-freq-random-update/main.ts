import { type AgCartesianChartOptions, type AgCartesianSeriesOptions, AgCharts } from 'ag-charts-enterprise';

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

const INITIAL_POINTS = 100_000;
let UPDATE_COUNT = 100;
let UPDATE_INTERVAL_MS = 200;
let UPDATE_FREQUENCY_MODE: 'raf' | number = 200;
const DATA_INTERVAL_MS = 250;
const START_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0);

const STORAGE_KEY = 'high-freq-random-update-series-type';
const UPDATES_STATE_KEY = 'high-freq-random-update-updates-running';
const FREQUENCY_KEY = 'high-freq-random-update-frequency';
const AXIS_TYPE_KEY = 'high-freq-random-update-axis-type';

// Initialize frequency from persisted value
const persistedFrequency = getPersistedFrequency();
if (persistedFrequency === 'raf') {
    UPDATE_FREQUENCY_MODE = 'raf';
} else {
    const intervalMs = parseInt(persistedFrequency, 10);
    if (!isNaN(intervalMs) && intervalMs > 0) {
        UPDATE_FREQUENCY_MODE = intervalMs;
        UPDATE_INTERVAL_MS = intervalMs;
    }
}

function getSeriesTypeFromHash(): SeriesType | null {
    try {
        const hash = window.location.hash.slice(1);
        if (!hash) return null;
        const params = new URLSearchParams(hash);
        const seriesType = params.get('seriesType');
        if (seriesType && ALL_SERIES_TYPES.includes(seriesType as SeriesType)) {
            return seriesType as SeriesType;
        }
    } catch {
        // Ignore parsing errors
    }
    return null;
}

function getSeriesTypeFromStorage(): SeriesType | null {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored && ALL_SERIES_TYPES.includes(stored as SeriesType)) {
            return stored as SeriesType;
        }
    } catch {
        // Ignore storage errors (e.g., in private browsing)
    }
    return null;
}

function getPersistedSeriesType(): SeriesType {
    return getSeriesTypeFromHash() || getSeriesTypeFromStorage() || 'line';
}

function persistSeriesType(seriesType: SeriesType) {
    try {
        sessionStorage.setItem(STORAGE_KEY, seriesType);
    } catch {
        // Ignore storage errors (e.g., private browsing)
    }

    try {
        if (window.parent === window) {
            const hash = window.location.hash.slice(1);
            const params = new URLSearchParams(hash);
            params.set('seriesType', seriesType);
            const newHash = params.toString();
            history.replaceState(null, '', `#${newHash}`);
        }
    } catch {
        // Ignore hash update errors
    }
}

function getUpdatesStateFromHash(): boolean | null {
    try {
        const hash = window.location.hash.slice(1);
        if (!hash) return null;
        const params = new URLSearchParams(hash);
        const updatesRunning = params.get('updatesRunning');
        if (updatesRunning === 'true') return true;
        if (updatesRunning === 'false') return false;
    } catch {
        // Ignore parsing errors
    }
    return null;
}

function getUpdatesStateFromStorage(): boolean | null {
    try {
        const stored = sessionStorage.getItem(UPDATES_STATE_KEY);
        if (stored === 'true') return true;
        if (stored === 'false') return false;
    } catch {
        // Ignore storage errors (e.g., in private browsing)
    }
    return null;
}

function getPersistedUpdatesState(): boolean {
    return getUpdatesStateFromHash() ?? getUpdatesStateFromStorage() ?? false;
}

function persistUpdatesState(running: boolean) {
    try {
        sessionStorage.setItem(UPDATES_STATE_KEY, String(running));
    } catch {
        // Ignore storage errors (e.g., private browsing)
    }

    try {
        if (window.parent === window) {
            const hash = window.location.hash.slice(1);
            const params = new URLSearchParams(hash);
            params.set('updatesRunning', String(running));
            const newHash = params.toString();
            history.replaceState(null, '', `#${newHash}`);
        }
    } catch {
        // Ignore hash update errors
    }
}

function getFrequencyFromHash(): string | null {
    try {
        const hash = window.location.hash.slice(1);
        if (!hash) return null;
        const params = new URLSearchParams(hash);
        const frequency = params.get('frequency');
        if (frequency && (frequency === 'raf' || ['50', '100', '200', '500', '1000'].includes(frequency))) {
            return frequency;
        }
    } catch {
        // Ignore parsing errors
    }
    return null;
}

function getFrequencyFromStorage(): string | null {
    try {
        const stored = sessionStorage.getItem(FREQUENCY_KEY);
        if (stored && (stored === 'raf' || ['50', '100', '200', '500', '1000'].includes(stored))) {
            return stored;
        }
    } catch {
        // Ignore storage errors (e.g., in private browsing)
    }
    return null;
}

function getPersistedFrequency(): string {
    return getFrequencyFromHash() || getFrequencyFromStorage() || '200';
}

function persistFrequency(frequency: string) {
    try {
        sessionStorage.setItem(FREQUENCY_KEY, frequency);
    } catch {
        // Ignore storage errors (e.g., private browsing)
    }

    try {
        if (window.parent === window) {
            const hash = window.location.hash.slice(1);
            const params = new URLSearchParams(hash);
            params.set('frequency', frequency);
            const newHash = params.toString();
            history.replaceState(null, '', `#${newHash}`);
        }
    } catch {
        // Ignore hash update errors
    }
}

function getAxisTypeFromHash(): AxisType | null {
    try {
        const hash = window.location.hash.slice(1);
        if (!hash) return null;
        const params = new URLSearchParams(hash);
        const axisType = params.get('axisType');
        if (axisType && ALL_AXIS_TYPES.includes(axisType as AxisType)) {
            return axisType as AxisType;
        }
    } catch {
        // Ignore parsing errors
    }
    return null;
}

function getAxisTypeFromStorage(): AxisType | null {
    try {
        const stored = sessionStorage.getItem(AXIS_TYPE_KEY);
        if (stored && ALL_AXIS_TYPES.includes(stored as AxisType)) {
            return stored as AxisType;
        }
    } catch {
        // Ignore storage errors (e.g., in private browsing)
    }
    return null;
}

function getPersistedAxisType(): AxisType {
    return getAxisTypeFromHash() || getAxisTypeFromStorage() || 'time';
}

function persistAxisType(axisType: AxisType) {
    try {
        sessionStorage.setItem(AXIS_TYPE_KEY, axisType);
    } catch {
        // Ignore storage errors (e.g., private browsing)
    }

    try {
        if (window.parent === window) {
            const hash = window.location.hash.slice(1);
            const params = new URLSearchParams(hash);
            params.set('axisType', axisType);
            const newHash = params.toString();
            history.replaceState(null, '', `#${newHash}`);
        }
    } catch {
        // Ignore hash update errors
    }
}

let currentSeriesType: SeriesType = getPersistedSeriesType();
let currentAxisType: AxisType = getPersistedAxisType();

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

    // Mutate and collect items to update
    const itemsToUpdate: Datum[] = [];
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
    persistUpdatesState(true);
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
    persistUpdatesState(false);
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

    persistFrequency(frequency);

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

        persistSeriesType(currentSeriesType);

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

        persistAxisType(currentAxisType);

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

if (getPersistedUpdatesState()) {
    startUpdates();
}

window.addEventListener('hashchange', () => {
    const persistedType = getPersistedSeriesType();
    if (persistedType !== currentSeriesType && !seriesTypeUpdateInProgress) {
        void setSeriesType(persistedType);
    }
    const persistedUpdatesState = getPersistedUpdatesState();
    if (persistedUpdatesState !== isRunning) {
        if (persistedUpdatesState) {
            startUpdates();
        } else {
            stopUpdates();
        }
    }
    const persistedFreq = getPersistedFrequency();
    const currentFrequency = typeof UPDATE_FREQUENCY_MODE === 'string' ? 'raf' : String(UPDATE_FREQUENCY_MODE);
    if (persistedFreq !== currentFrequency) {
        setUpdateFrequency(persistedFreq);
    }
    const persistedAxisType = getPersistedAxisType();
    if (persistedAxisType !== currentAxisType && !axisTypeUpdateInProgress) {
        void setAxisType(persistedAxisType);
    }
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

export {};
