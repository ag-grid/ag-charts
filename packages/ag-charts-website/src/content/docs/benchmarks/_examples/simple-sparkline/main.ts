// @ag-skip-fws
// @ag-skip-container-check
/* @ag-options-extract */
import { AgCharts, type AgSparklineOptions, VERSION } from 'ag-charts-community';
import { AgChartInstance } from 'ag-charts-community';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { getData } from './data';
import { random } from './randomHelpers';

// (window as any).agChartsDebug = 'scene:stats';

// No `theme` block: theme overrides resolve differently across the versions this
// benchmark is used to compare, so head-vs-base numbers would not be comparable.
// Grid styles sparklines through top-level options anyway.
const options: AgSparklineOptions = {
    container: document.getElementById('myChart'),
    background: {
        visible: false,
    },
    minHeight: 0,
    minWidth: 0,
    type: 'line',
    data: getData(),
    xKey: 'x',
    yKey: 'y',
    width: 708,
    height: 47,
};
/* @ag-options-end */

// Nearly half of the documented Grid sparkline configurations put a function in options
// (itemStyler, tooltip.renderer, formatter). A function anywhere in the options tree
// disables the per-chart structural cache, so every measured operation is run both ways.
const optionsWithStyler: AgSparklineOptions = {
    ...options,
    marker: {
        enabled: true,
        size: 0,
        itemStyler: (params) => (params.highlightState === 'highlighted-item' ? { size: 7 } : undefined),
    },
};

const chart = AgCharts.__createSparkline(options);

const charts: AgChartInstance<AgSparklineOptions>[] = [];
/** inScope */
async function performSingleCreation(): Promise<number> {
    const container = document.getElementById('myChart');
    if (!container) return 0;

    const start = performance.now();

    charts.push(
        AgCharts.__createSparkline({
            ...options,
            container,
        })
    );
    await charts.at(-1)!.waitForUpdate();

    return performance.now() - start;
}

// Typical viewport for a Grid sparkline column. Grid calls createSparkline() synchronously
// per cell with no per-cell rAF, so all N charts batch into a single frame.
const GRID_BATCH_SIZE = 50;

/** inScope */
async function performGridBatchCreation(batchOptions: AgSparklineOptions): Promise<number> {
    const containers: HTMLElement[] = [];
    for (let i = 0; i < GRID_BATCH_SIZE; i++) {
        containers.push(document.createElement('div'));
    }
    const created: AgChartInstance<AgSparklineOptions>[] = [];

    const start = performance.now();
    performance.mark('grid-batch:create:start');

    for (let i = 0; i < GRID_BATCH_SIZE; i++) {
        created.push(
            AgCharts.__createSparkline({
                ...batchOptions,
                container: containers[i],
            })
        );
    }

    performance.mark('grid-batch:create:end');
    try {
        performance.measure('grid-batch:create', 'grid-batch:create:start', 'grid-batch:create:end');
    } catch {
        // measure can throw if marks were cleared mid-run
    }

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const elapsed = performance.now() - start;

    // Destroy per-iteration so each iter measures fresh cold creation.
    created.forEach((c) => c.destroy());

    return elapsed;
}

// A cell's chart instance outlives a value/size change, so the batches below are built once
// per test case and reused across iterations. Plain and styler batches coexist because the
// harness runs setup() once for all variants of a test case.
interface ChartBatch {
    options: AgSparklineOptions;
    charts: AgChartInstance<AgSparklineOptions>[];
}

const plainBatch: ChartBatch = { options, charts: [] };
const stylerBatch: ChartBatch = { options: optionsWithStyler, charts: [] };

/** inScope */
function fillBatch(batch: ChartBatch): void {
    for (let i = 0; i < GRID_BATCH_SIZE; i++) {
        batch.charts.push(
            AgCharts.__createSparkline({
                ...batch.options,
                container: document.createElement('div'),
            })
        );
    }
}

/** inScope */
function clearBatch(batch: ChartBatch): void {
    batch.charts.forEach((c) => c.destroy());
    batch.charts.length = 0;
}

/** inScope */
function setupBatches(): void {
    clearBatch(plainBatch);
    clearBatch(stylerBatch);
    fillBatch(plainBatch);
    fillBatch(stylerBatch);
}

/** inScope */
function teardownBatches(): void {
    clearBatch(plainBatch);
    clearBatch(stylerBatch);
}

/** inScope */
async function performGridBatchUpdate(batch: ChartBatch): Promise<number> {
    if (batch.charts.length === 0) return 0;

    const newData = getData().map((d) => ({ ...d, y: d.y * (0.8 + random() * 0.4) }));

    const start = performance.now();
    performance.mark('grid-batch:update:start');

    // Grid does not await the per-cell update() — the whole batch lands in one frame.
    for (const batchChart of batch.charts) {
        void batchChart.update({ ...batch.options, data: newData });
    }

    performance.mark('grid-batch:update:end');
    try {
        performance.measure('grid-batch:update', 'grid-batch:update:start', 'grid-batch:update:end');
    } catch {
        // measure can throw if marks were cleared mid-run
    }

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    return performance.now() - start;
}

let resizeTick = 0;

/** inScope */
async function performGridBatchResize(batch: ChartBatch): Promise<number> {
    if (batch.charts.length === 0) return 0;

    // Swept rather than alternated so consecutive iterations never re-present a size
    // already seen, which would let a size-keyed cache absorb the work under measurement.
    resizeTick++;
    const width = 608 + (resizeTick % 100);
    const height = 40 + (resizeTick % 8);

    const start = performance.now();
    performance.mark('grid-batch:resize:start');

    for (const batchChart of batch.charts) {
        void batchChart.update({ ...batch.options, width, height });
    }

    performance.mark('grid-batch:resize:end');
    try {
        performance.measure('grid-batch:resize', 'grid-batch:resize:start', 'grid-batch:resize:end');
    } catch {
        // measure can throw if marks were cleared mid-run
    }

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    return performance.now() - start;
}

