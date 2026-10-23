// @ag-skip-fws
/* @ag-options-extract */
import {
    AgCharts,
    AgStandaloneChartOptions,
    ModuleRegistry,
    OrganizationSeriesModule,
    VERSION,
    ZoomModule,
} from 'ag-charts-enterprise';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { ChartRef, performInitialLoad, scroll } from './benchmarkUtils';
import { type OrgDatum, generateOrg } from './data';

ModuleRegistry.registerModules([OrganizationSeriesModule, ZoomModule]);

// Zoom and pan at 100K nodes run past the per-example timeout.
const NODE_COUNTS = [1_000, 10_000];
const ZOOM_STEPS = 20;
const ZOOM_SCROLLING_STEP = 0.1;
const PAN_REPS = 20;
const PAN_ZOOM_STEPS = 12;
const PAN_DRAG_STEPS = 12;
const STACK_FROM_DEPTH = 4;

const baseOptions: AgStandaloneChartOptions = {
    container: document.getElementById('myChart'),
    animation: { enabled: false },
};

/** inScope */
function createOptions(nodes: number, data: OrgDatum[]): AgStandaloneChartOptions {
    return {
        ...baseOptions,
        title: { text: `Organization with ${nodes.toLocaleString('en-GB')} nodes` },
        data,
        series: [
            {
                type: 'organization',
                idKey: 'id',
                parentIdKey: 'parentId',
                layout: { type: 'stacked', stackFromDepth: STACK_FROM_DEPTH },
            },
        ],
    };
}
/* @ag-options-end */

// First release with `stackFromDepth`; the compare step skips this example on an older published base.
const SERIES_MIN_VERSION = '14.2.0';

const chartRef: ChartRef = { current: null };
const container = document.getElementById('myChart')!;
let chartNodes = 0;
let cached: { nodes: number; data: OrgDatum[] } | null = null;

/** inScope */
function dataFor(nodes: number): OrgDatum[] {
    if (cached?.nodes !== nodes) {
        cached = { nodes, data: generateOrg(nodes) };
    }
    return cached.data;
}

/** inScope */
function optionsFor(nodes: number): AgStandaloneChartOptions {
    return createOptions(nodes, dataFor(nodes));
}

/** inScope */
async function ensureChart(nodes: number): Promise<void> {
    if (chartRef.current == null || chartNodes !== nodes) {
        chartRef.current?.destroy();
        chartRef.current = AgCharts.create(optionsFor(nodes));
        chartNodes = nodes;
    }
    await chartRef.current.waitForUpdate();
}

/** inScope */
async function setZoom(ratio: { start: number; end: number } | null): Promise<void> {
    const chart = chartRef.current!;
    const range = ratio ?? { start: 0, end: 1 };
    await chart.setState({ ...chart.getState(), zoom: { ratioX: range, ratioY: range } });
    await chart.waitForUpdate();
}

/** inScope */
async function performLoad(nodes: number): Promise<number> {
    const options = optionsFor(nodes);
    chartNodes = nodes;
    return performInitialLoad(options, chartRef, (opts) => AgCharts.create(opts));
}

/** inScope */
function zoomWindowWidth(): number {
    const { ratioX } = chartRef.current!.getState().zoom ?? {};
    return (ratioX?.end ?? 1) - (ratioX?.start ?? 0);
}

/** inScope */
async function zoomSteps(deltaY: number, target: number): Promise<number> {
    const chart = chartRef.current!;
    const { width, height } = container.querySelector('.ag-charts-series-area')!.getBoundingClientRect();

    let elapsed = 0;
    for (let step = 0; step < ZOOM_STEPS; step++) {
        const start = performance.now();
        scroll(container, width / 2, height / 2, deltaY, 1);
        await new Promise((resolve) => setTimeout(resolve, 0));
        await chart.waitForUpdate();
        elapsed += performance.now() - start;
    }

    const reached = zoomWindowWidth();
    if (Math.abs(reached - target) > 1e-9) {
        throw new Error(`Zoom ended at a window width of ${reached}, expected ${target}`);
    }
    return elapsed;
}

