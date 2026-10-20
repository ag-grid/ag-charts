// @ag-skip-fws
/* @ag-options-extract */
import { AgCartesianChartOptions, AgChartInstance, AgCharts, VERSION } from 'ag-charts-enterprise';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';

type SeriesKind = 'bar' | 'range-bar' | 'waterfall';
type Change = 'same data' | 'title' | 'colour only' | 'moved';

type Datum = { category: string; value: number; low: number; high: number };

interface RectState {
    kind: SeriesKind;
    bars: number;
    crisp?: boolean;
}

const FILLS = ['#2e86de', '#e67e22'];

/** inScope */
function generateData(bars: number, shift: number): Datum[] {
    const result: Datum[] = [];
    for (let i = 0; i < bars; ++i) {
        const value = 10 + ((i + shift) % 17);
        result.push({ category: `C${i}`, value: i % 3 === 0 ? -value / 2 : value, low: value / 2, high: value });
    }
    return result;
}

/** inScope */
function createSeries(state: RectState, fill: string): AgCartesianChartOptions['series'] {
    switch (state.kind) {
        case 'bar':
            return [{ type: 'bar', xKey: 'category', yKey: 'value', fill, crisp: state.crisp }];
        case 'range-bar':
            return [{ type: 'range-bar', xKey: 'category', yLowKey: 'low', yHighKey: 'high', fill }];
        case 'waterfall':
            return [{ type: 'waterfall', xKey: 'category', yKey: 'value', item: { positive: { fill } } }];
    }
}

const baseOptions: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    animation: { enabled: false },
};

/** inScope */
function createOptions(state: RectState, data: Datum[], fill: string): AgCartesianChartOptions {
    return {
        ...baseOptions,
        title: { text: `${state.kind} chart with ${state.bars} bars` },
        legend: { enabled: false },
        data,
        series: createSeries(state, fill),
        axes: { x: { type: 'category', label: { enabled: false } }, y: { type: 'number' } },
    };
}
/* @ag-options-end */

let chart: AgChartInstance | null = null;
let state: RectState | null = null;
let shift = 0;
let fillIndex = 0;
let titleCount = 0;

/** inScope */
async function ensureChart(next: RectState): Promise<AgChartInstance> {
    if (chart != null && state?.kind === next.kind && state.bars === next.bars && state.crisp === next.crisp) {
        return chart;
    }
    await createChart(next);
    return chart!;
}

/** inScope */
async function createChart(next: RectState): Promise<void> {
    chart?.destroy();
    state = next;
    shift = 0;
    fillIndex = 0;
    chart = AgCharts.create(createOptions(next, generateData(next.bars, shift), FILLS[fillIndex]));
    await chart.waitForUpdate();
}

/** inScope */
async function timeUpdate(target: AgChartInstance, update: () => Promise<unknown>): Promise<number> {
    const start = performance.now();
    await update();
    await target.waitForUpdate();
    return performance.now() - start;
}

/** inScope */
async function performRedraw(next: RectState, change: Change): Promise<number> {
    const target = await ensureChart(next);
    switch (change) {
        case 'same data': {
            const data = generateData(next.bars, shift);
            return timeUpdate(target, () => target.updateDelta({ data }));
        }
        case 'title':
            return timeUpdate(target, () =>
                target.updateDelta({ title: { text: `${next.kind} chart title ${++titleCount}` } })
            );
        case 'colour only':
            fillIndex = (fillIndex + 1) % FILLS.length;
            return timeUpdate(target, () => target.updateDelta({ series: createSeries(next, FILLS[fillIndex]) }));
        case 'moved': {
            const data = generateData(next.bars, ++shift);
            return timeUpdate(target, () => target.updateDelta({ data }));
        }
    }
}

/** inScope */
function nextFrame(): Promise<void> {
    // Falls back to a timer so a throttled or hidden page cannot stall the run on requestAnimationFrame.
    const frames = new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const fallback = new Promise<void>((resolve) => setTimeout(resolve, 1000));
    return Promise.race([frames, fallback]);
}

/** inScope */
function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = sorted.length >> 1;
    return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** inScope */
function readPixels(): Uint8ClampedArray[] {
    const canvases = Array.from(document.querySelectorAll<HTMLCanvasElement>('#myChart canvas'));
    return canvases.map((canvas) => canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data);
}

