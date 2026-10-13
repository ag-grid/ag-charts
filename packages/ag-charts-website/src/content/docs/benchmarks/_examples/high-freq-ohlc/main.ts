// @ag-skip-fws
/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts, AgDropShadowOptions, VERSION } from 'ag-charts-enterprise';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import {
    ChartRef,
    DataRef,
    isVersionStringAtOrAfter,
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

const chartRef: ChartRef = { current: AgCharts.create(options) };

type ShadowMode = 'off' | 'on' | 'spread';
type Variants = BenchmarkConfig['testCases'][number]['variants'];

// These variants time the series with its shadow off, on, and on with a `spread`. A shadow is blurred once per layer, so
// on and off should be close.
// The shadow `spread`, and the `shadow` of candlestick and OHLC series, are first in 14.3.0. Older releases ignore them, so
// they are skipped there, or they would do less work than this version does. Builds that still report 14.2.0 skip them too.
const SHADOW_MIN_VERSION = '14.3.0';
const SHADOWS: Record<'on' | 'spread', AgDropShadowOptions> = {
    on: { enabled: true, color: 'rgba(0, 0, 0, 0.5)', xOffset: 2, yOffset: 2, blur: 4 },
    spread: { enabled: true, color: 'rgba(0, 0, 0, 0.5)', xOffset: 2, yOffset: 2, blur: 4, spread: 2 },
};
const SHADOW_LABELS: Record<'on' | 'spread', string> = { on: 'On', spread: 'On, with spread' };

const shadowSeries = options.series![0] as { shadow?: AgDropShadowOptions };

let shadowMode: ShadowMode = 'off';

// Switches the series shadow, which is off unless set. Rebuilds the chart, outside the timing, once for each change of
// shadow, so that a variant's iterations carry on from one another, as they do without a shadow.
/** inScope */
async function prepareShadow(mode: ShadowMode): Promise<void> {
    if (mode === shadowMode) return;

    shadowMode = mode;
    if (mode === 'off') {
        delete shadowSeries.shadow;
    } else {
        shadowSeries.shadow = SHADOWS[mode];
    }
    // Each shadow starts from the same data, because the variants before it have appended to or removed from it.
    dataGenerator.reset();
    dataRef.data = dataGenerator.take(INITIAL_POINTS);
    options.data = dataRef.data;
    chartRef.current?.destroy();
    chartRef.current = AgCharts.create(options);
    await chartRef.current.waitForUpdate();
}

// The variants of a test case: as given, with the series shadow off, then again with it on and with a `spread`.
/** inScope */
function withShadowModes(variants: Variants): Variants {
    const withMode = (mode: ShadowMode, params?: Record<string, string>) =>
        variants.map((variant) => ({
            ...variant,
            params: { ...variant.params, ...params },
            // The later of the variant's own minimum and the one for the shadow.
            minVersion:
                mode !== 'off' &&
                (variant.minVersion == null || isVersionStringAtOrAfter(SHADOW_MIN_VERSION, variant.minVersion))
                    ? SHADOW_MIN_VERSION
                    : variant.minVersion,
            run: async () => {
                await prepareShadow(mode);
                return variant.run();
            },
        }));

    return [
        ...withMode('off'),
        ...(['on', 'spread'] as const).flatMap((mode) => withMode(mode, { Shadow: SHADOW_LABELS[mode] })),
    ];
}

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
                variants: withShadowModes([
                    {
                        params: { Operation: 'Chart Create' },
                        run: localPerformInitialLoad,
                    },
                ]),
            },
            {
                id: 'append-batch',
                label: 'Append Batch',
                minVersion: '12.3.0',
                variants: withShadowModes([
                    {
                        params: { Operation: `Append ${BATCH_SIZE} points` },
                        run: () => performAppend(chartRef.current!, dataRef, dataGenerator, BATCH_SIZE),
                    },
                ]),
            },
            {
                id: 'remove-batch',
                label: 'Remove Batch',
                minVersion: '12.3.0',
                variants: withShadowModes([
                    {
                        params: { Operation: `Remove ${BATCH_SIZE} points` },
                        run: () => performRemove(chartRef.current!, dataRef, BATCH_SIZE),
                    },
                ]),
            },
            {
                id: 'rolling-window',
                label: 'Rolling Window',
                variants: withShadowModes([
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
                ]),
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
            seriesType: 'ohlc',
            version: VERSION,
            expectedRetainedSizeMB: undefined,
            expectedCanvasCount: 3,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
