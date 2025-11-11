import { type AgChartOptions, AgCharts } from 'ag-charts-enterprise';

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

let currentSeriesType: SeriesType = 'line';

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

function generateOhlcDatum(index: number): OhlcDatum {
    const timestamp = START_TIMESTAMP + index * DATA_INTERVAL_MS;

    // Calculate base price using deterministic formula similar to candlestick example
    let basePrice = 1_000;
    for (let i = 0; i <= index; i++) {
        const drift = Math.sin(i / 240) * 40 + Math.cos(i / 80) * 25;
        basePrice = Number((basePrice + drift * 0.01).toFixed(2));
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
        timestamp,
        open,
        high,
        low,
        close,
    };
}

function generateDatum(index: number, seriesType: SeriesType = currentSeriesType): Datum {
    if (seriesType === 'ohlc' || seriesType === 'candlestick') {
        return generateOhlcDatum(index);
    } else {
        return generateValueDatum(index);
    }
}

function createSeedData(count: number, seriesType: SeriesType = currentSeriesType): Datum[] {
    const result: Datum[] = [];
    for (let i = 0; i < count; i++) {
        result.push(generateDatum(i, seriesType));
    }
    return result;
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

let data: Datum[] = createSeedData(INITIAL_POINTS);
let nextIndex = data.length;

function createSeriesConfig(seriesType: SeriesType) {
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
                type: 'line',
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
                type: 'bar',
                xKey: 'timestamp',
                yKey: 'value',
            },
        ];
    }
}

const options: AgChartOptions = {
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
        batch.push(generateDatum(nextIndex++, currentSeriesType));
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
        } else if (wasOhlcBased && isValueBased) {
            // Convert OHLC to value-based
            const ohlcData = data.filter(isOhlcDatum);
            data = convertOhlcToValue(ohlcData);
        } else {
            // Same category (value-based to value-based or OHLC to OHLC), regenerate for consistency
            data = createSeedData(dataCount, newSeriesType);
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