/** inScope */
function countChangedPixels(before: Uint8ClampedArray[], after: Uint8ClampedArray[]): number {
    let changed = 0;
    for (let c = 0; c < Math.max(before.length, after.length); ++c) {
        const a = before[c];
        const b = after[c];
        if (a == null || b == null || a.length !== b.length) {
            changed += Math.max(a?.length ?? 0, b?.length ?? 0) / 4;
            continue;
        }
        for (let i = 0; i < a.length; i += 4) {
            if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) {
                changed++;
            }
        }
    }
    return changed;
}

const WARMUP_UPDATES = 5;
const UPDATES_PER_TEST = 30;
// The harness calls a variant once per warmup and once per measured update.
const SAMPLES_PER_RUN = WARMUP_UPDATES + UPDATES_PER_TEST;

const pixelStability: Record<string, { firstRedraw: number[]; secondRedraw: number[] }> = {};

// Recreates the chart each iteration: the instability only shows on the first redraw after creation.
// Pixel counts are recorded in metadata.pixelStability; the returned time is the first redraw.
/** inScope */
async function performPixelStability(label: string, next: RectState): Promise<number> {
    await createChart(next);
    await nextFrame();
    const initial = readPixels();

    const firstData = generateData(next.bars, shift);
    const elapsed = await timeUpdate(chart!, () => chart!.updateDelta({ data: firstData }));
    await nextFrame();
    const afterFirst = readPixels();

    await chart!.updateDelta({ data: generateData(next.bars, shift) });
    await chart!.waitForUpdate();
    await nextFrame();
    const afterSecond = readPixels();

    const samples = (pixelStability[label] ??= { firstRedraw: [], secondRedraw: [] });
    if (samples.firstRedraw.length >= SAMPLES_PER_RUN) {
        // A previous run of this variant completed, so this call starts a new one: drop only its own counts.
        samples.firstRedraw.length = 0;
        samples.secondRedraw.length = 0;
    }
    pixelStability[label].firstRedraw.push(countChangedPixels(initial, afterFirst));
    pixelStability[label].secondRedraw.push(countChangedPixels(afterFirst, afterSecond));
    return elapsed;
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    const changes: Change[] = ['same data', 'title', 'colour only', 'moved'];
    const shapes: RectState[] = [
        { kind: 'bar', bars: 500 },
        { kind: 'bar', bars: 5000 },
        { kind: 'range-bar', bars: 500 },
        { kind: 'waterfall', bars: 500 },
    ];
    const stabilityCases: { label: string; state: RectState }[] = [
        { label: '500 bars, crisp auto', state: { kind: 'bar', bars: 500 } },
        { label: '50 bars, crisp false', state: { kind: 'bar', bars: 50, crisp: false } },
        { label: '50 bars, crisp auto (control)', state: { kind: 'bar', bars: 50 } },
    ];

    return {
        testCases: [
            {
                id: 'no-move-redraw',
                label: 'No-Move Redraw',
                variants: shapes.flatMap((shape) =>
                    changes.map((change) => ({
                        params: { Series: shape.kind, Bars: String(shape.bars), Change: change },
                        // Requires >= 13.0.0: keyed `axes` options (12.x takes an array). Gated per variant, as
                        // a test case with no available variants still completes, but no test cases never does.
                        minVersion: '13.0.0',
                        run: () => performRedraw(shape, change),
                    }))
                ),
            },
            {
                id: 'pixel-stability',
                label: 'Pixel Stability (first vs second identical redraw)',
                variants: stabilityCases.map(({ label, state: s }) => ({
                    params: { Series: s.kind, Bars: String(s.bars), Case: label },
                    minVersion: '13.0.0',
                    run: () => performPixelStability(label, s),
                })),
            },
        ],
        config: {
            updatesPerTest: UPDATES_PER_TEST,
            maxCollectionTimeMs: 6000,
            warmupUpdates: WARMUP_UPDATES,
        },
        metadata: {
            version: VERSION,
            // Keyed `axes` need 13.0.0+, so the compare step skips this example on an older published base.
            minVersion: '13.0.0',
            pixelStability,
        },
        onComplete: async () => {
            console.table(
                Object.entries(pixelStability).map(([label, { firstRedraw, secondRedraw }]) => ({
                    label,
                    firstRedrawMedianChangedPixels: median(firstRedraw),
                    secondRedrawMedianChangedPixels: median(secondRedraw),
                    secondRedrawNonZeroSamples: secondRedraw.filter((count) => count > 0).length,
                }))
            );
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
