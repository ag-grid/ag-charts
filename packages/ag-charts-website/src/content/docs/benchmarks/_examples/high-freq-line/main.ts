/* @ag-options-extract */
import { AgChartOptions, AgCharts } from 'ag-charts-community';

const INITIAL_POINTS = 100_000;
const DATA_INTERVAL_MS = 250;
const START_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0);

type Datum = {
    timestamp: number;
    value: number;
};

class HighFrequencyLineDataGenerator {
    private index = 0;

    reset() {
        this.index = 0;
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
        const trend = Math.sin(index / 240) * 40 + Math.cos(index / 80) * 25;
        const volatility = Math.sin(index / 15) * 5;
        const baseline = 1_000 + index * 0.02;

        return {
            timestamp,
            value: Number((baseline + trend + volatility).toFixed(2)),
        };
    }
}

const dataGenerator = new HighFrequencyLineDataGenerator();
dataGenerator.reset();
const data = dataGenerator.take(INITIAL_POINTS);

const options: AgChartOptions = {
    theme: {
        overrides: {
            common: {
                animation: { enabled: false },
            },
        },
    },
    container: document.getElementById('myChart'),
    data,
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
            title: { text: 'Value' },
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'timestamp',
            yKey: 'value',
            marker: { enabled: false },
            strokeWidth: 1,
        },
    ],
};
/* @ag-options-end */

AgCharts.create(options);
