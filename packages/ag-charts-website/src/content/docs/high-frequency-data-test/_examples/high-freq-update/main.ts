import { type AgChartOptions, AgCharts } from 'ag-charts-enterprise';

(window as any).agChartsDebug = ['scene:stats'];

const STREAM_INTERVAL_MS = 50;
const NUM_STOCKS = 10;

interface StockDatum {
    symbol: string;
    price: number;
    change: number;
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
function createStockData(): StockDatum[] {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NFLX', 'NVDA', 'AMD', 'INTC'];
    const basePrices = [150, 120, 300, 140, 200, 280, 400, 450, 100, 45];

    return symbols.slice(0, NUM_STOCKS).map((symbol, i) => ({
        symbol,
        price: basePrices[i],
        change: 0,
        volume: 1000000 + Math.random() * 500000,
    }));
}

const initialData = createStockData();
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: initialData,
    animation: { enabled: false },
    legend: { enabled: false },
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
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
            type: 'bar',
            xKey: 'symbol',
            yKey: 'price',
            fill: '#4CAF50',
            strokeWidth: 0,
            label: {
                enabled: true,
                formatter: (params) => `$${params.value.toFixed(2)}`,
            },
        },
    ],
};
/* @ag-options-end */

const chart = AgCharts.create(options);
let data = [...initialData];

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

let method = 'applyTransaction-update';
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

    // Randomly select 2-5 stocks to update
    const numToUpdate = 2 + Math.floor(Math.random() * 4);
    const indicesToUpdate = new Set<number>();
    while (indicesToUpdate.size < numToUpdate) {
        indicesToUpdate.add(Math.floor(Math.random() * data.length));
    }

    const itemsToUpdate: StockDatum[] = [];
    for (const idx of indicesToUpdate) {
        const item = data[idx];

        // Mutate the item in place (simulate price change)
        const priceChange = (Math.random() - 0.5) * 5;
        const previousPrice = item.price;
        item.price = Number((item.price + priceChange).toFixed(2));
        item.change = Number((((item.price - previousPrice) / previousPrice) * 100).toFixed(2));
        item.volume = Math.floor(1000000 + Math.random() * 500000);

        itemsToUpdate.push(item);
    }

    switch (method) {
        case 'applyTransaction-update':
            chart.applyTransaction({ update: itemsToUpdate });
            break;
        case 'updateDelta-update':
            chart.updateDelta({ data });
            break;
        case 'update-all':
            // Update all items
            const allItems: StockDatum[] = [];
            for (const item of data) {
                const priceChange = (Math.random() - 0.5) * 5;
                const previousPrice = item.price;
                item.price = Number((item.price + priceChange).toFixed(2));
                item.change = Number((((item.price - previousPrice) / previousPrice) * 100).toFixed(2));
                item.volume = Math.floor(1000000 + Math.random() * 500000);
                allItems.push(item);
            }
            chart.applyTransaction({ update: allItems });
            break;
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
