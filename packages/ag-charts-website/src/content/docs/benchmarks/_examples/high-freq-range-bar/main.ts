/* @ag-options-extract */
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const INITIAL_POINTS = 100_000;
const DATA_INTERVAL_MS = 250;
const START_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0);
const BASE_VALUE = 50;

type Datum = {
    timestamp: number;
    low: number;
    high: number;
};

class HighFrequencyRangeBarGenerator {
    private index = 0;
    private baseValue = BASE_VALUE;

    reset() {
        this.index = 0;
        this.baseValue = BASE_VALUE;
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
        this.baseValue = Number((this.baseValue + drift).toFixed(2));

        const spread = 5 + Math.abs(Math.sin(index / 20)) * 10;
        const low = Number((this.baseValue - spread / 2).toFixed(2));
        const high = Number((this.baseValue + spread / 2).toFixed(2));

        return {
            timestamp,
            low,
            high,
        };
    }
}

const dataGenerator = new HighFrequencyRangeBarGenerator();
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
    },
    series: [
        {
            type: 'range-bar',
            xKey: 'timestamp',
            yLowKey: 'low',
            yHighKey: 'high',
        },
    ],
};
/* @ag-options-end */

AgCharts.create(options);