/** inScope */
async function performZoomInOut(nodes: number): Promise<number> {
    await ensureChart(nodes);
    await setZoom(null);
    const fit = zoomWindowWidth();

    // A window narrower than native pixel size is clamped to it, which reveals the floor for this viewport.
    await setZoom({ start: 0.4999, end: 0.5001 });
    const floor = zoomWindowWidth();
    await setZoom(null);

    // Each wheel step scales the window by `1 + scrollingStep * deltaY`. Aiming half a step past the target
    // lets the last step clamp, so every node count reaches its floor in the same number of steps.
    const stepDelta = (ratio: number) => (ratio ** (1 / (ZOOM_STEPS - 0.5)) - 1) / ZOOM_SCROLLING_STEP;
    const zoomIn = await zoomSteps(stepDelta(floor / fit), floor);
    return zoomIn + (await zoomSteps(stepDelta(fit / floor), fit));
}

/** inScope */
function dragPan(seriesArea: Element, fromX: number, toX: number, y: number): void {
    const { left, top } = seriesArea.getBoundingClientRect();
    const pointer = (type: string, x: number, buttons: number) =>
        new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
            button: 0,
            buttons,
            clientX: left + x,
            clientY: top + y,
            view: window,
        });

    seriesArea.dispatchEvent(pointer('pointerdown', fromX, 1));
    for (let step = 1; step <= PAN_DRAG_STEPS; step++) {
        seriesArea.dispatchEvent(pointer('pointermove', fromX + ((toX - fromX) * step) / PAN_DRAG_STEPS, 1));
    }
    seriesArea.dispatchEvent(pointer('pointerup', toX, 0));
}

/** inScope */
async function performPan(nodes: number): Promise<number> {
    await ensureChart(nodes);
    await setZoom(null);

    const chart = chartRef.current!;
    const seriesArea = container.querySelector('.ag-charts-series-area')!;
    const { width, height } = seriesArea.getBoundingClientRect();
    for (let i = 0; i < PAN_ZOOM_STEPS; i++) {
        scroll(container, width / 2, height / 2, -1, 1);
        await new Promise((resolve) => setTimeout(resolve, 0));
        await chart.waitForUpdate();
    }

    const distance = width / 5;
    const start = performance.now();
    for (let i = 0; i < PAN_REPS; i++) {
        const from = i % 2 === 0 ? width / 2 + distance / 2 : width / 2 - distance / 2;
        const to = i % 2 === 0 ? from - distance : from + distance;
        dragPan(seriesArea, from, to, height / 2);
        await new Promise((resolve) => setTimeout(resolve, 0));
        await chart.waitForUpdate();
    }
    return performance.now() - start;
}

/** inScope */
function nodeLabel(nodes: number): string {
    return nodes.toLocaleString('en-GB');
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    // Gated per variant: a test case with no available variants still completes, whereas an empty config never does.
    const variants = (run: (nodes: number) => Promise<number>, extra?: Record<string, string>) =>
        NODE_COUNTS.map((nodes) => ({
            params: { Nodes: nodeLabel(nodes), ...extra },
            minVersion: SERIES_MIN_VERSION,
            run: () => run(nodes),
        }));

    return {
        testCases: [
            {
                id: 'initial-load',
                label: 'Initial Load',
                variants: variants(performLoad, { Operation: 'Chart Create' }),
            },
            {
                id: 'zoom',
                label: 'Zoom',
                variants: variants(performZoomInOut, { Operation: 'Zoom In To Limit And Out' }),
            },
            {
                id: 'pan',
                label: 'Pan',
                variants: variants(performPan, { Repetitions: String(PAN_REPS) }),
            },
        ],
        config: {
            updatesPerTest: 3,
            maxCollectionTimeMs: 60000,
            warmupUpdates: 1,
        },
        metadata: {
            seriesType: 'organization',
            nodeCounts: NODE_COUNTS,
            zoomSteps: ZOOM_STEPS,
            panReps: PAN_REPS,
            version: VERSION,
            minVersion: SERIES_MIN_VERSION,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