/** inScope */
async function performGridScrollChurn(batch: ChartBatch): Promise<number> {
    if (batch.charts.length === 0) return 0;

    const start = performance.now();
    performance.mark('grid-batch:churn:start');

    // Scrolling tears down and re-creates cells interleaved, within a single frame.
    for (let i = 0; i < batch.charts.length; i++) {
        batch.charts[i].destroy();
        batch.charts[i] = AgCharts.__createSparkline({
            ...batch.options,
            container: document.createElement('div'),
        });
    }

    performance.mark('grid-batch:churn:end');
    try {
        performance.measure('grid-batch:churn', 'grid-batch:churn:start', 'grid-batch:churn:end');
    } catch {
        // measure can throw if marks were cleared mid-run
    }

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    return performance.now() - start;
}

/** inScope */
async function performPooledCreation(): Promise<number> {
    const start = performance.now();

    const newChart = AgCharts.__createSparkline({
        ...options,
        container: document.createElement('div'),
    });
    await newChart.waitForUpdate();

    const result = performance.now() - start;
    newChart.destroy();
    return result;
}

/** inScope */
async function performDataUpdate(): Promise<number> {
    const newData = getData().map((d) => ({ ...d, y: d.y * (0.8 + random() * 0.4) }));

    const start = performance.now();
    await chart.update({ ...options, data: newData });
    await chart.waitForUpdate();
    return performance.now() - start;
}

/** inScope */
async function performDeltaUpdate(): Promise<number> {
    const newData = getData().map((d) => ({ ...d, y: d.y * (0.8 + random() * 0.4) }));

    const start = performance.now();
    await chart.updateDelta({ data: newData });
    await chart.waitForUpdate();
    return performance.now() - start;
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    return {
        testCases: [
            {
                id: 'cold-creation',
                label: 'Cold Creation (single, per-frame)',
                variants: [
                    {
                        params: { Operation: 'Create Sparkline' },
                        run: performSingleCreation,
                    },
                ],
                teardown: () => {
                    charts.forEach((chart) => chart.destroy());
                    charts.length = 0;
                },
            },
            {
                id: 'grid-batch-creation',
                label: `Cold Creation (batch of ${GRID_BATCH_SIZE})`,
                variants: [
                    {
                        params: { Operation: `Create ${GRID_BATCH_SIZE} Sparklines`, Options: 'plain' },
                        run: () => performGridBatchCreation(options),
                    },
                    {
                        params: { Operation: `Create ${GRID_BATCH_SIZE} Sparklines`, Options: 'itemStyler' },
                        run: () => performGridBatchCreation(optionsWithStyler),
                    },
                ],
            },
            {
                id: 'grid-batch-update',
                label: `Data Update (batch of ${GRID_BATCH_SIZE})`,
                setup: setupBatches,
                teardown: teardownBatches,
                variants: [
                    {
                        params: { Operation: `Update ${GRID_BATCH_SIZE} Sparklines`, Options: 'plain' },
                        run: () => performGridBatchUpdate(plainBatch),
                    },
                    {
                        params: { Operation: `Update ${GRID_BATCH_SIZE} Sparklines`, Options: 'itemStyler' },
                        run: () => performGridBatchUpdate(stylerBatch),
                    },
                ],
            },
            {
                id: 'grid-batch-resize',
                label: `Resize (batch of ${GRID_BATCH_SIZE})`,
                setup: setupBatches,
                teardown: teardownBatches,
                variants: [
                    {
                        params: { Operation: `Resize ${GRID_BATCH_SIZE} Sparklines`, Options: 'plain' },
                        run: () => performGridBatchResize(plainBatch),
                    },
                    {
                        params: { Operation: `Resize ${GRID_BATCH_SIZE} Sparklines`, Options: 'itemStyler' },
                        run: () => performGridBatchResize(stylerBatch),
                    },
                ],
            },
            {
                id: 'grid-scroll-churn',
                label: `Scroll Churn (batch of ${GRID_BATCH_SIZE})`,
                setup: setupBatches,
                teardown: teardownBatches,
                variants: [
                    {
                        params: { Operation: `Recycle ${GRID_BATCH_SIZE} Sparklines`, Options: 'plain' },
                        run: () => performGridScrollChurn(plainBatch),
                    },
                    {
                        params: { Operation: `Recycle ${GRID_BATCH_SIZE} Sparklines`, Options: 'itemStyler' },
                        run: () => performGridScrollChurn(stylerBatch),
                    },
                ],
            },
            {
                id: 'pooled-creation',
                label: 'Warm Creation',
                variants: [
                    {
                        params: { Operation: 'Create Sparkline' },
                        run: performPooledCreation,
                    },
                ],
            },
            {
                id: 'data-update',
                label: 'Data Update',
                variants: [
                    {
                        params: { Operation: 'Full Update' },
                        run: performDataUpdate,
                    },
                ],
            },
            {
                id: 'delta-update',
                label: 'Delta Update',
                variants: [
                    {
                        params: { Operation: 'Delta Update' },
                        run: performDeltaUpdate,
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
            dataPoints: getData().length,
            seriesCount: 1,
            version: VERSION,
            expectedRetainedSizeMB: 2,
            expectedCanvasCount: 3,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
