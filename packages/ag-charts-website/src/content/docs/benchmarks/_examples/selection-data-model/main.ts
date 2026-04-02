// @ag-skip-fws
import { AgCartesianChartOptions, AgCharts, VERSION } from 'ag-charts-community';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { ChartRef, DataRef, performRollingWindow } from './benchmarkUtils';

// Internal APIs — the example generator strips underscore-prefixed imports and references
// to the UMD global, so we access _ModuleSupport via an indirect window property lookup.
const _internalSupport = (window as Record<string, any>)['agChart' + 's']['_ModuleSupport'];
const DataSet = _internalSupport.DataSet;
const DataSetSelection = _internalSupport.DataSetSelection;

// Aggregation constants (from ag-charts-core/src/utils/aggregation.ts)
const AGG_SPAN = 5;
const AGG_INDEX_SELECTED = 4;

// --- Configuration ---

const INITIAL_POINTS = 100_000;
const BATCH_SIZE = 100;
const SELECTED_COUNT_SPARSE = 100;
const SELECTED_RANGE_SIZE = 50_000;
const DATA_INTERVAL_MS = 250;
const START_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0);
const AGG_BUCKET_COUNT = 1000;
const MULTI_SERIES_COUNT = 5;

// Result sink — prevents V8 from eliminating computed values
let benchmarkSink: any;

// --- Data generation ---

type Datum = {
    id: number;
    timestamp: number;
    value: number;
};

class SelectionBenchmarkDataGenerator {
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
            id: index,
            timestamp,
            value: Number((baseline + trend + volatility).toFixed(2)),
        };
    }
}

const dataGenerator = new SelectionBenchmarkDataGenerator();
dataGenerator.reset();
const dataRef: DataRef<Datum> = { data: dataGenerator.take(INITIAL_POINTS) };

// --- Chart with markers enabled for visual selection feedback ---

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: dataRef.data.slice(0, 2000), // Show 2K points for visible markers
    dataIdKey: 'id',
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
            title: { text: 'Value' },
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'timestamp',
            yKey: 'value',
            marker: { enabled: true, size: 6 },
            strokeWidth: 1,
        },
    ],
};

const chartRef: ChartRef = { current: AgCharts.create(options) };

// --- Helpers ---

function createSeededDataSet(size: number): InstanceType<typeof DataSet> {
    dataGenerator.reset();
    const data = dataGenerator.take(size);
    return new DataSet(data, 'id');
}

function selectEvenly(sel: InstanceType<typeof DataSetSelection>, length: number, count: number): void {
    const step = Math.max(1, Math.floor(length / count));
    for (let i = 0; i < length && count > 0; i += step, count--) {
        sel.select(i);
    }
}

function buildAggregationData(size: number, bucketCount: number) {
    const indexData = new Uint32Array(bucketCount * AGG_SPAN);
    const step = Math.floor(size / bucketCount);
    for (let i = 0; i < bucketCount; i++) {
        const base = i * AGG_SPAN;
        const startIdx = i * step;
        indexData[base + 0] = startIdx;
        indexData[base + 1] = startIdx + step - 1;
        indexData[base + 2] = startIdx + Math.floor(step / 3);
        indexData[base + 3] = startIdx + Math.floor((step * 2) / 3);
        indexData[base + AGG_INDEX_SELECTED] = 0;
    }
    return { indexData };
}

/** Access internal chart from the AgChartInstance proxy. */
function deproxy(chartInstance: any): any {
    return chartInstance?.chart ?? chartInstance;
}

/** Force the chart to re-run createNodeData and re-render. */
async function forceSeriesUpdate(chart: any): Promise<void> {
    for (const series of chart.series) {
        series.nodeDataRefresh = true;
    }
    // ChartUpdateType.SERIES_UPDATE = 7
    chart.update(7);
    await chartRef.current!.waitForUpdate();
}

// --- Benchmark functions ---

// ==================== ROLLING WINDOW ====================

/** Isolated selection overhead: run the same 100 transactions with and without selection. */
/** inScope */
async function rollingWindowDelta(): Promise<number> {
    // Baseline: no selection
    const dsBase = createSeededDataSet(INITIAL_POINTS);
    const genBase = new SelectionBenchmarkDataGenerator();
    genBase.reset();
    genBase.take(INITIAL_POINTS);

    const baseStart = performance.now();
    for (let i = 0; i < 100; i++) {
        const remove = dsBase.data.slice(0, BATCH_SIZE);
        const append = genBase.take(BATCH_SIZE);
        dsBase.addTransaction({ remove, append });
        dsBase.commitPendingTransactions();
    }
    const baseTime = performance.now() - baseStart;

    // With selection: 1 series, 50K selected
    const dsSel = createSeededDataSet(INITIAL_POINTS);
    const sel = dsSel.enableSelection('series-1');
    sel.selectRange(1000, 1000 + SELECTED_RANGE_SIZE);
    const genSel = new SelectionBenchmarkDataGenerator();
    genSel.reset();
    genSel.take(INITIAL_POINTS);

    const selStart = performance.now();
    for (let i = 0; i < 100; i++) {
        const remove = dsSel.data.slice(0, BATCH_SIZE);
        const append = genSel.take(BATCH_SIZE);
        dsSel.addTransaction({ remove, append });
        dsSel.commitPendingTransactions();
    }
    const selTime = performance.now() - selStart;

    // Return the DELTA — positive means selection added overhead
    return selTime - baseTime;
}

