// @ag-skip-fws
/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts, VERSION } from 'ag-charts-enterprise';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import {
    ChartRef,
    DataRef,
    isReleaseBelow,
    performAppend,
    performInitialLoad,
    performRemove,
    performRollingWindow,
} from './benchmarkUtils';

const INITIAL_POINTS = 100_000;
const BATCH_SIZE = 100;
const DATA_INTERVAL_MS = 250;
const START_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0);
const BASE_PRICE = 100;

// The hlc series is first in 14.3.0. A published 14.2.0 reports "Unknown type `hlc`", draws no series, and its
// applyTransaction() never settles, which holds the run for the whole per-example timeout. Skip it on such a base.
const HLC_MIN_VERSION = '14.3.0';
const hlcSupported = !isReleaseBelow(VERSION, HLC_MIN_VERSION);

type Datum = {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

class HighFrequencyHlcGenerator {
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

const dataGenerator = new HighFrequencyHlcGenerator();
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
        y: {
            type: 'number',
            label: {
                formatter: (params) => `$${params.value.toFixed(2)}`,
            },
        },
    },
    series: [
        {
            type: 'hlc',
            xKey: 'timestamp',
            highKey: 'high',
            lowKey: 'low',
            closeKey: 'close',
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

type TestCases = BenchmarkConfig['testCases'];

/** inScope */
function whereHlcSupported(testCases: TestCases): TestCases {
    return testCases.map((testCase) => ({
        ...testCase,
        variants: testCase.variants.map((variant) => ({ ...variant, available: hlcSupported })),
    }));
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    return {
        warnings: hlcSupported ? undefined : [`Skipped (the hlc series requires >= ${HLC_MIN_VERSION})`],
        testCases: whereHlcSupported([
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
        ]),
        config: {
            updatesPerTest: 100,
            maxCollectionTimeMs: 10000,
            warmupUpdates: 10,
        },
        metadata: {
            initialDataPoints: INITIAL_POINTS,
            batchSize: BATCH_SIZE,
            dataIntervalMs: DATA_INTERVAL_MS,
            seriesType: 'hlc',
            version: VERSION,
            // Compared with a published base only when that base has the hlc series.
            minVersion: HLC_MIN_VERSION,
            expectedRetainedSizeMB: undefined,
            expectedCanvasCount: 3,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
