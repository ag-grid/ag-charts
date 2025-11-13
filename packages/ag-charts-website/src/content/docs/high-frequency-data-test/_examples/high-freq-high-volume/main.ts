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

type Datum = ValueDatum | OhlcDatum;
type SeriesType = 'line' | 'bar' | 'ohlc' | 'candlestick';

const INITIAL_POINTS = 100_000;
let BATCH_SIZE = 100;
const UPDATE_INTERVAL_MS = 200;
const DATA_INTERVAL_MS = 250;
const START_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0);

const STORAGE_KEY = 'high-freq-high-volume-series-type';
const UPDATES_STATE_KEY = 'high-freq-high-volume-updates-running';

function getSeriesTypeFromHash(): SeriesType | null {
    try {
        const hash = window.location.hash.slice(1);
        if (!hash) return null;
        const params = new URLSearchParams(hash);
        const seriesType = params.get('seriesType');
        if (seriesType && ['line', 'bar', 'ohlc', 'candlestick'].includes(seriesType)) {
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
        if (stored && ['line', 'bar', 'ohlc', 'candlestick'].includes(stored)) {
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
        // Always update sessionStorage as fallback
        sessionStorage.setItem(STORAGE_KEY, seriesType);
    } catch {
        // Ignore storage errors (e.g., private browsing)
    }

    try {
        // Try to update URL hash (works in full-screen mode, not in iframes)
        if (window.parent === window) {
            // Not in iframe, can update hash directly
            const hash = window.location.hash.slice(1);
            const params = new URLSearchParams(hash);
            params.set('seriesType', seriesType);
            const newHash = params.toString();
            // Use replaceState to avoid page reload
            history.replaceState(null, '', `#${newHash}`);
        }
        // In iframe, rely on sessionStorage (can't reliably update parent hash)
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
        // Always update sessionStorage as fallback
        sessionStorage.setItem(UPDATES_STATE_KEY, String(running));
    } catch {
        // Ignore storage errors (e.g., private browsing)
    }

    try {
        // Try to update URL hash (works in full-screen mode, not in iframes)
        if (window.parent === window) {
            // Not in iframe, can update hash directly
            const hash = window.location.hash.slice(1);
            const params = new URLSearchParams(hash);
            params.set('updatesRunning', String(running));
            const newHash = params.toString();
            // Use replaceState to avoid page reload
            history.replaceState(null, '', `#${newHash}`);
        }
        // In iframe, rely on sessionStorage (can't reliably update parent hash)
    } catch {
        // Ignore hash update errors
    }
}

let currentSeriesType: SeriesType = getPersistedSeriesType();

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

function generateOhlcDatum(index: number, previousBasePrice?: number): { datum: OhlcDatum; basePrice: number } {
    const timestamp = START_TIMESTAMP + index * DATA_INTERVAL_MS;

    // Calculate base price incrementally from previous value (O(1) instead of O(n))
    const drift = Math.sin(index / 240) * 40 + Math.cos(index / 80) * 25;
    let basePrice: number;
    if (previousBasePrice !== undefined) {
        basePrice = Number((previousBasePrice + drift * 0.01).toFixed(2));
    } else {
        // Fallback: compute cumulative sum (O(n) but only for edge cases)
        // This should rarely happen in practice as we maintain state
        let computedBasePrice = 1_000;
        for (let i = 0; i <= index; i++) {
            const d = Math.sin(i / 240) * 40 + Math.cos(i / 80) * 25;
            computedBasePrice = Number((computedBasePrice + d * 0.01).toFixed(2));
        }
        basePrice = computedBasePrice;
    }

    // Generate realistic OHLC data with volatility
    const volatility = 0.5 + Math.sin(index / 20) * 0.3;
    const trend = Math.sin(index / 240) * 40 + Math.cos(index / 80) * 25;
    const baseline = 1_000 + index * 0.02;
    const close = Number((baseline + trend + Math.sin(index / 15) * volatility).toFixed(2));
    const open = basePrice;
    const high = Number(Math.max(open, close, basePrice + Math.abs(Math.cos(index / 7)) * volatility * 2).toFixed(2));
    const low = Number(Math.min(open, close, basePrice - Math.abs(Math.sin(index / 9)) * volatility * 2).toFixed(2));

    return {
        datum: {
            timestamp,
            open,
            high,
            low,
            close,
        },
        basePrice,
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
        } else {
            result.push(generateValueDatum(i));
        }
    }
    return { data: result, lastBasePrice: basePrice };
}

function isValueDatum(datum: Datum): datum is ValueDatum {
    return 'value' in datum;
}

function isOhlcDatum(datum: Datum): datum is OhlcDatum {
    return 'open' in datum && 'high' in datum && 'low' in datum && 'close' in datum;
}

function convertValueToOhlc(valueData: ValueDatum[]): OhlcDatum[] {
    return valueData.map((datum, index) => {
        const basePrice = datum.value;
        const volatility = 0.5 + Math.sin(index / 20) * 0.3;
        const close = basePrice;
        const open = index > 0 ? (valueData[index - 1] as ValueDatum).value : basePrice;
        const high = Number(
            Math.max(open, close, basePrice + Math.abs(Math.cos(index / 7)) * volatility * 2).toFixed(2)
        );
        const low = Number(
            Math.min(open, close, basePrice - Math.abs(Math.sin(index / 9)) * volatility * 2).toFixed(2)
        );

        return {
            timestamp: datum.timestamp,
            open,
            high,
            low,
            close,
        };
    });
}

function convertOhlcToValue(ohlcData: OhlcDatum[]): ValueDatum[] {
    return ohlcData.map((datum) => ({
        timestamp: datum.timestamp,
        value: datum.close,
    }));
}

const seedResult = createSeedData(INITIAL_POINTS);
let data: Datum[] = seedResult.data;
let nextIndex = data.length;
// Track last base price for OHLC generation to maintain O(n) complexity
let lastBasePrice: number | undefined = seedResult.lastBasePrice;

function createSeriesConfig(seriesType: SeriesType): AgCartesianSeriesOptions[] {
    if (seriesType === 'ohlc' || seriesType === 'candlestick') {
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
    } else if (seriesType === 'line') {
        return [
            {
                type: 'line' as const,
                xKey: 'timestamp',
                yKey: 'value',
                marker: { enabled: false },
                strokeWidth: 1,
            },
        ];
    } else {
        // bar series
        return [
            {
                type: 'bar' as const,
                xKey: 'timestamp',
                yKey: 'value',
            },
        ];
    }
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data,
    animation: { enabled: false },
    axes: {
        x: {
            type: 'time',
            position: 'bottom',
            nice: false,
            label: {
                format: '%H:%M:%S',
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Value',
            },
        },
    },
    series: createSeriesConfig(currentSeriesType),
    legend: { enabled: false },
};

const chart = AgCharts.create(options);

let currentUpdateMethod: 'applyTransaction' | 'updateDelta' = 'applyTransaction';
let isRunning = false;
let intervalId: ReturnType<typeof setInterval> | undefined;
let updateInFlight = false;
let cpuUsageHistory: number[] = [];
let methodSelect: HTMLSelectElement | null = null;
let seriesTypeUpdateInProgress = false;

function createBatch(count: number): Datum[] {
    const batch: Datum[] = [];
    for (let i = 0; i < count; i++) {
        if (currentSeriesType === 'ohlc' || currentSeriesType === 'candlestick') {
            const { datum, basePrice: newBasePrice } = generateOhlcDatum(nextIndex++, lastBasePrice);
            batch.push(datum);
            lastBasePrice = newBasePrice;
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
    persistUpdatesState(true);
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
    persistUpdatesState(false);
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
    const addBtn = document.getElementById('addBtn');
    const removeBtn = document.getElementById('removeBtn');

    if (addBtn) {
        addBtn.textContent = `Add ${BATCH_SIZE.toLocaleString()}`;
    }
    if (removeBtn) {
        removeBtn.textContent = `Remove ${BATCH_SIZE.toLocaleString()}`;
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

    try {
        // Stop updates if running
        if (isRunning) {
            stopUpdates();
        }

        const wasValueBased = currentSeriesType === 'line' || currentSeriesType === 'bar';
        const isValueBased = newSeriesType === 'line' || newSeriesType === 'bar';
        const wasOhlcBased = currentSeriesType === 'ohlc' || currentSeriesType === 'candlestick';
        const isOhlcBased = newSeriesType === 'ohlc' || newSeriesType === 'candlestick';

        // Preserve data count
        const dataCount = data.length;

        // Convert data if switching between incompatible types to maintain visual continuity
        if (wasValueBased && isOhlcBased) {
            // Convert value-based to OHLC
            const valueData = data.filter(isValueDatum);
            data = convertValueToOhlc(valueData);
            // Calculate lastBasePrice by running generation up to last index (O(n) but only once)
            if (data.length > 0) {
                let computedBasePrice = 1_000;
                for (let i = 0; i < data.length; i++) {
                    const drift = Math.sin(i / 240) * 40 + Math.cos(i / 80) * 25;
                    computedBasePrice = Number((computedBasePrice + drift * 0.01).toFixed(2));
                }
                lastBasePrice = computedBasePrice;
            }
        } else if (wasOhlcBased && isValueBased) {
            // Convert OHLC to value-based
            const ohlcData = data.filter(isOhlcDatum);
            data = convertOhlcToValue(ohlcData);
            lastBasePrice = undefined;
        } else {
            // Same category (value-based to value-based or OHLC to OHLC), regenerate for consistency
            const seedResult = createSeedData(dataCount, newSeriesType);
            data = seedResult.data;
            lastBasePrice = seedResult.lastBasePrice;
        }

        // Reset nextIndex to maintain continuity
        nextIndex = data.length;

        // Update chart with new series configuration
        await chart.updateDelta({
            data,
            series: createSeriesConfig(newSeriesType),
        });

        await chart.waitForUpdate();

        currentSeriesType = newSeriesType;

        // Persist the selection
        persistSeriesType(currentSeriesType);

        // Update selector if it exists
        // The seriesTypeUpdateInProgress flag prevents recursive calls from onchange
        const seriesTypeSelect = document.getElementById('seriesTypeSelect') as HTMLSelectElement | null;
        if (seriesTypeSelect && seriesTypeSelect.value !== currentSeriesType) {
            seriesTypeSelect.value = currentSeriesType;
        }

        // Reset indicators
        resetCpuIndicator();
        updateDataCountDisplay();
    } finally {
        seriesTypeUpdateInProgress = false;
    }
}

resetCpuIndicator();
updateDataCountDisplay();
updateButtonLabels();

methodSelect = document.getElementById('methodSelect') as HTMLSelectElement | null;
if (methodSelect) {
    methodSelect.value = currentUpdateMethod;
}

// Initialize series type selector with persisted value
const seriesTypeSelect = document.getElementById('seriesTypeSelect') as HTMLSelectElement | null;
if (seriesTypeSelect) {
    seriesTypeSelect.value = currentSeriesType;
}

// Restore updates state from persistence
if (getPersistedUpdatesState()) {
    startUpdates();
}

// Listen for hash changes (e.g., when switching to full-screen mode)
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
});

(window as any).toggleUpdates = () => {
    handleToggleUpdates();
};
(window as any).updateMethod = (method: string) => {
    setUpdateMethod(method);
};
(window as any).updateBatchSize = (size: string) => {
    setBatchSize(parseInt(size, 10));
};
(window as any).updateSeriesType = (seriesType: string) => {
    void setSeriesType(seriesType as SeriesType);
};
(window as any).addBatch = () => {
    void addPoints(BATCH_SIZE);
};
(window as any).removeBatch = () => {
    void removePoints(BATCH_SIZE);
};

export {};