/** Multi-series rolling window: K series with active selection. */
/** inScope */
async function rollingWindowMultiSeries(): Promise<number> {
    const ds = createSeededDataSet(INITIAL_POINTS);
    for (let k = 0; k < MULTI_SERIES_COUNT; k++) {
        const sel = ds.enableSelection(`series-${k}`);
        sel.selectRange(k * 1000, k * 1000 + SELECTED_RANGE_SIZE);
    }

    const gen = new SelectionBenchmarkDataGenerator();
    gen.reset();
    gen.take(INITIAL_POINTS);

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
        const remove = ds.data.slice(0, BATCH_SIZE);
        const append = gen.take(BATCH_SIZE);
        ds.addTransaction({ remove, append });
        ds.commitPendingTransactions();
    }
    return performance.now() - start;
}

// ==================== applyToTypedArray ====================

/** Generate DISTINCT DataChangeDescriptions for each iteration (fixes V8 specialisation). */
/** inScope */
async function applyToTypedArrayDistinct(): Promise<number> {
    // Build 100 distinct DataChangeDescriptions from sequential transactions
    const descs: any[] = [];
    for (let i = 0; i < 100; i++) {
        const ds = createSeededDataSet(INITIAL_POINTS);
        const remove = ds.data.slice(i, i + BATCH_SIZE);
        const gen = new SelectionBenchmarkDataGenerator();
        gen.reset();
        gen.take(INITIAL_POINTS + i);
        const append = gen.take(BATCH_SIZE);
        ds.addTransaction({ remove, append });
        descs.push(ds.getChangeDescription());
    }

    const selArray = new Uint8Array(INITIAL_POINTS);
    selArray.fill(1, 1000, 1000 + SELECTED_RANGE_SIZE);

    const start = performance.now();
    let arr = selArray;
    for (let i = 0; i < 1000; i++) {
        arr = descs[i % descs.length].applyToTypedArray(arr);
    }
    benchmarkSink = arr;
    return performance.now() - start;
}

/** Non-contiguous removals — scattered deletions produce many block copies. */
/** inScope */
async function applyToTypedArrayScattered(): Promise<number> {
    const ds = createSeededDataSet(INITIAL_POINTS);
    // Remove 100 items scattered every 1000th position
    const itemsToRemove: Datum[] = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
        itemsToRemove.push(ds.data[i * Math.floor(INITIAL_POINTS / BATCH_SIZE)]);
    }
    ds.addTransaction({ remove: itemsToRemove });
    const changeDesc = ds.getChangeDescription()!;

    const selArray = new Uint8Array(INITIAL_POINTS);
    selArray.fill(1, 1000, 1000 + SELECTED_RANGE_SIZE);

    const start = performance.now();
    let arr = selArray;
    for (let i = 0; i < 1000; i++) {
        // Re-create source each time since scattered removals change array size
        arr = changeDesc.applyToTypedArray(selArray);
    }
    benchmarkSink = arr;
    return performance.now() - start;
}

// ==================== CLICK & RANGE ====================

/** inScope */
async function clickSelection(): Promise<number> {
    const sel = new DataSetSelection(INITIAL_POINTS);
    const start = performance.now();
    for (let i = 0; i < 100_000; i++) {
        sel.select(i % INITIAL_POINTS);
    }
    benchmarkSink = sel.getSelectedCount();
    return performance.now() - start;
}

/** Range selection with clear-then-set (realistic two-step pattern). */
/** inScope */
async function rangeSelectionWithClear(): Promise<number> {
    const sel = new DataSetSelection(INITIAL_POINTS);
    const start = performance.now();
    for (let i = 0; i < 1_000; i++) {
        sel.clear();
        const startIdx = (i * 97) % (INITIAL_POINTS - SELECTED_RANGE_SIZE);
        sel.selectRange(startIdx, startIdx + SELECTED_RANGE_SIZE);
    }
    benchmarkSink = sel.getSelectedCount();
    return performance.now() - start;
}

// ==================== RENDER LOOP ====================

