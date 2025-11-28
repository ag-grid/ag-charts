import { type AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

(window as any).agChartsDebug = ['scene:stats'];

const STREAM_INTERVAL_MS = 10;
const DATA_INTERVAL_MS = 250;
const POINTS_PER_MINUTE = 60000 / DATA_INTERVAL_MS;

// Gap configuration: we'll start with early data (0-29 minutes) and late data (60-89 minutes)
// The gap (30-59 minutes) will be filled incrementally
const EARLY_MINUTES = 30;
const GAP_START_MINUTES = 30;
const GAP_END_MINUTES = 60;
const LATE_START_MINUTES = 60;
const LATE_END_MINUTES = 90;

interface DataPoint {
    timestamp: number;
    price: number;
    volume: number;
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

const priceCache: number[] = [];
const volumeCache: number[] = [];
let lastComputedIndex = -1;
let lastPrice = 100;

function getPriceForIndex(index: number): number {
    if (index <= lastComputedIndex && priceCache[index] != null) {
        return priceCache[index];
    }

    for (let i = lastComputedIndex + 1; i <= index; i++) {
        const drift = Math.sin(i / 48) * 0.7 + Math.cos(i / 96) * 0.4;
        lastPrice = Number((lastPrice + drift).toFixed(2));
        priceCache[i] = lastPrice;
        lastComputedIndex = i;
    }

    return priceCache[index];
}

function getVolumeForIndex(index: number): number {
    if (volumeCache[index] != null) {
        return volumeCache[index];
    }

    const volume = 600 + Math.round((Math.sin(index / 32) + 1) * 220);
    volumeCache[index] = volume;
    return volume;
}

function createDataPointForIndex(index: number): DataPoint {
    return {
        timestamp: START_TIMESTAMP + index * DATA_INTERVAL_MS,
        price: getPriceForIndex(index),
        volume: getVolumeForIndex(index),
    };
}

function createDatumForMinute(minute: number): DataPoint {
    const index = minute * POINTS_PER_MINUTE;
    return createDataPointForIndex(index);
}

function createSeedData(startMinute: number, endMinute: number): DataPoint[] {
    const data: DataPoint[] = [];

    for (let minute = startMinute; minute < endMinute; minute++) {
        for (let i = 0; i < POINTS_PER_MINUTE; i++) {
            const index = minute * POINTS_PER_MINUTE + i;
            data.push(createDataPointForIndex(index));
        }
    }

    return data;
}

// Create initial data with a gap
function createGappedData(): DataPoint[] {
    const earlyData = createSeedData(0, EARLY_MINUTES);
    const lateData = createSeedData(LATE_START_MINUTES, LATE_END_MINUTES);
    return [...earlyData, ...lateData];
}

const initialData = createGappedData();
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: initialData,
    animation: { enabled: false },
    legend: { enabled: false },
    axes: {
        x: {
            type: 'time',
            position: 'bottom',
            label: { format: '%H:%M:%S' },
        },
        y: {
            type: 'number',
            position: 'left',
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

// Gap-filling state
let currentGapMinute = GAP_START_MINUTES;
let currentGapPointInMinute = 0;

function createGapFillingDatum(): DataPoint | null {
    // Check if gap is fully filled
    if (currentGapMinute >= GAP_END_MINUTES) {
        console.log('Gap fully filled');
        return null;
    }

    const index = currentGapMinute * POINTS_PER_MINUTE + currentGapPointInMinute;
    const datum = createDataPointForIndex(index);

    // Advance to next point
    currentGapPointInMinute++;
    if (currentGapPointInMinute >= POINTS_PER_MINUTE) {
        currentGapPointInMinute = 0;
        currentGapMinute++;
    }

    return datum;
}

async function resetDataGap() {
    // Reset to gapped state
    data = createGappedData();
    await chart.updateDelta({ data });

    // Reset gap-filling state
    currentGapMinute = GAP_START_MINUTES;
    currentGapPointInMinute = 0;

    console.log(
        `Reset to gapped data: 0-${EARLY_MINUTES}min + ${LATE_START_MINUTES}-${LATE_END_MINUTES}min (gap: ${GAP_START_MINUTES}-${GAP_END_MINUTES}min)`
    );
}

function changeSeriesType(type: 'line' | 'area' | 'bar' | 'scatter' | 'bubble') {
    const baseConfig = {
        xKey: 'timestamp',
        yKey: 'price',
    };

    let seriesConfig: any;

    switch (type) {
        case 'line':
            seriesConfig = {
                ...baseConfig,
                type: 'line',
                strokeWidth: 2,
                marker: { enabled: false },
            };
            break;
        case 'area':
            seriesConfig = {
                ...baseConfig,
                type: 'area',
                strokeWidth: 2,
                fillOpacity: 0.3,
                marker: { enabled: false },
            };
            break;
        case 'bar':
            seriesConfig = {
                ...baseConfig,
                type: 'bar',
            };
            break;
        case 'scatter':
            seriesConfig = {
                ...baseConfig,
                type: 'scatter',
                marker: {
                    size: 5,
                },
            };
            break;
        case 'bubble':
            seriesConfig = {
                ...baseConfig,
                type: 'bubble',
                sizeKey: 'volume',
                sizeName: 'Volume',
            };
            break;
    }

    chart.updateDelta({ series: [seriesConfig] });
    console.log(`Changed to ${type} series`);
}

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

let method = 'applyTransaction-fill-gap';
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

    if (method === 'applyTransaction-fill-gap') {
        // Fill the gap incrementally
        const newDatum = createGapFillingDatum();
        if (!newDatum) {
            console.log('Gap fully filled, stopping feed');
            if (feed.running) toggleFeed();
            if (rapidFeed.running) toggleRapidFeed();
            return;
        }

        // Find insertion position: binary search for efficiency
        let insertPosition = data.findIndex((d) => d.timestamp > newDatum.timestamp);
        if (insertPosition === -1) {
            insertPosition = data.length;
        }

        data.splice(insertPosition, 0, newDatum);
        await chart.applyTransaction({ add: [newDatum], addIndex: insertPosition });
    } else if (method === 'updateDelta-fill-gap') {
        // Fill the gap using updateDelta (for comparison)
        const newDatum = createGapFillingDatum();
        if (!newDatum) {
            console.log('Gap fully filled, stopping feed');
            if (feed.running) toggleFeed();
            if (rapidFeed.running) toggleRapidFeed();
            return;
        }

        let insertPosition = data.findIndex((d) => d.timestamp > newDatum.timestamp);
        if (insertPosition === -1) {
            insertPosition = data.length;
        }

        const nextData = data.slice();
        nextData.splice(insertPosition, 0, newDatum);
        data = nextData;
        await chart.updateDelta({ data: nextData });
    }

    const endTime = performance.now();
    const elapsedTime = endTime - startTime;

    // Update stats display
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

    // Update progress indicator
    const progressElement = document.getElementById('gapProgress');
    if (progressElement) {
        const totalGapPoints = (GAP_END_MINUTES - GAP_START_MINUTES) * POINTS_PER_MINUTE;
        const filledPoints = (currentGapMinute - GAP_START_MINUTES) * POINTS_PER_MINUTE + currentGapPointInMinute;
        const percentFilled = (filledPoints / totalGapPoints) * 100;
        progressElement.textContent = `Gap filled: ${percentFilled.toFixed(1)}%`;
    }
};

const feed = new RealTimeDataFeed(updateCallback);
const rapidFeed = new RapidDataFeed(updateCallback);
