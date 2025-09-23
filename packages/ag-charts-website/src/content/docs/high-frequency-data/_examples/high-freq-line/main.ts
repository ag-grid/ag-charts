import { AgChartOptions, AgCharts } from 'ag-charts-community';

(window as any).agChartsDebug = 'scene:stats';

const STREAM_INTERVAL_MS = 10;
const DATA_INTERVAL_MS = 250;
const MAX_POINTS = 600;

function createLiveDatumFactory(history) {
    let index = history.length;
    let timestamp = history.at(-1)?.timestamp ?? START_TIMESTAMP;
    let price = history.at(-1)?.price ?? 100;

    return () => {
        const drift = Math.sin(index / 12) * 0.7 + Math.cos(index / 24) * 0.4;
        price = Number((price + drift).toFixed(2));
        timestamp += DATA_INTERVAL_MS;
        const datum = {
            timestamp,
            price,
            volume: 600 + Math.round((Math.sin(index / 8) + 1) * 220),
        };
        index += 1;
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
const datumFactory = createLiveDatumFactory(initialData);
let data = [...initialData];

function startFeed() {
    feed.start();
}

function stopFeed() {
    feed.stop();
}

function tickFeed() {
    feed.tick();
}

let method = 'applyTransaction';
function use(newMethod) {
    method = newMethod;
    console.log(method);
}

const feed = new RealTimeDataFeed(async () => {
    const newDatum = datumFactory();
    if (method === 'applyTransaction') {
        data = data.concat(newDatum);
        chart.applyTransaction({ append: [newDatum] });
    } else if (method === 'updateDelta') {
        data = data.concat(newDatum);
        chart.updateDelta({ data });
    }
});