/** Render lookup with globalThis sink to prevent DCE. */
/** inScope */
async function renderLoopLookup(): Promise<number> {
    const sel = new DataSetSelection(INITIAL_POINTS);
    selectEvenly(sel, INITIAL_POINTS, SELECTED_COUNT_SPARSE);
    const arr = sel.getSelection();
    const visibleCount = 2000;
    const step = Math.floor(INITIAL_POINTS / visibleCount);
    const indices = new Uint32Array(visibleCount);
    for (let i = 0; i < visibleCount; i++) {
        indices[i] = i * step;
    }

    // Accumulate results into an array to prevent loop elimination
    const results = new Uint32Array(1000);
    const start = performance.now();
    for (let frame = 0; frame < 1000; frame++) {
        let selected = 0;
        for (let i = 0; i < visibleCount; i++) {
            selected += arr[indices[i]];
        }
        results[frame] = selected;
    }
    benchmarkSink = results;
    return performance.now() - start;
}

// ==================== DATA REPLACEMENT ====================

/** Single replaceWith call with cold caches (realistic). */
/** inScope */
async function dataReplacementCold(): Promise<number> {
    dataGenerator.reset();
    dataGenerator.take(50_000);
    const newData = dataGenerator.take(INITIAL_POINTS);

    const start = performance.now();
    for (let i = 0; i < 10; i++) {
        // Fresh predecessor each iteration — cold idArrayCache, cold idToIndexMap
        const oldDs = createSeededDataSet(INITIAL_POINTS);
        const sel = oldDs.enableSelection('series-1');
        selectEvenly(sel, INITIAL_POINTS, SELECTED_COUNT_SPARSE);
        const sel2 = oldDs.enableSelection('series-2');
        sel2.selectRange(500, 2000);

        const newDs = DataSet.replaceWith(oldDs, newData, 'id');
        benchmarkSink = newDs.selections.size;
    }
    return performance.now() - start;
}

// ==================== AGGREGATION ====================

/** inScope */
async function aggregationBucketSelection(): Promise<number> {
    const sel = new DataSetSelection(INITIAL_POINTS);
    selectEvenly(sel, INITIAL_POINTS, SELECTED_COUNT_SPARSE);
    const selArr = sel.getSelection();
    const { indexData } = buildAggregationData(INITIAL_POINTS, AGG_BUCKET_COUNT);

    const start = performance.now();
    for (let iter = 0; iter < 1_000; iter++) {
        // Inline computeBucketSelection (now a standalone fn in ag-charts-core/aggregation.ts)
        for (let i = 0; i < AGG_BUCKET_COUNT; i++) {
            const base = i * AGG_SPAN;
            let selected = 0;
            for (let j = 0; j < AGG_INDEX_SELECTED; j++) {
                const idx = indexData[base + j];
                if (idx < selArr.length) selected |= selArr[idx];
            }
            indexData[base + AGG_INDEX_SELECTED] = selected;
        }
    }
    benchmarkSink = indexData[AGG_INDEX_SELECTED];
    return performance.now() - start;
}

// ==================== MATERIALISATION ====================

/** inScope */
async function getSelectedIndicesBenchmark(): Promise<number> {
    const sel = new DataSetSelection(INITIAL_POINTS);
    selectEvenly(sel, INITIAL_POINTS, SELECTED_COUNT_SPARSE);

    const start = performance.now();
    for (let i = 0; i < 1_000; i++) {
        benchmarkSink = sel.getSelectedIndices();
    }
    return performance.now() - start;
}

// ==================== VISUAL INTEGRATION ====================

/**
 * Visual integration: enable selection on the chart's DataSet, select a range,
 * and trigger a re-render. The line series reads from DataSetSelection.getSelection()
 * as selectionValues — selected markers render at full opacity, unselected dim.
 */
/** inScope */
async function visualSelectRange(): Promise<number> {
    const chart = deproxy(chartRef.current!);
    const ds = chart.data;
    const seriesId = chart.series[0]?.id;
    if (!ds || !seriesId) return 0;

    const sel = ds.enableSelection(seriesId);

    const start = performance.now();
    // Select the middle third of visible data
    const len = ds.data.length;
    sel.clear();
    sel.selectRange(Math.floor(len / 3), Math.floor((len * 2) / 3));

    await forceSeriesUpdate(chart);
    return performance.now() - start;
}

/**
 * Visual integration: toggle selection on/off rapidly, measuring render cost.
 */
/** inScope */
async function visualToggleSelection(): Promise<number> {
    const chart = deproxy(chartRef.current!);
    const ds = chart.data;
    const seriesId = chart.series[0]?.id;
    if (!ds || !seriesId) return 0;

    const sel = ds.enableSelection(seriesId);
    const len = ds.data.length;

    const start = performance.now();
    for (let i = 0; i < 20; i++) {
        // Alternate between selecting a range and clearing
        if (i % 2 === 0) {
            sel.selectRange(0, Math.floor(len / 2));
        } else {
            sel.clear();
        }
        await forceSeriesUpdate(chart);
    }
    return performance.now() - start;
}

