// @ag-skip-fws
// @ag-skip-container-check
/* @ag-options-extract */
import {
    type AgChartOptions,
    AgCharts,
    LegendModule,
    MapShapeSeriesModule,
    ModuleRegistry,
    VERSION,
    ZoomModule,
} from 'ag-charts-enterprise';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { ChartRef, hover, performInitialLoad, performPan } from './benchmarkUtils';
import { GRID_SIZE, central, eastern, getGridData, getGridTopology, mountain, pacific } from './data';
import { topology } from './usStatesTopology';
import { worldTopology } from './worldTopology';

ModuleRegistry.registerModules([LegendModule, MapShapeSeriesModule, ZoomModule]);

(window as any).agChartsDebug = 'scene:stats:verbose';

// The options every variant shares. The extracted options can only use `data.ts`, so the topologies and series are
// filled in per variant by `scenarios` below.
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    animation: { enabled: false },
    // Zoom is off by default, and without it neither the zoom state nor a drag moves the map.
    zoom: { enabled: true, buttons: { enabled: false } },
};
/* @ag-options-end */

const GAP = 4;
const worldData = worldTopology.features.map((feature: any) => ({ name: feature.properties.name }));
// The share of the map left in view when zoomed in, and where the zoom centres (as ratios of the full map).
const ZOOMED_IN = 0.1;
const PANNED_AT = 0.25;

interface Scenario {
    id: string;
    name: string;
    regions: number;
    /** Where on the full map the programmatic zoom and the pan are centred, as ratios. */
    focus: { x: number; y: number };
    /** The programmatic zoom steps (in and back out, so even), pan drags and hover positions one timed run makes. */
    zoomSteps: number;
    panDrags: number;
    hoverPositions: number;
    build(gap: number): AgChartOptions;
}

const timezones = [
    { title: 'Pacific', data: pacific },
    { title: 'Mountain', data: mountain },
    { title: 'Central', data: central },
    { title: 'Eastern', data: eastern },
];

// The `gap` key is left out at 0, so a gap 0 chart takes the default path, and a base without the option sees none.
/** inScope */
function gapOf(gap: number): { gap?: number } {
    return gap > 0 && supportsGap() ? { gap } : {};
}

const gridTopology = getGridTopology();
const gridData = getGridData();

/** inScope */
function getScenarios(): Scenario[] {
    return [
        {
            id: 'world',
            name: 'World',
            regions: worldTopology.features.length,
            focus: { x: 0.55, y: 0.6 },
            zoomSteps: 10,
            panDrags: 20,
            hoverPositions: 20,
            build: (gap) => ({
                ...options,
                topology: worldTopology,
                series: [{ type: 'map-shape', idKey: 'name', data: worldData, ...gapOf(gap) }],
            }),
        },
        {
            id: 'us-states',
            name: 'US states',
            regions: timezones.reduce((sum, { data }) => sum + data.length, 0),
            focus: { x: 0.5, y: 0.5 },
            zoomSteps: 10,
            panDrags: 20,
            hoverPositions: 20,
            build: (gap) => ({
                ...options,
                topology,
                series: timezones.map(({ title, data }) => ({
                    type: 'map-shape' as const,
                    idKey: 'name',
                    title,
                    data,
                    ...gapOf(gap),
                })),
                legend: { enabled: true },
            }),
        },
        {
            id: 'grid',
            name: `Grid ${GRID_SIZE}x${GRID_SIZE}`,
            regions: gridData.length,
            focus: { x: 0.5, y: 0.5 },
            // Each grid step costs ten times or more what one does on the other maps, so the grid makes fewer of them.
            zoomSteps: 6,
            panDrags: 6,
            hoverPositions: 10,
            build: (gap) => ({
                ...options,
                topology: gridTopology,
                series: [{ type: 'map-shape', idKey: 'name', data: gridData, ...gapOf(gap) }],
            }),
        },
    ];
}

const container = document.getElementById('myChart')!;
const chartRef: ChartRef = { current: null };

// Whether the library under test has the `gap` option. On a base that doesn't, `gap` is an unknown option that only
// logs a validation warning, so the probe builds a throwaway map with `gap` set and looks for that warning.
let gapSupported: boolean | undefined;

/** inScope */
function supportsGap(): boolean {
    if (gapSupported !== undefined) return gapSupported;

    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;left:-1000px;width:50px;height:50px';
    document.body.appendChild(probe);
    const warnings: string[] = [];
    const { warn } = console;
    console.warn = (...args: unknown[]) => warnings.push(args.map(String).join(' '));
    try {
        const square = [
            [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 0],
            ],
        ];
        const chart = AgCharts.create({
            container: probe,
            animation: { enabled: false },
            topology: {
                type: 'FeatureCollection',
                features: [
                    { type: 'Feature', geometry: { type: 'Polygon', coordinates: square }, properties: { name: 'a' } },
                ],
            },
            series: [{ type: 'map-shape', idKey: 'name', data: [{ name: 'a' }], gap: GAP } as any],
        });
        chart.destroy();
    } finally {
        console.warn = warn;
        probe.remove();
    }
    gapSupported = !warnings.some((message) => message.includes('gap'));
    return gapSupported;
}

/** The zoom state for a window of the full map, `share` wide and high, around the scenario's focus. */
function zoomState(scenario: Scenario, share: number) {
    const range = (centre: number) => {
        const start = Math.min(Math.max(centre - share / 2, 0), 1 - share);
        return { start, end: start + share };
    };
    return { ratioX: range(scenario.focus.x), ratioY: range(scenario.focus.y) };
}

