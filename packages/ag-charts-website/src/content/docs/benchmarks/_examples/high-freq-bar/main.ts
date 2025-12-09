/* @ag-options-extract */
import { AgChartOptions, AgCharts } from 'ag-charts-community';

const INITIAL_POINTS = 100_000;
const DATA_INTERVAL_MS = 250;
const START_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0);
const BASE_PRICE = 100;

type Datum = {
    timestamp: number;
    price: number;
    volume: number;
};

class HighFrequencyBarDataGenerator {
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
        return {
            timestamp,
            price: this.price,
            volume: 600 + Math.round((Math.sin(index / 8) + 1) * 220),
        };
    }
}

const dataGenerator = new HighFrequencyBarDataGenerator();
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
            type: 'bar',
            xKey: 'timestamp',
            yKey: 'price',
        },
    ],
};
/* @ag-options-end */

AgCharts.create(options);
