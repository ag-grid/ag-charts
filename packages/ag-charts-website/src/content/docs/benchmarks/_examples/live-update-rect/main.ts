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
        case 'same data':
            return timeUpdate(target, () => target.updateDelta({ data: generateData(next.bars, shift) }));
        case 'title':
            return timeUpdate(target, () =>
                target.updateDelta({ title: { text: `${next.kind} chart title ${++titleCount}` } })
            );
        case 'colour only':
            fillIndex = (fillIndex + 1) % FILLS.length;
            return timeUpdate(target, () => target.updateDelta({ series: createSeries(next, FILLS[fillIndex]) }));
        case 'moved':
            return timeUpdate(target, () => target.updateDelta({ data: generateData(next.bars, ++shift) }));
    }
}

/** inScope */
function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
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

const pixelStability: Record<string, { firstRedraw: number[]; secondRedraw: number[] }> = {};

// Recreates the chart each iteration: the instability only shows on the first redraw after creation.
// Pixel counts are recorded in metadata.pixelStability; the returned time is the first redraw.
/** inScope */
async function performPixelStability(label: string, next: RectState): Promise<number> {
    await createChart(next);
    await nextFrame();
    const initial = readPixels();

    const elapsed = await timeUpdate(chart!, () => chart!.updateDelta({ data: generateData(next.bars, shift) }));
    await nextFrame();
    const afterFirst = readPixels();

    await chart!.updateDelta({ data: generateData(next.bars, shift) });
    await chart!.waitForUpdate();
    await nextFrame();
    const afterSecond = readPixels();

    pixelStability[label] ??= { firstRedraw: [], secondRedraw: [] };
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
                // AG-18911
                id: 'no-move-redraw',
                label: 'No-Move Redraw',
                variants: shapes.flatMap((shape) =>
                    changes.map((change) => ({
                        params: { Series: shape.kind, Bars: String(shape.bars), Change: change },
                        run: () => performRedraw(shape, change),
                    }))
                ),
            },
            {
                // AG-18915
                id: 'pixel-stability',
                label: 'Pixel Stability (first vs second identical redraw)',
                variants: stabilityCases.map(({ label, state: s }) => ({
                    params: { Series: s.kind, Bars: String(s.bars), Change: label },
                    run: () => performPixelStability(label, s),
                })),
            },
        ],
        config: {
            updatesPerTest: 30,
            maxCollectionTimeMs: 6000,
            warmupUpdates: 5,
        },
        metadata: {
            version: VERSION,
            pixelStability,
        },
        onComplete: async () => {
            console.table(
                Object.entries(pixelStability).map(([label, { firstRedraw, secondRedraw }]) => ({
                    label,
                    firstRedrawMaxChangedPixels: Math.max(...firstRedraw),
                    secondRedrawMaxChangedPixels: Math.max(...secondRedraw),
                }))
            );
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