async function setZoom(scenario: Scenario, share: number): Promise<void> {
    const chart = chartRef.current!;
    await chart.setState({ ...chart.getState(), zoom: zoomState(scenario, share) });
    await chart.waitForUpdate();

    // A state that doesn't take effect leaves the chart unzoomed, and the zoom and pan cases would time nothing.
    const applied = chart.getState().zoom?.ratioX;
    const width = applied == null ? 1 : (applied.end ?? 1) - (applied.start ?? 0);
    if (Math.abs(width - share) > 0.01) {
        throw new Error(`Zoom to ${share} of the map did not apply (the chart reports ${width})`);
    }
}

// The options the chart in `chartRef` was last built with.
let builtWith: AgChartOptions | undefined;

/** inScope */
async function chartCreate(chartOptions: AgChartOptions): Promise<number> {
    const elapsed = await performInitialLoad(chartOptions, chartRef, (opts) => AgCharts.create(opts));
    builtWith = chartOptions;
    return elapsed;
}

// Runs an operation on a chart built with the given options and zoomed to `share` of the map. A chart left by an
// earlier variant is rebuilt first, and the zoom is always set, both before the timed section, so each variant starts
// from the same state wherever it runs.
/** inScope */
async function onChart(
    scenario: Scenario,
    chartOptions: AgChartOptions,
    share: number,
    run: () => Promise<number>
): Promise<number> {
    if (builtWith !== chartOptions || chartRef.current == null) {
        chartRef.current?.destroy();
        chartRef.current = AgCharts.create(chartOptions);
        builtWith = chartOptions;
    }
    await chartRef.current.waitForUpdate();
    await setZoom(scenario, share);
    return run();
}

/** Programmatic zoom in to `ZOOMED_IN` of the map and back out again, in `count` steps. */
async function performZoomSteps(scenario: Scenario, count: number): Promise<number> {
    const chart = chartRef.current!;
    const half = count / 2;
    const start = performance.now();
    for (let i = 1; i <= half; i++) {
        await setZoom(scenario, 1 - ((1 - ZOOMED_IN) * i) / half);
    }
    for (let i = half - 1; i >= 0; i--) {
        await setZoom(scenario, 1 - ((1 - ZOOMED_IN) * i) / half);
    }
    await chart.waitForUpdate();
    return performance.now() - start;
}

// Unlike the shared `performDatumHighlight`, each hover waits for its animation frame, so hovers can't merge and the
// closing `mouseleave` can't clear a highlight that hasn't run.
/** inScope */
async function performHighlights(count: number): Promise<number> {
    const chart = chartRef.current!;
    const seriesArea = container.querySelector('.ag-charts-series-area') as HTMLElement;
    const { width, height } = seriesArea.getBoundingClientRect();

    const start = performance.now();
    for (let i = 0; i < count; i++) {
        hover(container, width * 0.1 + width * 0.8 * (i / count), height * 0.5);
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await chart.waitForUpdate();
    }
    const elapsed = performance.now() - start;

    // Clear the highlight, and let that finish so the next variant starts from a settled chart.
    seriesArea.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await chart.waitForUpdate();
    return elapsed;
}

/** inScope */
function getVariants() {
    return getScenarios().flatMap((scenario) =>
        [0, GAP].map((gap) => {
            const chartOptions = scenario.build(gap);
            return { scenario, gap, chartOptions, params: { Map: scenario.name, Gap: `${gap}px` } };
        })
    );
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    const gapAvailable = supportsGap();
    const variants = getVariants();
    return {
        // A base without the option still runs the gap rows, with the gap left out, so every row has a base to compare.
        warnings: gapAvailable
            ? undefined
            : [`Library has no map-shape gap option (${VERSION}): gap ${GAP}px rows run without it`],
        testCases: [
            {
                id: 'initial-load',
                label: 'Initial Load',
                variants: variants.map(({ chartOptions, params }) => ({
                    params,
                    run: () => chartCreate(chartOptions),
                })),
            },
            {
                id: 'zoom',
                label: 'Zoom',
                variants: variants.map(({ scenario, chartOptions, params }) => ({
                    params: { ...params, Steps: `${scenario.zoomSteps}x` },
                    run: () => onChart(scenario, chartOptions, 1, () => performZoomSteps(scenario, scenario.zoomSteps)),
                })),
            },
            {
                id: 'pan',
                label: 'Pan',
                variants: variants.map(({ scenario, chartOptions, params }) => ({
                    params: { ...params, Drags: `${scenario.panDrags}x` },
                    run: () =>
                        onChart(scenario, chartOptions, PANNED_AT, () =>
                            performPan(chartRef.current!, container, scenario.panDrags)
                        ),
                })),
            },
            {
                id: 'hover',
                label: 'Datum Highlight',
                variants: variants.map(({ scenario, chartOptions, params }) => ({
                    params: { ...params, Positions: `${scenario.hoverPositions}x` },
                    run: () => onChart(scenario, chartOptions, 1, () => performHighlights(scenario.hoverPositions)),
                })),
            },
        ],
        config: {
            updatesPerTest: 10,
            maxCollectionTimeMs: 60000,
            warmupUpdates: 2,
        },
        metadata: {
            seriesType: 'map-shape',
            regions: variants
                .filter(({ gap }) => gap === 0)
                .map(({ scenario }) => `${scenario.id}:${scenario.regions}`)
                .join(','),
            version: VERSION,
            expectedRetainedSizeMB: 100,
            expectedCanvasCount: 5,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
