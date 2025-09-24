import { AgChartOptions, AgCharts } from 'ag-charts-community';

(window as any).agChartsDebug = 'scene:stats';

const STREAM_INTERVAL_MS = 10;
const DATA_INTERVAL_MS = 250;
const MAX_POINTS = 600;

function createLiveDatumFactory(history, mode = 'append') {
    let index = mode === 'append' ? history.length : -1;
    let timestamp =
        mode === 'append' ? history.at(-1)?.timestamp ?? START_TIMESTAMP : history.at(0)?.timestamp ?? START_TIMESTAMP;
    let price = mode === 'append' ? history.at(-1)?.price ?? 100 : history.at(0)?.price ?? 100;

    return () => {
        const drift = Math.sin(Math.abs(index) / 12) * 0.7 + Math.cos(Math.abs(index) / 24) * 0.4;
        price = Number((price + drift).toFixed(2));

        if (mode === 'append') {
            timestamp += DATA_INTERVAL_MS;
            index += 1;
        } else {
            timestamp -= DATA_INTERVAL_MS;
            index -= 1;
        }

        const datum = {
            timestamp,
            price,
            volume: 600 + Math.round((Math.sin(Math.abs(index) / 8) + 1) * 220),
        };
        return datum;
    };
}

class RealTimeDataFeed {
    timerId;
    running = false;
    callback;

    constructor(callback) {
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
    callback;

    constructor(callback) {
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
const START_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0);
function createSeedData(count = 30 * 60 * (1000 / DATA_INTERVAL_MS)) {
    const data: { timestamp: number; price: number; volume: number }[] = [];
    let price = 100;
    let timestamp = START_TIMESTAMP;

    for (let i = 0; i < count; i++) {
        const drift = Math.sin(i / 12) * 0.7 + Math.cos(i / 24) * 0.4;
        price = Number((price + drift).toFixed(2));
        data.push({
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
    data: initialData,
    animation: { enabled: false },
    legend: { enabled: false },
    axes: [
        {
            type: 'time',
            position: 'bottom',
            label: { format: '%H:%M:%S' },
        },
        {
            type: 'number',
            position: 'left',
            label: {
                formatter: (params) => `$${params.value.toFixed(2)}`,
            },
        },
    ],
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
const appendDatumFactory = createLiveDatumFactory(initialData, 'append');
const prependDatumFactory = createLiveDatumFactory(initialData, 'prepend');
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
        rapidFeed.start();
        if (button) button.textContent = 'Stop Rapid Feed';
    }
}

function tickFeed() {
    feed.tick();
}

let method = 'applyTransaction-append';
function use(newMethod) {
    method = newMethod;
    console.log(method);
}

const updateCallback = async () => {
    const isPrepend = method.includes('prepend');
    const datumFactory = isPrepend ? prependDatumFactory : appendDatumFactory;
    const newDatum = datumFactory();

    switch (method) {
        case 'applyTransaction-append':
            data = data.concat(newDatum);
            chart.applyTransaction({ append: [newDatum] });
            break;
        case 'applyTransaction-prepend':
            data = [newDatum].concat(data);
            chart.applyTransaction({ prepend: [newDatum] });
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
};

const feed = new RealTimeDataFeed(updateCallback);
const rapidFeed = new RapidDataFeed(updateCallback);