/**
 * Visual integration: rolling window with active selection on the live chart.
 * Selection tracks with the data as transactions shift indices.
 */
/** inScope */
async function visualRollingWindowWithSelection(): Promise<number> {
    const chart = deproxy(chartRef.current!);
    const ds = chart.data;
    const seriesId = chart.series[0]?.id;
    if (!ds || !seriesId) return 0;

    // Select a range in the middle — selection will track through index shifts
    const sel = ds.enableSelection(seriesId);
    const len = ds.data.length;
    sel.selectRange(Math.floor(len / 4), Math.floor((len * 3) / 4));

    // Force initial render with selection visible
    await forceSeriesUpdate(chart);

    // Now run the rolling window — applyToTypedArray keeps selection in sync
    return performRollingWindow(chartRef.current!, dataRef, dataGenerator, 50, 'applyTransaction');
}

// --- Benchmark configuration ---

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    return {
        testCases: [
            {
                id: 'rolling-window-delta',
                label: 'Rolling Window Δ (baseline vs selection)',
                variants: [
                    {
                        params: { Scenario: '100 txns, 1 series, 50K selected' },
                        run: rollingWindowDelta,
                    },
                ],
            },
            {
                id: 'rolling-window-multi-series',
                label: `Rolling Window (${MULTI_SERIES_COUNT} series)`,
                variants: [
                    {
                        params: { Scenario: `${MULTI_SERIES_COUNT} series × 50K selected` },
                        run: rollingWindowMultiSeries,
                    },
                ],
            },
            {
                id: 'apply-typed-array',
                label: 'applyToTypedArray (1000×)',
                variants: [
                    {
                        params: { Scenario: 'Distinct change descs, contiguous removals' },
                        run: applyToTypedArrayDistinct,
                    },
                    {
                        params: { Scenario: 'Scattered removals (100 positions)' },
                        run: applyToTypedArrayScattered,
                    },
                ],
            },
            {
                id: 'click-selection',
                label: 'Click Selection (100K×)',
                variants: [
                    {
                        params: { Scenario: 'O(1) select' },
                        run: clickSelection,
                    },
                ],
            },
            {
                id: 'range-selection',
                label: 'Range Selection (1000×)',
                variants: [
                    {
                        params: { Scenario: '50K range, clear + fill' },
                        run: rangeSelectionWithClear,
                    },
                ],
            },
            {
                id: 'render-lookup',
                label: 'Render Loop Lookup (1000 frames)',
                variants: [
                    {
                        params: { Scenario: '2000 datums/frame' },
                        run: renderLoopLookup,
                    },
                ],
            },
            {
                id: 'data-replacement',
                label: 'Data Replacement (10×, cold caches)',
                variants: [
                    {
                        params: { Scenario: '100K items, 2 series, 50% overlap' },
                        run: dataReplacementCold,
                    },
                ],
            },
            {
                id: 'bucket-selection',
                label: 'Bucket Selection (1000×)',
                variants: [
                    {
                        params: { Scenario: `${AGG_BUCKET_COUNT} buckets` },
                        run: aggregationBucketSelection,
                    },
                ],
            },
            {
                id: 'get-selected-indices',
                label: 'getSelectedIndices (1000×)',
                variants: [
                    {
                        params: { Scenario: '100 sparse selections' },
                        run: getSelectedIndicesBenchmark,
                    },
                ],
            },
            {
                id: 'visual-select-range',
                label: 'Visual: Select Range + Render',
                variants: [
                    {
                        params: { Scenario: 'Select middle third, re-render' },
                        run: visualSelectRange,
                    },
                ],
            },
            {
                id: 'visual-toggle',
                label: 'Visual: Toggle Selection (20×)',
                variants: [
                    {
                        params: { Scenario: 'Select/clear + re-render' },
                        run: visualToggleSelection,
                    },
                ],
            },
            {
                id: 'visual-rolling-window',
                label: 'Visual: Rolling Window + Selection',
                variants: [
                    {
                        params: { Scenario: 'Selection tracks through txns' },
                        run: visualRollingWindowWithSelection,
                    },
                ],
            },
        ],
        config: {
            updatesPerTest: 20,
            maxCollectionTimeMs: 15000,
            warmupUpdates: 3,
        },
        metadata: {
            initialDataPoints: INITIAL_POINTS,
            batchSize: BATCH_SIZE,
            selectedCountSparse: SELECTED_COUNT_SPARSE,
            selectedRangeSize: SELECTED_RANGE_SIZE,
            multiSeriesCount: MULTI_SERIES_COUNT,
            aggregationBuckets: AGG_BUCKET_COUNT,
            version: VERSION,
            expectedRetainedSizeMB: undefined,
            expectedCanvasCount: 3,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
