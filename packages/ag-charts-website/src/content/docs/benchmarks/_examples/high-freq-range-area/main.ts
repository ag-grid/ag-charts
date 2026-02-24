// @ag-skip-fws
/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts, VERSION } from 'ag-charts-enterprise';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import {
    ChartRef,
    DataRef,
    performAppend,
    performInitialLoad,
    performRemove,
    performRollingWindow,
} from './benchmarkUtils';

const INITIAL_POINTS = 100_000;
const BATCH_SIZE = 100;
const DATA_INTERVAL_MS = 250;
const START_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0);
const BASE_VALUE = 50;

type Datum = {
    timestamp: number;
    low: number;
    high: number;
};

class HighFrequencyRangeAreaGenerator {
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

const dataGenerator = new HighFrequencyRangeAreaGenerator();
dataGenerator.reset();
const dataRef: DataRef<Datum> = { data: dataGenerator.take(INITIAL_POINTS) };

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: dataRef.data,
    animation: { enabled: false },
    legend: { enabled: false },
    axes: {
        x: {
            type: 'time',
            nice: false,
            label: { format: '%H:%M:%S' },
        },
    },
    series: [
        {
            type: 'range-area',
            xKey: 'timestamp',
            yLowKey: 'low',
            yHighKey: 'high',
            marker: { enabled: false },
        },
    ],
};
/* @ag-options-end */

const chartRef: ChartRef = { current: AgCharts.create(options) };

/** inScope */
async function localPerformInitialLoad(): Promise<number> {
    dataGenerator.reset();
    dataRef.data = dataGenerator.take(INITIAL_POINTS);
    options.data = dataRef.data;
    return performInitialLoad(options, chartRef, (opts) => AgCharts.create(opts));
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    return {
        testCases: [
            {
                id: 'initial-load',
                label: 'Initial Load',
                variants: [
                    {
                        params: { Operation: 'Chart Create' },
                        run: localPerformInitialLoad,
                    },
                ],
            },
            {
                id: 'append-batch',
                label: 'Append Batch',
                minVersion: '12.3.0',
                variants: [
                    {
                        params: { Operation: `Append ${BATCH_SIZE} points` },
                        run: () => performAppend(chartRef.current!, dataRef, dataGenerator, BATCH_SIZE),
                    },
                ],
            },
            {
                id: 'remove-batch',
                label: 'Remove Batch',
                minVersion: '12.3.0',
                variants: [
                    {
                        params: { Operation: `Remove ${BATCH_SIZE} points` },
                        run: () => performRemove(chartRef.current!, dataRef, BATCH_SIZE),
                    },
                ],
            },
            {
                id: 'rolling-window',
                label: 'Rolling Window',
                variants: [
                    {
                        params: { 'Update Method': 'applyTransaction()' },
                        minVersion: '12.3.0',
                        run: () =>
                            performRollingWindow(
                                chartRef.current!,
                                dataRef,
                                dataGenerator,
                                BATCH_SIZE,
                                'applyTransaction'
                            ),
                    },
                    {
                        params: { 'Update Method': 'updateDelta()' },
                        run: () =>
                            performRollingWindow(chartRef.current!, dataRef, dataGenerator, BATCH_SIZE, 'updateDelta'),
                    },
                ],
            },
        ],
        config: {
            updatesPerTest: 100,
            maxCollectionTimeMs: 10000,
            warmupUpdates: 10,
        },
        metadata: {
            initialDataPoints: INITIAL_POINTS,
            batchSize: BATCH_SIZE,
            dataIntervalMs: DATA_INTERVAL_MS,
            seriesType: 'range-area',
            version: VERSION,
            expectedRetainedSizeMB: undefined,
            expectedCanvasCount: 3,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
