/* @ag-options-extract */
import { AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

const INITIAL_POINTS = 100_000;
const DATA_INTERVAL_MS = 250;
const START_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0);
const BASE_PRICE = 100;

type Datum = {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

class HighFrequencyOhlcGenerator {
    private index = 0;
    private price = BASE_PRICE;

    reset() {
        this.index = 0;
        this.price = BASE_PRICE;
    }

    take(count: number): Datum[] {
        const batch: Datum[] = [];
        for (let i = 0; i < count; i++) {
            batch.push(this.next());
        }
        return batch;
    }

    private next(): Datum {
        const index = this.index++;
        const timestamp = START_TIMESTAMP + index * DATA_INTERVAL_MS;
        const drift = Math.sin(index / 12) * 0.7 + Math.cos(index / 24) * 0.4;
        this.price = Number((this.price + drift).toFixed(2));

        const volatility = 0.5 + Math.sin(index / 20) * 0.3;
        const open = this.price;
        const close = Number((open + Math.sin(index / 5) * volatility).toFixed(2));
        const high = Number(Math.max(open, close, open + Math.abs(Math.cos(index / 7)) * volatility).toFixed(2));
        const low = Number(Math.min(open, close, open - Math.abs(Math.sin(index / 9)) * volatility).toFixed(2));

        return {
            timestamp,
            open,
            high,
            low,
            close,
            volume: 600 + Math.round((Math.sin(index / 8) + 1) * 220),
        };
    }
}

const dataGenerator = new HighFrequencyOhlcGenerator();
dataGenerator.reset();
const data = dataGenerator.take(INITIAL_POINTS);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    animation: { enabled: false },
    legend: { enabled: false },
    axes: {
        x: {
            type: 'time',
            label: { format: '%H:%M:%S' },
        },
        y: {
            type: 'number',
            label: {
                formatter: (params) => `$${params.value.toFixed(2)}`,
            },
        },
    },
    series: [
        {
            type: 'ohlc',
            xKey: 'timestamp',
            openKey: 'open',
            highKey: 'high',
            lowKey: 'low',
            closeKey: 'close',
        },
    ],
};
/* @ag-options-end */

AgCharts.create(options);
