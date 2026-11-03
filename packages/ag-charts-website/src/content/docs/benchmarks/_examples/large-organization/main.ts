// @ag-skip-fws
/* @ag-options-extract */
import {
    AgChartInstance,
    AgCharts,
    AgStandaloneChartOptions,
    ModuleRegistry,
    OrganizationSeriesModule,
    VERSION,
    ZoomModule,
} from 'ag-charts-enterprise';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { ChartRef, hover, performInitialLoad, scroll } from './benchmarkUtils';
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
const HOVER_STEPS = 12;
const CLICK_ABOVE_FLOOR = 1.5;
const DIRECTOR_BAND = 3;
const CLICK_MIN_RUN = 12;
const CLICK_SEARCH_RADIUS = 200;
const CLICK_SEARCH_STEP = 2;
// Fraction of the chart kept in view, sized so a few columns of cards are large enough to hover.
const HOVER_WINDOW: Record<number, number> = { 1_000: 0.3, 10_000: 0.1 };

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
async function loadFonts(): Promise<void> {
    const loads: Promise<unknown>[] = [];
    document.fonts.forEach((font) => loads.push(font.load()));
    await Promise.all(loads);
}

/** inScope */
async function ensureChart(nodes: number): Promise<void> {
    if (chartRef.current == null || chartNodes !== nodes) {
        chartRef.current?.destroy();
        chartRef.current = AgCharts.create(optionsFor(nodes));
        chartNodes = nodes;
        await chartRef.current.waitForUpdate();

        // The page font loads on first text draw, and its late layout shift refits the zoom, discarding one under way.
        await loadFonts();
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

// Older releases handle a drag from mouse events and newer ones from pointer events, and each ignores the other kind,
// so both are sent for the example to drive either.
/** inScope */
function dispatchPress(seriesArea: Element, type: 'down' | 'move' | 'up', x: number, y: number, buttons: number): void {
    const { left, top } = seriesArea.getBoundingClientRect();
    const init = {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons,
        clientX: left + x,
        clientY: top + y,
        view: window,
    };
    seriesArea.dispatchEvent(
        new PointerEvent(`pointer${type}`, { ...init, pointerId: 1, pointerType: 'mouse', isPrimary: true })
    );
    seriesArea.dispatchEvent(new MouseEvent(`mouse${type}`, init));
}

/** inScope */
function dragPan(seriesArea: Element, fromX: number, toX: number, y: number): void {
    dispatchPress(seriesArea, 'down', fromX, y, 1);
    for (let step = 1; step <= PAN_DRAG_STEPS; step++) {
        const x = fromX + ((toX - fromX) * step) / PAN_DRAG_STEPS;
        dispatchPress(seriesArea, 'move', x, y, 1);
    }
    dispatchPress(seriesArea, 'up', toX, y, 0);
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

// Reads the hover targets from the painted canvas, so they are cards whatever the layout and library version.
/** inScope */
function findCardPoints(count: number): { x: number; y: number }[] {
    const canvas = container.querySelector('canvas')!;
    const area = container.querySelector('.ag-charts-series-area')!.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const scale = canvas.width / canvasRect.width;
    const context = canvas.getContext('2d')!;
    const left = Math.round((area.left - canvasRect.left) * scale);
    const top = (area.top - canvasRect.top) * scale;
    const width = Math.round(area.width * scale);
    const background = context.getImageData(0, 0, 1, 1).data;
    const minRun = 12 * scale;
    const maxRun = (area.width / 3) * scale;

    let best: { x: number; y: number }[] = [];
    for (let fraction = 0.3; fraction <= 0.7; fraction += 0.05) {
        const row = Math.round(top + area.height * scale * fraction);
        const { data } = context.getImageData(left, row, width, 1);
        const points: { x: number; y: number }[] = [];
        let runStart = -1;
        for (let i = 0; i <= width; i++) {
            const painted =
                i < width &&
                (data[i * 4] !== background[0] ||
                    data[i * 4 + 1] !== background[1] ||
                    data[i * 4 + 2] !== background[2] ||
                    data[i * 4 + 3] !== background[3]);
            if (painted && runStart < 0) runStart = i;
            if (!painted && runStart >= 0) {
                const length = i - runStart;
                if (length >= minRun && length <= maxRun) {
                    points.push({ x: (runStart + length / 2) / scale, y: (row - top) / scale });
                }
                runStart = -1;
            }
        }
        if (points.length > best.length) best = points;
    }

    if (best.length < count) throw new Error(`Found ${best.length} cards to hover, expected ${count}`);
    return best.slice(0, count);
}

/** inScope */
async function performHover(nodes: number): Promise<number> {
    await ensureChart(nodes);
    const half = HOVER_WINDOW[nodes] / 2;
    await setZoom({ start: 0.5 - half, end: 0.5 + half });
    const points = findCardPoints(HOVER_STEPS);

    const chart = chartRef.current!;
    const start = performance.now();
    for (const { x, y } of points) {
        hover(container, x, y);
        // The chart handles a hover on the next animation frame, so wait for that before the update it causes.
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await chart.waitForUpdate();
    }
    return performance.now() - start;
}

type ChartState = ReturnType<AgChartInstance['getState']>;

interface ClickToggleTarget {
    // The view with every card expanded, and the one after a director is clicked to collapse it.
    expandedState: ChartState;
    collapsedState: ChartState;
    // A point in the director's pixel row, to find the director again once a view is restored.
    director: { x: number; y: number };
}

const clickToggleTargets = new Map<number, ClickToggleTarget>();

/** inScope */
async function clickAtPoint(point: { x: number; y: number }): Promise<void> {
    const seriesArea = container.querySelector('.ag-charts-series-area')!;
    dispatchPress(seriesArea, 'down', point.x, point.y, 1);
    dispatchPress(seriesArea, 'up', point.x, point.y, 0);
    // The chart handles a click on the next animation frame, so wait for that before the update it causes.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await chartRef.current!.waitForUpdate();
}

// Finds the third band of painted rows in the fit view, which is the directors: the chief executive and the vice
// presidents are above them. At that size the cards are small but painted, and there are no links between them.
/** inScope */
function findDirectorPoint(): { x: number; y: number } {
    const canvas = container.querySelector('canvas')!;
    const area = container.querySelector('.ag-charts-series-area')!.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const scale = canvas.width / canvasRect.width;
    const left = Math.round((area.left - canvasRect.left) * scale);
    const top = Math.round((area.top - canvasRect.top) * scale);
    const width = Math.round(area.width * scale);
    const height = Math.round(area.height * scale);
    const { data } = canvas.getContext('2d')!.getImageData(left, top, width, height);
    const background = canvas.getContext('2d')!.getImageData(0, 0, 1, 1).data;

    const isPainted = (column: number, row: number) => {
        const i = (row * width + column) * 4;
        return (
            data[i] !== background[0] ||
            data[i + 1] !== background[1] ||
            data[i + 2] !== background[2] ||
            data[i + 3] !== background[3]
        );
    };

    let band = 0;
    let inBand = false;
    for (let row = 0; row < height; row++) {
        let painted = false;
        for (let column = 0; column < width && !painted; column++) painted = isPainted(column, row);
        if (painted && !inBand) band++;
        inBand = painted;
        if (painted && band === DIRECTOR_BAND) {
            // The painted pixel nearest the middle of this row is a director.
            let nearest = -1;
            for (let column = 0; column < width; column++) {
                if (
                    isPainted(column, row) &&
                    (nearest < 0 || Math.abs(column - width / 2) < Math.abs(nearest - width / 2))
                ) {
                    nearest = column;
                }
            }
            return { x: nearest / scale, y: (row + 1) / scale };
        }
    }
    throw new Error(`Found fewer than ${DIRECTOR_BAND} bands of cards in the fit view`);
}

// Zooms in with the wheel at `point`, as a user would, until the window is just above the floor, where cards are at
// their native size. A window exactly at the floor is a zoom limit, which the chart does not move.
/** inScope */
async function zoomInAt(point: { x: number; y: number }): Promise<void> {
    const chart = chartRef.current!;
    const fit = zoomWindowWidth();
    await setZoom({ start: 0.4999, end: 0.5001 });
    const target = zoomWindowWidth() * CLICK_ABOVE_FLOOR;
    await setZoom(null);

    for (let step = 0; step < ZOOM_STEPS * 4 && zoomWindowWidth() > target; step++) {
        scroll(container, point.x, point.y, -1, 1);
        await new Promise((resolve) => setTimeout(resolve, 0));
        await chart.waitForUpdate();
    }
    if (zoomWindowWidth() > target || zoomWindowWidth() >= fit) throw new Error('Could not zoom in to the floor');
}

// The painted run of a card in the canvas row at `y` nearest `x`, or undefined where the row holds no card.
/** inScope */
function findCardRun(y: number, x: number): number | undefined {
    const canvas = container.querySelector('canvas')!;
    const area = container.querySelector('.ag-charts-series-area')!.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const scale = canvas.width / canvasRect.width;
    const context = canvas.getContext('2d')!;
    const left = Math.round((area.left - canvasRect.left) * scale);
    const width = Math.round(area.width * scale);
    const row = Math.round((area.top - canvasRect.top + y) * scale);
    const background = context.getImageData(0, 0, 1, 1).data;
    const { data } = context.getImageData(left, row, width, 1);

    let nearest: number | undefined;
    let runStart = -1;
    for (let i = 0; i <= width; i++) {
        const painted =
            i < width &&
            (data[i * 4] !== background[0] ||
                data[i * 4 + 1] !== background[1] ||
                data[i * 4 + 2] !== background[2] ||
                data[i * 4 + 3] !== background[3]);
        if (painted && runStart < 0) runStart = i;
        if (!painted && runStart >= 0) {
            const length = i - runStart;
            const centre = (runStart + length / 2) / scale;
            if (length >= CLICK_MIN_RUN * scale && (nearest == null || Math.abs(centre - x) < Math.abs(nearest - x))) {
                nearest = centre;
            }
            runStart = -1;
        }
    }
    return nearest;
}

// The card nearest `point`, searching outward through the canvas rows because zooming in at a point can leave it a
// little short of the card it was over.
/** inScope */
function findCardNear(point: { x: number; y: number }): { x: number; y: number } {
    for (let offset = 0; offset <= CLICK_SEARCH_RADIUS; offset += CLICK_SEARCH_STEP) {
        for (const y of offset === 0 ? [point.y] : [point.y - offset, point.y + offset]) {
            const x = findCardRun(y, point.x);
            if (x != null) return { x, y };
        }
    }
    throw new Error('No card found near the point to click');
}

/** inScope */
async function findClickToggleTarget(): Promise<ClickToggleTarget> {
    const chart = chartRef.current!;
    const collapsedCount = () => (chart.getState().collapsed ?? []).length;
    await chart.setState({ ...chart.getState(), collapsed: [] });
    await setZoom(null);

    const director = findDirectorPoint();
    await zoomInAt(director);

    const expandedState = chart.getState();
    const collapsePoint = findCardNear(director);
    await clickAtPoint(collapsePoint);
    if (collapsedCount() === 0) throw new Error('The director did not collapse when clicked');

    // A toggle holds the card in place, so the collapsed director is in the same row.
    const collapsedState = chart.getState();
    await clickAtPoint(findCardNear(collapsePoint));
    if (collapsedCount() !== 0) throw new Error('The director did not expand when clicked');

    return { expandedState, collapsedState, director: collapsePoint };
}

/** inScope */
async function performClickToggle(nodes: number, operation: 'Collapse' | 'Expand'): Promise<number> {
    await ensureChart(nodes);
    const chart = chartRef.current!;

    let target = clickToggleTargets.get(nodes);
    if (target == null) {
        target = await findClickToggleTarget();
        clickToggleTargets.set(nodes, target);
    }

    // Start from the opposite state, outside the timing.
    const collapse = operation === 'Collapse';
    await chart.setState(collapse ? target.expandedState : target.collapsedState);
    await chart.waitForUpdate();

    const before = (chart.getState().collapsed ?? []).length;
    const point = findCardNear(target.director);
    const start = performance.now();
    await clickAtPoint(point);
    const elapsed = performance.now() - start;

    if ((chart.getState().collapsed ?? []).length === before)
        throw new Error(`${operation} click did not toggle a card`);
    return elapsed;
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
            {
                id: 'hover',
                label: 'Hover',
                variants: variants(performHover, { Hovers: String(HOVER_STEPS) }),
            },
            {
                id: 'click-toggle',
                label: 'Click To Collapse And Expand',
                variants: (['Collapse', 'Expand'] as const).flatMap((operation) =>
                    variants((nodes) => performClickToggle(nodes, operation), { Operation: operation })
                ),
            },
        ],
        config: {
            updatesPerTest: 5,
            maxCollectionTimeMs: 60000,
            warmupUpdates: 1,
        },
        metadata: {
            seriesType: 'organization',
            nodeCounts: NODE_COUNTS,
            zoomSteps: ZOOM_STEPS,
            panReps: PAN_REPS,
            hoverSteps: HOVER_STEPS,
            version: VERSION,
            minVersion: SERIES_MIN_VERSION,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
