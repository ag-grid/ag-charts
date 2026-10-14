// @ag-skip-fws
/* @ag-options-extract */
import { AgCartesianChartOptions, AgChartInstance, AgCharts, VERSION } from 'ag-charts-enterprise';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';

// Live dashboard heatmap: categorical x (time) and y (band), coloured by `level` through the colour scale.
// 60 columns x 208 bands = 12,480 cells is the reference size.
const COLUMNS = 60;
const REFERENCE_ROWS = 208;

type Datum = { id: string; time: string; band: string; level: number };

type Styling = 'colour scale' | 'itemStyler';

interface HeatmapState {
    columns: number;
    rows: number;
    styling: Styling;
    withIds: boolean;
}

const baseOptions: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    animation: { enabled: false },
};

/** inScope */
function createOptions(state: HeatmapState, data: Datum[]): AgCartesianChartOptions {
    return {
        ...baseOptions,
        title: { text: `Heatmap with ${state.columns * state.rows} cells` },
        legend: { enabled: false },
        dataIdKey: state.withIds ? 'id' : undefined,
        data,
        series: [
            {
                type: 'heatmap',
                xKey: 'time',
                yKey: 'band',
                colorKey: 'level',
                itemStyler:
                    state.styling === 'itemStyler'
                        ? ({ datum }) => ({ fillOpacity: datum.level > 90 ? 0.6 : 1 })
                        : undefined,
            },
        ],
    };
}
/* @ag-options-end */

// dataIdKey (needed for applyTransaction() on a heatmap) was added in 13.1.0
const DATA_ID_MIN_VERSION = '13.1.0';

let chart: AgChartInstance | null = null;
let state: HeatmapState | null = null;
let data: Datum[] = [];
let seed = 0;
let titleCount = 0;

/** inScope */
function level(x: number, y: number, s: number): number {
    return (Math.sin(x / 5 + y / 9 + s) + 1) * 50;
}

/** inScope */
function generateData(columns: number, rows: number, s: number): Datum[] {
    const result: Datum[] = [];
    for (let x = 0; x < columns; ++x) {
        for (let y = 0; y < rows; ++y) {
            result.push({ id: `${x}:${y}`, time: `T${x}`, band: `B${y}`, level: level(x, y, s) });
        }
    }
    return result;
}

/** inScope */
async function ensureChart(next: HeatmapState): Promise<AgChartInstance> {
    if (
        chart != null &&
        state != null &&
        state.columns === next.columns &&
        state.rows === next.rows &&
        state.styling === next.styling &&
        state.withIds === next.withIds
    ) {
        return chart;
    }
    chart?.destroy();
    state = next;
    seed = 0;
    data = generateData(next.columns, next.rows, seed);
    chart = AgCharts.create(createOptions(next, data));
    await chart.waitForUpdate();
    return chart;
}

/** inScope */
async function timeUpdate(target: AgChartInstance, update: () => Promise<unknown>): Promise<number> {
    const start = performance.now();
    await update();
    await target.waitForUpdate();
    return performance.now() - start;
}

/** inScope */
async function performFullUpdate(next: HeatmapState): Promise<number> {
    const target = await ensureChart(next);
    data = generateData(next.columns, next.rows, ++seed);
    return timeUpdate(target, () => target.updateDelta({ data }));
}

/** inScope */
async function performPartialUpdate(next: HeatmapState, changed: number): Promise<number> {
    const target = await ensureChart(next);
    const s = ++seed;
    const offset = (s * next.rows) % data.length;
    const update: Datum[] = [];
    for (let i = 0; i < changed; ++i) {
        const index = (offset + i) % data.length;
        const x = Math.floor(index / next.rows);
        const y = index % next.rows;
        const datum = { id: `${x}:${y}`, time: `T${x}`, band: `B${y}`, level: level(x, y, s) };
        data[index] = datum;
        update.push(datum);
    }
    return timeUpdate(target, () => target.applyTransaction({ update }));
}

/** inScope */
async function performNoMoveRedraw(next: HeatmapState, change: 'same data' | 'title'): Promise<number> {
    const target = await ensureChart(next);
    if (change === 'same data') {
        data = generateData(next.columns, next.rows, seed);
        return timeUpdate(target, () => target.updateDelta({ data }));
    }
    return timeUpdate(target, () => target.updateDelta({ title: { text: `Heatmap title ${++titleCount}` } }));
}

/** inScope */
function cellLabel(columns: number, rows: number): string {
    return (columns * rows).toLocaleString('en-GB');
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    const sizes = [
        { columns: COLUMNS, rows: 52 },
        { columns: COLUMNS, rows: REFERENCE_ROWS },
        { columns: COLUMNS * 2, rows: REFERENCE_ROWS },
    ];
    const reference: HeatmapState = { columns: COLUMNS, rows: REFERENCE_ROWS, styling: 'colour scale', withIds: false };
    const referenceWithIds: HeatmapState = { ...reference, withIds: true };
    const referenceCells = COLUMNS * REFERENCE_ROWS;
    const fractions = [
        { label: '1 column', changed: REFERENCE_ROWS },
        { label: '10%', changed: Math.round(referenceCells * 0.1) },
        { label: '50%', changed: Math.round(referenceCells * 0.5) },
        { label: '100%', changed: referenceCells },
    ];

    return {
        testCases: [
            {
                id: 'full-update',
                label: 'Full Update',
                variants: sizes.flatMap(({ columns, rows }) =>
                    (['colour scale', 'itemStyler'] as Styling[]).map((styling) => ({
                        params: { Cells: cellLabel(columns, rows), Styling: styling, Method: 'updateDelta()' },
                        run: () => performFullUpdate({ columns, rows, styling, withIds: false }),
                    }))
                ),
            },
            {
                id: 'partial-update',
                label: 'Partial Update',
                variants: [
                    ...fractions.map(({ label, changed }) => ({
                        params: {
                            Cells: cellLabel(COLUMNS, REFERENCE_ROWS),
                            Changed: label,
                            Method: 'applyTransaction()',
                        },
                        minVersion: DATA_ID_MIN_VERSION,
                        run: () => performPartialUpdate(referenceWithIds, changed),
                    })),
                    {
                        params: { Cells: cellLabel(COLUMNS, REFERENCE_ROWS), Changed: '100%', Method: 'updateDelta()' },
                        minVersion: DATA_ID_MIN_VERSION,
                        run: () => performFullUpdate(referenceWithIds),
                    },
                ],
            },
            {
                id: 'no-move-redraw',
                label: 'No-Move Redraw',
                variants: [
                    {
                        params: { Cells: cellLabel(COLUMNS, REFERENCE_ROWS), Change: 'same data' },
                        run: () => performNoMoveRedraw(reference, 'same data'),
                    },
                    {
                        params: { Cells: cellLabel(COLUMNS, REFERENCE_ROWS), Change: 'title' },
                        run: () => performNoMoveRedraw(reference, 'title'),
                    },
                    {
                        params: { Cells: cellLabel(COLUMNS, REFERENCE_ROWS), Change: 'colour only (new values)' },
                        run: () => performFullUpdate(reference),
                    },
                ],
            },
        ],
        config: {
            updatesPerTest: 30,
            maxCollectionTimeMs: 6000,
            warmupUpdates: 5,
        },
        metadata: {
            seriesType: 'heatmap',
            referenceCells,
            version: VERSION,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
